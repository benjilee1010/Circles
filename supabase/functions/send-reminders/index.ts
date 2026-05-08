import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Crcls <onboarding@resend.dev>';
const APP_URL = 'https://crcls.vercel.app';

// HTML-escape user-supplied strings before injecting into email templates
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Map frequency codes to days (mirrors lib/frequencies.ts)
function frequencyToDays(freq: string): number {
  if (freq === 'weekly') return 7;
  if (freq === 'annually') return 365;
  const months = parseInt(freq.replace('m', ''), 10);
  return isNaN(months) ? 30 : months * 30;
}

function friendlyFrequency(freq: string): string {
  if (freq === 'weekly') return 'weekly';
  if (freq === 'annually') return 'annually';
  const months = parseInt(freq.replace('m', ''), 10);
  if (months === 1) return 'monthly';
  return `every ${months} months`;
}

const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET');

Deno.serve(async (req) => {
  // Reject unauthenticated callers — only the scheduler (which supplies the
  // shared secret) should be able to trigger this function.
  if (FUNCTION_SECRET) {
    const auth = req.headers.get('Authorization');
    if (auth !== `Bearer ${FUNCTION_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Fetch all contacts
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, name, user_id, last_contacted_at, reminder_frequency');

  if (error) {
    console.error('Failed to fetch contacts:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Fetch all user emails via admin API
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Failed to fetch users:', usersError);
    return new Response(JSON.stringify({ error: usersError.message }), { status: 500 });
  }

  const emailMap: Record<string, string> = {};
  for (const u of users) {
    if (u.email) emailMap[u.id] = u.email;
  }

  // Compute overdue contacts grouped by user
  const now = new Date();
  const overdueByUser: Record<string, { name: string; daysSince: number | null; freq: string }[]> = {};

  for (const c of contacts ?? []) {
    const threshold = frequencyToDays(c.reminder_frequency);
    const lastDate = c.last_contacted_at ? new Date(c.last_contacted_at) : null;
    const daysSince = lastDate
      ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const isOverdue = daysSince === null || daysSince >= threshold;
    if (!isOverdue) continue;

    if (!overdueByUser[c.user_id]) overdueByUser[c.user_id] = [];
    overdueByUser[c.user_id].push({
      name: c.name,
      daysSince,
      freq: c.reminder_frequency,
    });
  }

  // Send one email per user
  const results: { email: string; status: number }[] = [];

  for (const [userId, overdue] of Object.entries(overdueByUser)) {
    const email = emailMap[userId];
    if (!email) continue;

    const rows = overdue
      .map((c) => {
        const since =
          c.daysSince === null
            ? 'never contacted'
            : c.daysSince === 0
            ? 'last seen today'
            : `last seen ${c.daysSince} day${c.daysSince !== 1 ? 's' : ''} ago`;
        return `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
              <strong style="color: #1a1a1a;">${escapeHtml(c.name)}</strong>
              <span style="color: #888; font-size: 13px; margin-left: 8px;">${escapeHtml(since)}</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-align: right;">
              ${escapeHtml(friendlyFrequency(c.freq))}
            </td>
          </tr>`;
      })
      .join('');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 6px;">Time to reach out 👋</h1>
        <p style="color: #666; font-size: 15px; margin: 0 0 28px;">
          Here's your weekly roundup. You have <strong>${overdue.length}</strong> overdue check-in${overdue.length !== 1 ? 's' : ''} — a good week to reach out.
        </p>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 8px; border-bottom: 2px solid #eee;">Person</th>
              <th style="text-align: right; font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 8px; border-bottom: 2px solid #eee;">Frequency</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="margin-top: 28px;">
          <a href="${APP_URL}" style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
            Open Crcls
          </a>
        </div>

        <p style="margin-top: 32px; font-size: 12px; color: #bbb;">
          You're receiving this because you use Crcls.
          <a href="${APP_URL}" style="color: #bbb;">crcls.vercel.app</a>
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: `Your weekly Crcls check-in — ${overdue.length} person${overdue.length !== 1 ? 's' : ''} to reach out to`,
        html,
      }),
    });

    results.push({ email, status: res.status });
    console.log(`Sent to ${email}: ${res.status}`);
  }

  return new Response(
    JSON.stringify({ sent: results.length, results }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});

-- Add "regular" flags to contacts so users can mark people they
-- see or talk to frequently without needing to log every interaction.
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS is_regular_hangout BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_regular_checkin BOOLEAN NOT NULL DEFAULT FALSE;

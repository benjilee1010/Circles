import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';

interface Props {
  contactId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  size?: number;
  editable?: boolean;
  onUpdated?: (url: string) => void;
}

export function ContactAvatar({
  contactId, userId, name, avatarUrl,
  size = 56, editable = false, onUpdated,
}: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const displayUri = localUri ?? avatarUrl;
  const initials = name.charAt(0).toUpperCase();
  const bgColor = stringToColor(name);

  async function handlePress() {
    if (!editable) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access in Settings to add a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setLocalUri(asset.uri);
    setUploading(true);

    try {
      // Fetch the image as a blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const rawExt = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      const ext = allowedExts.includes(rawExt) ? rawExt : 'jpg';
      const path = `${userId}/${contactId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Cache-bust so the image refreshes
      const url = `${publicUrl}?t=${Date.now()}`;

      await supabase.from('contacts').update({ avatar_url: url }).eq('id', contactId);
      onUpdated?.(url);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Could not upload photo.');
      setLocalUri(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!editable}
      activeOpacity={editable ? 0.7 : 1}
      style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {displayUri ? (
        <Image
          source={{ uri: displayUri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.initials, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
          <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
      )}

      {uploading && (
        <View style={[styles.overlay, { borderRadius: size / 2 }]}>
          <ActivityIndicator color="#fff" />
        </View>
      )}

      {editable && !uploading && (
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>✎</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function stringToColor(name: string): string {
  const palette = ['#E8D5C4', '#C4D5E8', '#C4E8D5', '#E8C4D5', '#D5C4E8', '#E8E4C4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    wrap: { position: 'relative' },
    image: { resizeMode: 'cover' },
    initials: { alignItems: 'center', justifyContent: 'center' },
    initialsText: { fontWeight: '700', color: '#2C2C2E' },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center', justifyContent: 'center',
    },
    editBadge: {
      position: 'absolute', bottom: 0, right: 0,
      backgroundColor: colors.text, borderRadius: 10,
      width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: colors.background,
    },
    editBadgeText: { fontSize: 10, color: colors.background },
  });
}

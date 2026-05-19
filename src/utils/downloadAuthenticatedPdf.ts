import { Alert, Platform, Share } from 'react-native';
import axios from 'axios';

import { env } from '@/config/env';
import { getToken } from '@/lib/keychain';
import { API_BASE_URL } from '@/utils/constants/api.constant';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const g = globalThis as unknown as { btoa?: (s: string) => string };
  if (typeof g.btoa === 'function') {
    return g.btoa(binary);
  }
  throw new Error('Base64 encoding is not available in this runtime');
}

/**
 * GETs a PDF with the same auth headers as the app, then opens the system share sheet.
 * Uses a data URL on iOS; Android attempts the same with a fallback alert on failure.
 */
export async function shareAuthenticatedPdf(path: string, title: string): Promise<void> {
  const token = await getToken();
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-tenant-host': `${env.ORG_SLUG}.dribee.com`,
    },
    timeout: 120_000,
  });
  const contentType = String(response.headers['content-type'] ?? '');
  if (response.data.byteLength > 0 && contentType && !contentType.includes('application/pdf')) {
    const u8 = new Uint8Array(response.data).slice(0, 240);
    let prefix = '';
    for (let i = 0; i < u8.length; i += 1) prefix += String.fromCharCode(u8[i]!);
    if (prefix.trim().startsWith('{') || prefix.includes('"success"') || prefix.includes('"message"')) {
      throw new Error('Server returned JSON instead of a PDF. Is the credit note generated yet?');
    }
  }
  const base64 = arrayBufferToBase64(response.data);
  const dataUrl = `data:application/pdf;base64,${base64}`;
  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { url: dataUrl, title }
        : { message: title, url: dataUrl, title },
    );
  } catch (e) {
    if ((e as { message?: string })?.message === 'User did not share') return;
    Alert.alert(
      'Could not share PDF',
      Platform.OS === 'android'
        ? 'Try opening this return again after the credit note is issued, or update your device if sharing PDFs fails.'
        : 'Try again or save from another device.',
    );
    throw e;
  }
}

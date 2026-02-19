import Constants from 'expo-constants';

// Prefer an explicit public env var if provided.
// On device, "localhost" refers to the phone, so you should override this
// in `.env` with your machine's LAN IP, e.g.:
// EXPO_PUBLIC_API_URL=http://192.168.1.10:3001
const envBaseUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig as any)?.extra?.apiBaseUrl;

export const API_BASE_URL = envBaseUrl ?? 'http://localhost:3001';

export async function postJson<TReq, TRes>(
  path: string,
  body: TReq,
): Promise<TRes> {
  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(
      `Cannot reach API at ${url}. Is the server running? (node api-server.js) On device, use EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:3001 in .env`,
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Common when EXPO_PUBLIC_API_URL points to Metro (8081), which returns HTML.
    const hint =
      text.trim().startsWith('<')
        ? ' (Looks like HTML — check EXPO_PUBLIC_API_URL, it must point to your backend port 3001, not Metro 8081.)'
        : '';
    throw new Error(
      `Expected JSON from ${url} but got ${contentType || 'unknown content-type'}${hint}. First 120 chars: ${text
        .slice(0, 120)
        .replace(/\s+/g, ' ')}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      json?.error || json?.message || `Request failed with ${response.status}`,
    );
  }

  return json as TRes;
}


const CLOUD_CONFIG = {
  mode: import.meta.env.VITE_CLOUD_SYNC_MODE || 'disabled',
  endpoint: import.meta.env.VITE_CLOUD_SYNC_ENDPOINT || '',
  apiKey: import.meta.env.VITE_CLOUD_SYNC_API_KEY || '',
  project: import.meta.env.VITE_CLOUD_PROJECT || 'tt-membership',
};

export function getCloudConfig() {
  return { ...CLOUD_CONFIG, enabled: Boolean(CLOUD_CONFIG.endpoint || CLOUD_CONFIG.mode === 'mock') };
}

export function isCloudConfigured() {
  return Boolean(CLOUD_CONFIG.endpoint || CLOUD_CONFIG.mode === 'mock');
}

function buildHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (CLOUD_CONFIG.apiKey) headers.Authorization = `Bearer ${CLOUD_CONFIG.apiKey}`;
  return headers;
}

function buildSnapshot(payload, meta = {}) {
  return {
    project: CLOUD_CONFIG.project,
    version: 1,
    createdAt: new Date().toISOString(),
    ...meta,
    payload,
  };
}

function getMockKey(userId = 'guest') {
  return `tt-cloud-mock-${userId}`;
}

export async function pushCloudSnapshot({ user, payload, source = 'manual' }) {
  const snapshot = buildSnapshot(payload, { userId: user?.id || 'guest', role: user?.role || 'guest', source });
  if (CLOUD_CONFIG.mode === 'mock' || !CLOUD_CONFIG.endpoint) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getMockKey(snapshot.userId), JSON.stringify(snapshot));
    }
    return { ok: true, mode: 'mock', snapshot };
  }

  const response = await fetch(CLOUD_CONFIG.endpoint, {
    method: 'POST',
    headers: buildHeaders({ 'x-tt-project': CLOUD_CONFIG.project }),
    body: JSON.stringify(snapshot),
  });
  if (!response.ok) throw new Error(`Bulut kaydı başarısız (${response.status})`);
  const data = await response.json().catch(() => ({}));
  return { ok: true, mode: 'remote', snapshot: data?.snapshot || snapshot, data };
}

export async function pullCloudSnapshot({ user }) {
  const userId = user?.id || 'guest';
  if (CLOUD_CONFIG.mode === 'mock' || !CLOUD_CONFIG.endpoint) {
    if (typeof window === 'undefined') return { ok: false, snapshot: null };
    const raw = window.localStorage.getItem(getMockKey(userId));
    return { ok: Boolean(raw), mode: 'mock', snapshot: raw ? JSON.parse(raw) : null };
  }

  const url = new URL(CLOUD_CONFIG.endpoint);
  url.searchParams.set('project', CLOUD_CONFIG.project);
  url.searchParams.set('userId', userId);
  const response = await fetch(url.toString(), { method: 'GET', headers: buildHeaders() });
  if (!response.ok) throw new Error(`Bulut verisi alınamadı (${response.status})`);
  const data = await response.json().catch(() => ({}));
  return { ok: Boolean(data?.snapshot), mode: 'remote', snapshot: data?.snapshot || null, data };
}

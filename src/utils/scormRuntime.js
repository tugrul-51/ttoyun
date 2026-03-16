const QUEUE_KEY = 'tt-scorm-queue-v3';
let scormApi = null;
let scormVersion = null;
let initialized = false;

function getQueue() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setQueue(queue) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-50)));
}

function queueEntry(entry) {
  if (typeof window === 'undefined') return;
  const queue = getQueue();
  queue.push({ ts: Date.now(), ...entry });
  setQueue(queue);
}

function shouldUseScormQueue() {
  if (typeof window === 'undefined') return false;
  if (scormApi || initialized) return true;
  return isScormAvailable();
}

function findApi(win) {
  let current = win;
  let depth = 0;

  while (current && depth < 20) {
    try {
      if (current.API_1484_11) return { api: current.API_1484_11, version: '2004' };
      if (current.API) return { api: current.API, version: '1.2' };
      if (current.parent && current.parent !== current) current = current.parent;
      else break;
    } catch {
      break;
    }
    depth += 1;
  }

  return null;
}

export function isScormAvailable() {
  const found = typeof window !== 'undefined' ? findApi(window) : null;
  return !!found;
}

function apiCall(method12, method2004, ...args) {
  if (!scormApi || !initialized) return null;
  try {
    const result = scormVersion === '2004' ? scormApi[method2004](...args) : scormApi[method12](...args);
    return result;
  } catch (error) {
    console.error('[SCORM] API call error:', error);
    queueEntry({ type: 'api-error', method12, method2004, args });
    return null;
  }
}

export function initScorm() {
  if (initialized) return true;
  if (typeof window === 'undefined') return false;

  const found = findApi(window);
  if (!found) return false;

  scormApi = found.api;
  scormVersion = found.version;
  const result = apiCall('LMSInitialize', 'Initialize', '');
  initialized = result === 'true' || result === true;
  if (initialized) flushQueuedData();
  return initialized;
}

export function getScormValue(key) {
  const result = apiCall('LMSGetValue', 'GetValue', key);
  return result ?? '';
}

export function setScormValue(key, value) {
  if (!scormApi || !initialized) {
    if (shouldUseScormQueue()) queueEntry({ type: 'set', key, value });
    return false;
  }
  const result = apiCall('LMSSetValue', 'SetValue', key, String(value));
  return result === 'true' || result === true;
}

export function commitScorm() {
  if (!scormApi || !initialized) return false;
  flushQueuedData();
  const result = apiCall('LMSCommit', 'Commit', '');
  return result === 'true' || result === true;
}

export function finishScorm() {
  if (!scormApi || !initialized) return false;
  const result = apiCall('LMSFinish', 'Terminate', '');
  initialized = false;
  return result === 'true' || result === true;
}

export function flushQueuedData() {
  if (!scormApi || !initialized) return false;
  const queue = getQueue();
  if (!queue.length) return true;
  const remaining = [];
  queue.forEach((entry) => {
    if (entry.type === 'set') {
      const ok = setScormValue(entry.key, entry.value);
      if (!ok) remaining.push(entry);
    }
  });
  setQueue(remaining);
  return remaining.length === 0;
}

export function setScormStatus(status) {
  const key = scormVersion === '2004' ? 'cmi.completion_status' : 'cmi.core.lesson_status';
  return setScormValue(key, status);
}

export function setScormScore(score) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  if (scormVersion === '2004') {
    return setScormValue('cmi.score.min', 0)
      && setScormValue('cmi.score.max', 100)
      && setScormValue('cmi.score.raw', safeScore)
      && setScormValue('cmi.progress_measure', safeScore / 100);
  }
  return setScormValue('cmi.core.score.min', 0)
    && setScormValue('cmi.core.score.max', 100)
    && setScormValue('cmi.core.score.raw', safeScore);
}

export function setScormLocation(location) {
  const key = scormVersion === '2004' ? 'cmi.location' : 'cmi.core.lesson_location';
  return setScormValue(key, location);
}

export function setScormSessionTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  if (scormVersion === '2004') {
    const duration = `PT${safe}S`;
    return setScormValue('cmi.session_time', duration);
  }
  const hh = String(Math.floor(safe / 3600)).padStart(2, '0');
  const mm = String(Math.floor((safe % 3600) / 60)).padStart(2, '0');
  const ss = String(Math.floor(safe % 60)).padStart(2, '0');
  return setScormValue('cmi.core.session_time', `${hh}:${mm}:${ss}`);
}

export function setScormProgressData(data = {}) {
  const payload = JSON.stringify(data).slice(0, 3500);
  const ok = setScormSuspendData(payload);
  if (ok && scormVersion === '2004' && typeof data.correct === 'number' && typeof data.total === 'number') {
    setScormValue('cmi.success_status', data.correct / Math.max(1, data.total) >= 0.6 ? 'passed' : 'failed');
  }
  return ok;
}

export function getScormSuspendData() {
  return getScormValue('cmi.suspend_data');
}

export function setScormSuspendData(value) {
  if (!shouldUseScormQueue()) return false;
  const ok = setScormValue('cmi.suspend_data', value);
  if (ok) commitScorm();
  return ok;
}

export function getScormDebugInfo() {
  return { hasApi: !!scormApi, scormVersion, initialized, queued: getQueue().length };
}

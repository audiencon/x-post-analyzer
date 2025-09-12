interface UsageData {
  count: number;
  timestamp: number;
}

function readUsage(storageKey: string): UsageData | null {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as UsageData) : null;
  } catch {
    return null;
  }
}

function writeUsage(storageKey: string, data: UsageData) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function checkClientRateLimit(
  storageKey: string,
  maxRequests: number,
  windowMs: number
): { allowed: true } | { allowed: false; timeLeftMinutes: number } {
  const now = Date.now();
  let usage = readUsage(storageKey);

  if (!usage || now - usage.timestamp > windowMs) {
    usage = { count: 0, timestamp: now };
  }

  if (usage.count >= maxRequests) {
    const timeLeftMinutes = Math.ceil((usage.timestamp + windowMs - now) / (60 * 1000));
    return { allowed: false, timeLeftMinutes };
  }

  usage.count += 1;
  usage.timestamp = now;
  writeUsage(storageKey, usage);
  return { allowed: true };
}




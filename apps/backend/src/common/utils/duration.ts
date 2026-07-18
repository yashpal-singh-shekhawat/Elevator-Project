const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000
};

/** Parses strings like "15m", "7d", "1h", "30s" into milliseconds. */
export function parseDurationMs(input: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${input}". Expected e.g. "15m", "7d", "1h", "30s".`);
  }
  const [, value, unit] = match;
  return Number(value) * UNIT_MS[unit];
}

export function addDuration(date: Date, durationString: string): Date {
  return new Date(date.getTime() + parseDurationMs(durationString));
}

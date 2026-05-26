export function tryParseJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    const trimmed = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
    return JSON.parse(trimmed);
  }
}
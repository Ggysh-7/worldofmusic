/**
 * 把 "m:ss" 字符串（例："4:13"）转成总秒数（例：253）
 * 传的是 number（已算好的秒数）就原样返回
 * 错的或空的返回 0
 */
export function durationToSeconds(duration) {
  if (!duration) return 0;
  if (typeof duration === "number") return Math.max(0, duration) | 0;
  if (typeof duration !== "string") return 0;
  const parts = duration.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

/**
 * 把秒数（例：73）格式化成 "m:ss"（例："1:13"）
 */
export function formatSeconds(sec) {
  const s = Math.max(0, sec | 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

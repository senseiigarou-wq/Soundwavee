export function formatTime(s: number): string {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
}
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
export function isJamendoId(id: string): boolean {
  return id.startsWith('jamendo_');
}
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
export function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'");
}
export function cleanSongTitle(t: string): string {
  return t.replace(/\(.*?\)|\[.*?\]/g,'').trim();
}

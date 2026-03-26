const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function getWeekDates(weekStart: string): { day: string; label: string; fullLabel: string; date: Date; dateStr: string }[] {
  const start = new Date(weekStart + 'T00:00:00');
  return DAYS.map((day, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      day,
      label: DAY_LABELS[i],
      fullLabel: DAY_FULL[i],
      date: d,
      dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
    };
  });
}

export function shiftWeek(weekStart: string, offset: number): string {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + offset * 7);
  return d.toISOString().split('T')[0];
}

export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
}

export function detectPlatform(url: string): string {
  if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  return 'other';
}

export function getPlatformIcon(platform: string): string {
  switch (platform) {
    case 'instagram': return '📸';
    case 'youtube': return '▶️';
    case 'facebook': return '📘';
    default: return '🔗';
  }
}

export { DAYS, DAY_LABELS, DAY_FULL };

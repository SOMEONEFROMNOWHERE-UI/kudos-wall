export function getInitials(name: string): string {
  if (!name) return '';
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function hslToRgbString(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  
  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  return `${r}, ${g}, ${b}`;
}

export function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    base: `hsl(${hue}, 70%, 60%)`,
    ring: `hsla(${hue}, 70%, 60%, 0.2)`,
    hoverRing: `hsla(${hue}, 70%, 60%, 0.4)`,
    text: `hsl(${hue}, 80%, 15%)`,
    rgb: hslToRgbString(hue, 70, 60),
  };
}

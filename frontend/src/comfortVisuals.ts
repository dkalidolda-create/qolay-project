export const BRIGHTNESS_LABELS: Record<string, string> = {
  dark: "Темно",
  dim: "Приглушённый свет",
  normal: "Нормальное освещение",
  bright: "Ярко",
  very_bright: "Очень ярко",
};

export const NOISE_LABELS: Record<string, string> = {
  quiet: "Тихо",
  mild: "Немного шума",
  noisy: "Шумно",
  very_noisy: "Очень шумно",
};

export function comfortColor(score: number): { primary: string; glow: string } {
  if (score >= 85) {
    return { primary: "20, 184, 166", glow: "rgba(20, 184, 166, 0.35)" };
  }
  if (score >= 60) {
    return { primary: "138, 148, 166", glow: "rgba(138, 148, 166, 0.25)" };
  }
  return { primary: "232, 121, 45", glow: "rgba(232, 121, 45, 0.4)" };
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

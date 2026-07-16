export interface ComfortBreakdown {
  temperature: number;
  noise: number;
  brightness: number;
}

export interface ComfortResult {
  score: number;
  label: string;
  breakdown: ComfortBreakdown;
}

function temperaturePenalty(temp: number): [number, string] {
  if (temp >= 20 && temp <= 24) return [0, ""];
  if (temp > 24 && temp <= 26) return [-10, "Жарко"];
  if (temp > 26) return [-25, "Очень жарко"];
  if (temp >= 18 && temp < 20) return [-10, "Прохладно"];
  return [-25, "Очень холодно"];
}

const NOISE_PENALTIES: Record<string, [number, string]> = {
  quiet: [0, "Тихо"],
  mild: [-5, ""],
  noisy: [-20, "Шумно"],
  very_noisy: [-30, "Очень шумно"],
};

const BRIGHTNESS_PENALTIES: Record<string, [number, string]> = {
  dark: [-15, "Темно"],
  dim: [-5, ""],
  normal: [0, ""],
  bright: [-5, ""],
  very_bright: [-15, "Слишком ярко"],
};

export function calculateComfort(
  temperature: number,
  noise: string | null,
  brightness: string | null,
): ComfortResult {
  const [tempPenalty, tempLabel] = temperaturePenalty(temperature);
  const [noisePenalty, noiseLabel] = noise
    ? (NOISE_PENALTIES[noise] ?? [0, ""])
    : [0, ""];
  const [brightPenalty, brightLabel] = brightness
    ? (BRIGHTNESS_PENALTIES[brightness] ?? [0, ""])
    : [0, ""];

  const score = Math.max(0, 100 + tempPenalty + noisePenalty + brightPenalty);

  const penalties: [number, string][] = [
    [tempPenalty, tempLabel] as [number, string],
    [noisePenalty, noiseLabel] as [number, string],
    [brightPenalty, brightLabel] as [number, string],
  ].sort((a, b) => a[0] - b[0]);

  const worst = penalties.find(([, label]) => label)?.[1];

  let label: string;
  if (score >= 85) label = "Комфортно";
  else if (worst) label = worst;
  else label = "Нормально";

  return {
    score,
    label,
    breakdown: {
      temperature: tempPenalty,
      noise: noisePenalty,
      brightness: brightPenalty,
    },
  };
}

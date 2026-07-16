export const PALETTE = {
  bg: "#FAFAF9",
  control: "#0F766E",
  controlSoft: "#CFEAE6",
  accent: "#FF6B4A",
} as const;

export const TEMP_STOPS = [
  { t: 10, c: "#1B5FC4", label: "Холодно" },
  { t: 18, c: "#12A69B", label: "Прохладно" },
  { t: 23, c: "#0F9B6C", label: "Комфортно" },
  { t: 27, c: "#E8A23F", label: "Тепло" },
  { t: 31, c: "#FF6B4A", label: "Жарко" },
  { t: 36, c: "#D62B10", label: "Очень жарко" },
] as const;

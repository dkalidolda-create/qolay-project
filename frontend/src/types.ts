export interface CurrentState {
  atrium_temperature: number;
  outside_temperature: number | null;
  brightness: string | null;
  noise: string | null;
  measured_at: string;
  comfort_score: number;
  comfort_label: string;
  comfort_breakdown: {
    temperature: number;
    noise: number;
    brightness: number;
  };
  delta_outside_inside: number | null;
}

export interface DayStats {
  date: string;
  min_temperature: number;
  max_temperature: number;
  avg_temperature: number;
  coolest_time: string;
  quietest_time: string | null;
}

export interface Summary {
  current: CurrentState;
  day_stats: DayStats;
}

export interface Reading {
  id: number;
  measured_at: string;
  location: "atrium" | "outside";
  temperature: number;
  brightness: string | null;
  noise: string | null;
}

export type ReportCategory =
  | "too_hot"
  | "too_noisy"
  | "too_bright"
  | "too_dark"
  | "comfortable"
  | "other";

export type ReportStatus = "open" | "resolved";

export interface Report {
  id: number;
  created_at: string;
  category: ReportCategory;
  comment: string | null;
  status: ReportStatus;
}

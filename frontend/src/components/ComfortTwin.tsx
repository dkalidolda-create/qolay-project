import { useState } from "react";
import type { CurrentState } from "../types";
import {
  BRIGHTNESS_LABELS,
  NOISE_LABELS,
  comfortColor,
  formatTime,
} from "../comfortVisuals";

interface Props {
  current: CurrentState;
}

export default function ComfortTwin({ current }: Props) {
  const [showPopup, setShowPopup] = useState(false);
  const { primary, glow } = comfortColor(current.comfort_score);

  return (
    <div className="twin">
      <img
        src="/atrium.jpg"
        alt="Атриум университета"
        className="twin__photo"
      />

      <div
        className="twin__wash"
        style={{
          background: `radial-gradient(circle at 48% 62%, ${glow}, transparent 65%)`,
          ["--pulse-rgb" as string]: primary,
        }}
      />

      <div className="twin__vignette" />

      <button
        className="twin__marker"
        style={{ ["--pulse-rgb" as string]: primary }}
        onClick={() => setShowPopup((s) => !s)}
        aria-expanded={showPopup}
        aria-label="Показать подробности измерения"
      >
        <span className="twin__marker-ring" />
        <span className="twin__marker-ring twin__marker-ring--delay" />
        <span className="twin__marker-dot" />
      </button>

      {showPopup && (
        <div className="twin__popup" role="dialog">
          <div className="twin__popup-row">
            <span>Освещение</span>
            <strong>
              {current.brightness
                ? (BRIGHTNESS_LABELS[current.brightness] ?? current.brightness)
                : "—"}
            </strong>
          </div>
          <div className="twin__popup-row">
            <span>Шум</span>
            <strong>
              {current.noise
                ? (NOISE_LABELS[current.noise] ?? current.noise)
                : "—"}
            </strong>
          </div>
          <div className="twin__popup-row">
            <span>Обновлено</span>
            <strong>{formatTime(current.measured_at)}</strong>
          </div>
        </div>
      )}

      <div className="twin__readout">
        <span className="twin__eyebrow">Атриум · сейчас</span>
        <div className="twin__temp">
          {current.atrium_temperature.toFixed(1)}°
        </div>
        <div className="twin__label">{current.comfort_label}</div>
      </div>

      {current.delta_outside_inside !== null && (
        <div className="twin__delta">
          на улице {current.outside_temperature?.toFixed(1)}°
          <span className="twin__delta-diff">
            {current.delta_outside_inside > 0 ? "+" : ""}
            {current.delta_outside_inside}° к улице
          </span>
        </div>
      )}
    </div>
  );
}

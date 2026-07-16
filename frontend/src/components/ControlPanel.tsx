import { PALETTE } from "../theme";

export type SceneMode = "atrium_temp" | "outside_temp" | "brightness" | "noise";

interface Props {
  mode: SceneMode;
  onChange: (mode: SceneMode) => void;
}

const BUTTONS: { mode: SceneMode; label: string }[] = [
  { mode: "atrium_temp", label: "Temp. атриума" },
  { mode: "outside_temp", label: "Temp. снаружи" },
  { mode: "brightness", label: "Освещение" },
  { mode: "noise", label: "Шум" },
];

export default function ControlPanel({ mode, onChange }: Props) {
  return (
    <div
      className="fixed bottom-6 right-6 z-30 flex flex-col gap-1.5 rounded-2xl p-2 shadow-lg border backdrop-blur-xl"
      style={{
        background: "rgba(250, 250, 249, 0.85)",
        borderColor: PALETTE.controlSoft,
      }}
    >
      {BUTTONS.map((b) => {
        const active = mode === b.mode;
        return (
          <button
            key={b.mode}
            onClick={() => onChange(b.mode)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200"
            style={{
              background: active ? PALETTE.control : "transparent",
              color: active ? "#ffffff" : PALETTE.control,
              boxShadow: active ? `0 0 0 2px ${PALETTE.accent}33` : "none",
            }}
            onMouseEnter={(e) => {
              if (!active)
                e.currentTarget.style.background = PALETTE.controlSoft;
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = "transparent";
            }}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

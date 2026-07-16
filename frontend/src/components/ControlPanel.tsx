export type SceneMode = "atrium_temp" | "outside_temp" | "brightness" | "noise";

interface Props {
  mode: SceneMode;
  onChange: (mode: SceneMode) => void;
}

const BUTTONS: { mode: SceneMode; label: string }[] = [
  { mode: "atrium_temp", label: "Atrium Temp" },
  { mode: "outside_temp", label: "Outside Temp" },
  { mode: "brightness", label: "Brightness" },
  { mode: "noise", label: "Noise" },
];

export default function ControlPanel({ mode, onChange }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-2 bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-2xl p-3 shadow-xl">
      {BUTTONS.map((b) => (
        <button
          key={b.mode}
          onClick={() => onChange(b.mode)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            mode === b.mode
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "hover:bg-white/50 dark:hover:bg-slate-700/50"
          }`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

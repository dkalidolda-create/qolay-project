import type { Reading } from "../types";
import { PALETTE } from "../theme";

interface Props {
  readings: Reading[];
  selectedId: number | null;
  onSelect: (reading: Reading | null) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function TimelineSelector({
  readings,
  selectedId,
  onSelect,
}: Props) {
  const ordered = [...readings].sort(
    (a, b) =>
      new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime(),
  );

  return (
    <div
      className="w-full rounded-2xl border p-3 flex gap-2 overflow-x-auto"
      style={{ background: PALETTE.bg, borderColor: PALETTE.controlSoft }}
    >
      <button
        onClick={() => onSelect(null)}
        className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        style={{
          background: selectedId === null ? PALETTE.control : "transparent",
          color: selectedId === null ? "#ffffff" : PALETTE.control,
          border: `1px solid ${PALETTE.controlSoft}`,
        }}
      >
        Live
      </button>
      {ordered.map((r) => {
        const active = r.id === selectedId;
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className="shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs transition-colors"
            style={{
              background: active ? PALETTE.control : "transparent",
              color: active ? "#ffffff" : PALETTE.control,
              border: `1px solid ${PALETTE.controlSoft}`,
            }}
          >
            <span className="font-semibold">{formatTime(r.measured_at)}</span>
            <span className="opacity-70">{formatDate(r.measured_at)}</span>
          </button>
        );
      })}
    </div>
  );
}

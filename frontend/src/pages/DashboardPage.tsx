import { useEffect, useState } from "react";
import { fetchSummary, fetchReadings } from "../api";
import type { Summary, Reading } from "../types";
import { calculateComfort } from "../comfort";
import AtriumScene from "../components/AtriumScene";
import ControlPanel, { type SceneMode } from "../components/ControlPanel";
import ComfortGauge from "../components/ComfortGauge";
import StatsRow from "../components/StatsRow";
import TimelineSelector from "../components/TimelineSelector";

type LoadState = "loading" | "error" | "empty" | "ready";

function findNearest(readings: Reading[], targetIso: string): Reading | null {
  if (!readings.length) return null;
  const target = new Date(targetIso).getTime();
  return readings.reduce((closest, r) => {
    const diff = Math.abs(new Date(r.measured_at).getTime() - target);
    const closestDiff = Math.abs(
      new Date(closest.measured_at).getTime() - target,
    );
    return diff < closestDiff ? r : closest;
  }, readings[0]);
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState<SceneMode>("atrium_temp");

  const [atriumReadings, setAtriumReadings] = useState<Reading[]>([]);
  const [outsideReadings, setOutsideReadings] = useState<Reading[]>([]);
  const [selected, setSelected] = useState<Reading | null>(null);

  function load() {
    setState("loading");
    fetchSummary()
      .then((data) => {
        setSummary(data);
        setState("ready");
      })
      .catch((err: Error) => {
        if (err.message.includes("404")) setState("empty");
        else {
          setErrorMsg(err.message);
          setState("error");
        }
      });

    Promise.all([
      fetchReadings({ location: "atrium" }),
      fetchReadings({ location: "outside" }),
    ])
      .then(([atrium, outside]) => {
        const sortDesc = (arr: Reading[]) =>
          [...arr].sort(
            (a, b) =>
              new Date(b.measured_at).getTime() -
              new Date(a.measured_at).getTime(),
          );
        setAtriumReadings(sortDesc(atrium).slice(0, 40));
        setOutsideReadings(sortDesc(outside));
      })
      .catch(() => {});
  }

  useEffect(load, []);

  if (state === "loading") {
    return (
      <div className="text-center py-20 text-slate-500">
        Считываем последние показания…
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-2">
          Не получилось загрузить данные атриума.
        </p>
        <p className="text-sm text-slate-400 mb-4">{errorMsg}</p>
        <button
          onClick={load}
          className="px-5 py-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (state === "empty" || !summary) {
    return (
      <div className="text-center py-20 text-slate-500">
        Пока нет ни одного измерения в базе. Запустите: python -m app.seed
      </div>
    );
  }

  const { current, day_stats } = summary;

  const activeTemperature = selected
    ? selected.temperature
    : current.atrium_temperature;
  const activeOutside = selected
    ? (findNearest(outsideReadings, selected.measured_at)?.temperature ??
      current.outside_temperature)
    : current.outside_temperature;
  const activeBrightness = selected ? selected.brightness : current.brightness;
  const activeNoise = selected ? selected.noise : current.noise;
  const activeMeasuredAt = selected
    ? selected.measured_at
    : current.measured_at;

  // Пересчитываем Comfort Score под выбранный момент времени, а не только для "live"
  const activeComfort = selected
    ? calculateComfort(
        selected.temperature,
        selected.noise,
        selected.brightness,
      )
    : {
        score: current.comfort_score,
        label: current.comfort_label,
        breakdown: current.comfort_breakdown,
      };

  const displayCurrent = {
    ...current,
    atrium_temperature: activeTemperature,
    outside_temperature: activeOutside,
    brightness: activeBrightness,
    noise: activeNoise,
    measured_at: activeMeasuredAt,
    comfort_score: activeComfort.score,
    comfort_label: activeComfort.label,
    comfort_breakdown: activeComfort.breakdown,
    delta_outside_inside:
      activeOutside !== null && activeOutside !== undefined
        ? Math.round((activeTemperature - activeOutside) * 10) / 10
        : null,
  };

  return (
    <div className="flex flex-col gap-4">
      <AtriumScene
        mode={mode}
        temperature={activeTemperature}
        outsideTemperature={activeOutside}
        brightness={activeBrightness}
        noise={activeNoise}
      />
      <ControlPanel mode={mode} onChange={setMode} />

      <TimelineSelector
        readings={atriumReadings}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
      />

      <div className="grid md:grid-cols-[220px_1fr] gap-8 items-start mt-4">
        <div className="flex justify-center">
          <ComfortGauge
            score={displayCurrent.comfort_score}
            label={displayCurrent.comfort_label}
          />
        </div>
        <StatsRow summary={{ current: displayCurrent, day_stats }} />
      </div>
    </div>
  );
}

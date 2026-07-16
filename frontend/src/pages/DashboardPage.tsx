import { useEffect, useState } from "react";
import { fetchSummary } from "../api";
import type { Summary } from "../types";
import AtriumScene from "../components/AtriumScene";
import ControlPanel, { type SceneMode } from "../components/ControlPanel";
import ComfortGauge from "../components/ComfortGauge";
import StatsRow from "../components/StatsRow";

type LoadState = "loading" | "error" | "empty" | "ready";

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState<SceneMode>("atrium_temp");

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

  return (
    <div className="flex flex-col gap-8">
      <AtriumScene
        mode={mode}
        temperature={current.atrium_temperature}
        outsideTemperature={current.outside_temperature}
        brightness={current.brightness}
        noise={current.noise}
      />
      <ControlPanel mode={mode} onChange={setMode} />

      <div className="grid md:grid-cols-[220px_1fr] gap-8 items-start">
        <div className="flex justify-center">
          <ComfortGauge
            score={current.comfort_score}
            label={current.comfort_label}
          />
        </div>
        <StatsRow summary={{ current, day_stats }} />
      </div>
    </div>
  );
}

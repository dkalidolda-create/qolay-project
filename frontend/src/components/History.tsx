import { useEffect, useState } from "react";
import { fetchReadings } from "../api";
import type { Reading } from "../types";
import { BRIGHTNESS_LABELS, NOISE_LABELS, formatTime } from "../comfortVisuals";

type LoadState = "loading" | "error" | "empty" | "ready";

export default function History() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [noise, setNoise] = useState("");
  const [sortBy, setSortBy] = useState<"measured_at" | "temperature">(
    "measured_at",
  );
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  function load() {
    setState("loading");
    fetchReadings({
      location: location || undefined,
      date_from: date ? `${date}T00:00:00` : undefined,
      date_to: date ? `${date}T23:59:59` : undefined,
      noise: noise || undefined,
      sort_by: sortBy,
      order,
      limit: 200,
    })
      .then((data) => {
        setReadings(data);
        setState(data.length === 0 ? "empty" : "ready");
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setState("error");
      });
  }

  useEffect(load, [location, date, noise, sortBy, order]);

  return (
    <section id="history" className="history">
      <h2 className="section-title">История измерений</h2>

      <div className="history__filters">
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">Все места</option>
          <option value="atrium">Атриум</option>
          <option value="outside">Улица</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <select value={noise} onChange={(e) => setNoise(e.target.value)}>
          <option value="">Любой шум</option>
          <option value="quiet">Тихо</option>
          <option value="mild">Немного шума</option>
          <option value="noisy">Шумно</option>
          <option value="very_noisy">Очень шумно</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "measured_at" | "temperature")
          }
        >
          <option value="measured_at">По времени</option>
          <option value="temperature">По температуре</option>
        </select>

        <button
          className="btn btn--ghost"
          onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
        >
          {order === "asc" ? "↑ возрастание" : "↓ убывание"}
        </button>
      </div>

      {state === "loading" && <p className="state-panel__detail">Загрузка…</p>}

      {state === "error" && (
        <div className="state-panel state-panel--error">
          <p>Не получилось загрузить историю.</p>
          <p className="state-panel__detail">{errorMsg}</p>
          <button className="btn" onClick={load}>
            Попробовать снова
          </button>
        </div>
      )}

      {state === "empty" && (
        <p className="state-panel__detail">
          Нет измерений по заданным фильтрам.
        </p>
      )}

      {state === "ready" && (
        <table className="history__table">
          <thead>
            <tr>
              <th>Время</th>
              <th>Место</th>
              <th>Темп.</th>
              <th>Освещение</th>
              <th>Шум</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => (
              <tr key={r.id}>
                <td>{formatTime(r.measured_at)}</td>
                <td>{r.location === "atrium" ? "Атриум" : "Улица"}</td>
                <td>{r.temperature.toFixed(1)}°</td>
                <td>
                  {r.brightness
                    ? (BRIGHTNESS_LABELS[r.brightness] ?? r.brightness)
                    : "—"}
                </td>
                <td>{r.noise ? (NOISE_LABELS[r.noise] ?? r.noise) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

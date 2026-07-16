import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { fetchReadings } from "../api";
import type { Reading } from "../types";
import { formatTime } from "../comfortVisuals";

export default function AnalyticsPage() {
  const [atrium, setAtrium] = useState<Reading[]>([]);
  const [outside, setOutside] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchReadings({
        location: "atrium",
        sort_by: "measured_at",
        order: "asc",
        limit: 1000,
      }),
      fetchReadings({
        location: "outside",
        sort_by: "measured_at",
        order: "asc",
        limit: 1000,
      }),
    ]).then(([a, o]) => {
      setAtrium(a);
      setOutside(o);
      setLoading(false);
    });
  }, []);

  const tempSeries = useMemo(
    () =>
      atrium.map((r) => ({
        time: formatTime(r.measured_at),
        atrium: r.temperature,
      })),
    [atrium],
  );

  const outsideSeries = useMemo(
    () =>
      outside.map((r) => ({
        time: formatTime(r.measured_at),
        outside: r.temperature,
      })),
    [outside],
  );

  const deltaSeries = useMemo(() => {
    return atrium
      .map((r) => {
        const rTime = new Date(r.measured_at).getTime();
        let nearest: Reading | null = null;
        let minDiff = Infinity;
        for (const o of outside) {
          const diff = Math.abs(new Date(o.measured_at).getTime() - rTime);
          if (diff < minDiff) {
            minDiff = diff;
            nearest = o;
          }
        }
        return {
          time: formatTime(r.measured_at),
          delta: nearest
            ? Math.round((r.temperature - nearest.temperature) * 10) / 10
            : null,
        };
      })
      .filter((d) => d.delta !== null);
  }, [atrium, outside]);

  if (loading)
    return (
      <div className="text-center py-20 text-slate-500">Считаем аналитику…</div>
    );

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-bold">Аналитика</h1>

      <section className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
        <h2 className="font-semibold mb-4">
          Температура в атриуме — по времени
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={tempSeries}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="atrium"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
        <h2 className="font-semibold mb-4">
          Температура на улице — по времени
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={outsideSeries}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="outside"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
        <h2 className="font-semibold mb-2">Разница: атриум − улица</h2>
        <p className="text-sm text-slate-500 mb-4">
          Считается по ближайшему по времени измерению снаружи для каждого
          замера внутри.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={deltaSeries}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="delta" fill="#14b8a6" name="Δ °C" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

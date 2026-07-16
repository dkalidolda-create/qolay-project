import type { Summary } from "../types";

interface Props {
  summary: Summary;
}

export default function StatsRow({ summary }: Props) {
  const { current, day_stats } = summary;
  const b = current.comfort_breakdown;

  return (
    <div className="stats">
      <section className="stats__group">
        <h3 className="stats__title">Сегодня</h3>
        <div className="stats__grid">
          <Stat label="мин." value={`${day_stats.min_temperature}°`} />
          <Stat label="сред." value={`${day_stats.avg_temperature}°`} />
          <Stat label="макс." value={`${day_stats.max_temperature}°`} />
          <Stat label="прохладнее всего" value={day_stats.coolest_time} />
        </div>
      </section>

      <section className="stats__group">
        <h3 className="stats__title">
          Из чего сложился Comfort Score — {current.comfort_score}
        </h3>
        <div className="breakdown">
          <BreakdownBar label="Температура" value={b.temperature} />
          <BreakdownBar label="Шум" value={b.noise} />
          <BreakdownBar label="Освещение" value={b.brightness} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const width = Math.min(100, (Math.abs(value) / 30) * 100);
  return (
    <div className="breakdown__row">
      <span className="breakdown__label">{label}</span>
      <div className="breakdown__track">
        <div className="breakdown__fill" style={{ width: `${width}%` }} />
      </div>
      <span className="breakdown__value">{value === 0 ? "0" : value}</span>
    </div>
  );
}

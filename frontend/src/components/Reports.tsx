import { useEffect, useState } from "react";
import { createReport, deleteReport, fetchReports, updateReport } from "../api";
import type { Report, ReportCategory } from "../types";

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  too_hot: "Слишком жарко",
  too_noisy: "Слишком шумно",
  too_bright: "Слишком ярко",
  too_dark: "Слишком темно",
  comfortable: "Комфортно",
  other: "Другое",
};

type LoadState = "loading" | "error" | "empty" | "ready";

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [category, setCategory] = useState<ReportCategory>("comfortable");
  const [comment, setComment] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editComment, setEditComment] = useState("");

  function load() {
    setState("loading");
    fetchReports()
      .then((data) => {
        setReports(data);
        setState(data.length === 0 ? "empty" : "ready");
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setState("error");
      });
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createReport({ category, comment: comment || undefined });
      setComment("");
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 2500);
      load();
    } catch (err) {
      setErrorMsg((err as Error).message);
      setState("error");
    }
  }

  async function handleResolve(r: Report) {
    await updateReport(r.id, {
      status: r.status === "open" ? "resolved" : "open",
    });
    load();
  }

  async function handleSaveComment(r: Report) {
    await updateReport(r.id, { comment: editComment });
    setEditingId(null);
    load();
  }

  async function handleDelete(r: Report) {
    if (!confirm("Удалить этот отчёт?")) return;
    await deleteReport(r.id);
    load();
  }

  return (
    <section id="report" className="reports">
      <h2 className="section-title">Отчёт о текущих условиях</h2>

      <form className="reports__form" onSubmit={handleSubmit}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ReportCategory)}
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Комментарий (необязательно)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button className="btn" type="submit">
          Отправить
        </button>
      </form>

      {justSubmitted && <p className="reports__success">Отчёт сохранён ✓</p>}

      {state === "loading" && <p className="state-panel__detail">Загрузка…</p>}
      {state === "error" && (
        <div className="state-panel state-panel--error">
          <p>Не получилось загрузить отчёты.</p>
          <p className="state-panel__detail">{errorMsg}</p>
          <button className="btn" onClick={load}>
            Попробовать снова
          </button>
        </div>
      )}
      {state === "empty" && (
        <p className="state-panel__detail">Пока нет отчётов.</p>
      )}

      {reports.length > 0 && (
        <ul className="reports__list">
          {reports.map((r) => (
            <li
              key={r.id}
              className={`reports__item reports__item--${r.status}`}
            >
              <div className="reports__item-head">
                <strong>{CATEGORY_LABELS[r.category]}</strong>
                <span className="reports__status">
                  {r.status === "open" ? "Открыт" : "Решено"}
                </span>
              </div>

              {editingId === r.id ? (
                <div className="reports__edit">
                  <input
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                  />
                  <button
                    className="btn btn--ghost"
                    onClick={() => handleSaveComment(r)}
                  >
                    Сохранить
                  </button>
                </div>
              ) : (
                <p className="reports__comment">{r.comment || "—"}</p>
              )}

              <div className="reports__actions">
                <button
                  className="btn btn--ghost"
                  onClick={() => handleResolve(r)}
                >
                  {r.status === "open"
                    ? "Отметить решённым"
                    : "Вернуть в открытые"}
                </button>
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    setEditingId(r.id);
                    setEditComment(r.comment ?? "");
                  }}
                >
                  Изменить
                </button>
                <button
                  className="btn btn--ghost"
                  onClick={() => handleDelete(r)}
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

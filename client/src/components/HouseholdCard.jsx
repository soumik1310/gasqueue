import { formatDate, statusLabel, cycleLabel, gapsLabel, statusClass } from "../utils";

export default function HouseholdCard({ h, busy, onLogRefill, onDelete }) {
  const p = h.prediction;
  const cls = statusClass(p.status);

  const sorted = [...h.refills].sort((a, b) => new Date(a.date) - new Date(b.date));
  const history = sorted.length
    ? sorted.slice(-6).map((r) => formatDate(r.date)).join(", ")
    : "No refills logged yet";

  return (
    <div className={`hcard ${cls}`}>
      <div className="hcard-head">
        <div>
          <div className="hname">{h.name}</div>
          <div className="hmeta">
            {h.area || "No area"} · {h.people} people ·{" "}
            {h.cylinderType === "commercial_19kg" ? "Commercial" : "Domestic"}
          </div>
        </div>
        <span className={`badge ${cls}`}>{statusLabel(p)}</span>
      </div>

      <div className="info-grid">
        <div>
          <div className="k">Last refill</div>
          <div className="v">{p.lastRefill ? formatDate(p.lastRefill) : "-"}</div>
        </div>
        <div>
          <div className="k">Predicted runout</div>
          <div className="v">{p.runoutDate ? formatDate(p.runoutDate) : "-"}</div>
        </div>
        <div>
          <div className="k">Consumption cycle</div>
          <div className="v">{cycleLabel(p)}</div>
        </div>
        <div>
          <div className="k">Gaps</div>
          <div className="v">{gapsLabel(h.refills)}</div>
        </div>
      </div>

      <div className="history">
        <b>History:</b> {history}
      </div>

      <div className="hactions">
        <button className="btn btn-primary" disabled={busy} onClick={() => onLogRefill(h)}>
          Log refill today
        </button>
        <button className="btn btn-danger" disabled={busy} onClick={() => onDelete(h)}>
          Delete
        </button>
      </div>
    </div>
  );
}
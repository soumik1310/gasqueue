import { statusLabel, statusClass } from "../utils";
import "./route.css";

const COLORS = {
  Overdue: "#dc2626",
  Urgent: "#ea580c",
  "Due Soon": "#d97706",
};

export default function RoutePanel({ route, error }) {
  if (error) {
    return (
      <div className="side-body">
        <p className="error">{error}</p>
      </div>
    );
  }
  if (!route) {
    return (
      <div className="side-body">
        <p className="placeholder">Loading route...</p>
      </div>
    );
  }
  if (route.stops.length === 0) {
    return (
      <div className="side-body">
        <p className="placeholder">No deliveries needed right now.</p>
      </div>
    );
  }

  return (
    <div className="side-body">
      <div className="route-summary">
        <div>
          <div className="k">Stops</div>
          <div className="v">{route.stops.length}</div>
        </div>
        <div>
          <div className="k">Road distance</div>
          <div className="v">{route.roadDistanceKm} km</div>
        </div>
        <div>
          <div className="k">Drive time</div>
          <div className="v">{route.roadDurationMin} min</div>
        </div>
      </div>

      <ol className="route-list">
        {route.stops.map((s) => (
          <li key={s.id} className="route-stop">
            <span className="seq" style={{ background: COLORS[s.status] }}>
              {s.sequence}
            </span>
            <div className="route-info">
              <div className="hname">{s.name}</div>
              <div className="hmeta">{s.area || "No area"}</div>
            </div>
            <span className={`badge ${statusClass(s.status)}`}>{statusLabel(s)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
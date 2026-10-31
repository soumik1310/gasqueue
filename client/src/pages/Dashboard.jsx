import { useCallback, useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";
import StatsBar from "../components/StatsBar";
import MapView from "../components/MapView";
import HouseholdList from "../components/HouseholdList";
import "./dashboard.css";

// "key" matches the ?status= values your server accepts
const FILTERS = [
  { key: "all", label: "All", count: (s) => s.total },
  { key: "overdue", label: "Overdue", count: (s) => s.overdue },
  { key: "urgent", label: "Urgent", count: (s) => s.urgent },
  { key: "due-soon", label: "Due Soon", count: (s) => s.dueSoon },
  { key: "safe", label: "Safe", count: (s) => s.safe },
];

export default function Dashboard() {
  const { supplier, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [depot, setDepot] = useState(null);
  const [tab, setTab] = useState("households"); // "households" or "route"
  const [filter, setFilter] = useState("all");
  const [version, setVersion] = useState(0); // goes up whenever data changes
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [sum, settings] = await Promise.all([
        api.get("/households/summary"),
        api.get("/settings"),
      ]);
      setSummary(sum.data);

      const d = settings.data.depot;
      setDepot(d?.lat != null && d?.lng != null ? { lat: d.lat, lng: d.lng } : null);
      setError("");
    } catch {
      setError("Could not load data. Is the server running?");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // called after a refill or delete: refresh the counts and the list
  const refresh = () => {
    loadData();
    setVersion((v) => v + 1);
  };

  return (
    <div className="app">
      <StatsBar summary={summary} depot={depot} />

      <div className="toolbar">
        <button className="btn btn-primary" disabled title="Coming in a later step">
          + Add Household
        </button>
        <button className="btn" disabled title="Coming in a later step">
          Set Depot
        </button>
        <div className="spacer" />
        <span className="user">{supplier.name}</span>
        <button className="btn" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="main">
        <aside className="side">
          <div className="tabs">
            <button
              className={tab === "households" ? "tab active" : "tab"}
              onClick={() => setTab("households")}
            >
              Households <span className="count">{summary?.total ?? 0}</span>
            </button>
            <button
              className={tab === "route" ? "tab active" : "tab"}
              onClick={() => setTab("route")}
            >
              Route Optimization <span className="count">{summary?.actionNeeded ?? 0}</span>
            </button>
          </div>

          {error && <p className="error" style={{ padding: "8px 12px" }}>{error}</p>}

          {tab === "households" ? (
            <>
              <div className="chips">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    className={filter === f.key ? "chip active" : "chip"}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label} ({summary ? f.count(summary) : 0})
                  </button>
                ))}
              </div>
              {/* key={filter} makes the list start fresh (page 1) when the filter changes */}
              <HouseholdList
                key={filter}
                filter={filter}
                version={version}
                onChanged={refresh}
              />
            </>
          ) : (
            <div className="side-body">
              <p className="placeholder">The delivery route comes in a later step.</p>
            </div>
          )}
        </aside>

        <MapView depot={depot} />
      </div>
    </div>
  );
}
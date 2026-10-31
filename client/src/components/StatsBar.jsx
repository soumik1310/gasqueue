function Stat({ label, value, tone }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={tone ? `stat-value ${tone}` : "stat-value"}>{value}</div>
    </div>
  );
}

export default function StatsBar({ summary, depot }) {
  const action = summary?.actionNeeded ?? 0;

  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo">G</div>
        <div>
          <div className="brand-name">
            GasQueue <span className="pill">DISTRIBUTOR</span>
          </div>
          <div className="brand-sub">LPG refill prediction and delivery planner</div>
        </div>
      </div>

      <div className="stats">
        <Stat label="Total households" value={summary?.total ?? "-"} />
        <Stat label="Action needed" value={summary ? action : "-"} tone={action > 0 ? "danger" : ""} />
        <Stat
          label="Depot"
          value={depot ? `${depot.lat.toFixed(3)}, ${depot.lng.toFixed(3)}` : "Not set"}
        />
      </div>
    </header>
  );
}
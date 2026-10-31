import { useEffect, useState } from "react";
import api from "../api";
import HouseholdCard from "./HouseholdCard";
import "./households.css";

const PAGE_SIZE = 3;

export default function HouseholdList({ filter, version, onChanged }) {
  const [households, setHouseholds] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // load the list on first render, and again whenever "version" changes
  useEffect(() => {
    let cancelled = false;
    api
      .get("/households", { params: filter === "all" ? {} : { status: filter } })
      .then((res) => {
        if (!cancelled) {
          setHouseholds(res.data);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load households");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, version]);

  // pagination: slice the list into pages of 3
  const totalPages = Math.max(1, Math.ceil(households.length / PAGE_SIZE));
  const current = Math.min(page, totalPages); // stays valid if the list shrinks
  const visible = households.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const logRefill = async (h) => {
    setBusyId(h._id);
    try {
      await api.post(`/households/${h._id}/refills`, {});
      onChanged();
    } catch (err) {
      alert(err.response?.data?.message || "Could not log the refill");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (h) => {
    if (!window.confirm(`Delete ${h.name}?`)) return;
    setBusyId(h._id);
    try {
      await api.delete(`/households/${h._id}`);
      onChanged();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="side-body">
        {loading && <p className="placeholder">Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && households.length === 0 && (
          <p className="placeholder">No households here.</p>
        )}
        {visible.map((h) => (
          <HouseholdCard
            key={h._id}
            h={h}
            busy={busyId === h._id}
            onLogRefill={logRefill}
            onDelete={remove}
          />
        ))}
      </div>

      {households.length > 0 && (
        <div className="pager">
          <button className="btn" disabled={current === 1} onClick={() => setPage(current - 1)}>
            ← Prev
          </button>
          <span className="pager-info">
            Page {current} of {totalPages} · {households.length} households
          </span>
          <button
            className="btn"
            disabled={current === totalPages}
            onClick={() => setPage(current + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}
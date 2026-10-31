import { useState } from "react";
import api from "../api";
import LocationPicker from "./LocationPicker";
import "./modal.css";

const today = () => new Date().toISOString().slice(0, 10);

export default function AddHouseholdModal({ center, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    area: "",
    people: "4",
    cylinderType: "domestic_14_2kg",
    expectedCycleDays: "",
  });
  const [dates, setDates] = useState(["", "", ""]);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setDate = (i, value) => setDates(dates.map((d, idx) => (idx === i ? value : d)));

  const submit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError("Click the map to choose the household's location");
      return;
    }
    setBusy(true);
    setError("");

    const body = {
      name: form.name,
      area: form.area,
      people: Number(form.people),
      cylinderType: form.cylinderType,
      location,
      refills: dates.filter(Boolean),
    };
    if (form.expectedCycleDays) body.expectedCycleDays = Number(form.expectedCycleDays);

    try {
      await api.post("/households", body);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the household");
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add household</h2>

        <form onSubmit={submit}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={form.name} onChange={update} required />

          <div className="form-row">
            <div>
              <label htmlFor="area">Area</label>
              <input id="area" name="area" value={form.area} onChange={update} />
            </div>
            <div>
              <label htmlFor="people">People</label>
              <input
                id="people"
                name="people"
                type="number"
                min="1"
                value={form.people}
                onChange={update}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="cylinderType">Cylinder</label>
              <select id="cylinderType" name="cylinderType" value={form.cylinderType} onChange={update}>
                <option value="domestic_14_2kg">Domestic 14.2 kg</option>
                <option value="commercial_19kg">Commercial 19 kg</option>
              </select>
            </div>
            <div>
              <label htmlFor="expectedCycleDays">Expected cycle (days, optional)</label>
              <input
                id="expectedCycleDays"
                name="expectedCycleDays"
                type="number"
                min="1"
                value={form.expectedCycleDays}
                onChange={update}
              />
            </div>
          </div>

          <label>Past refill dates (optional)</label>
          <div className="date-row">
            {dates.map((d, i) => (
              <input
                key={i}
                type="date"
                max={today()}
                value={d}
                onChange={(e) => setDate(i, e.target.value)}
              />
            ))}
          </div>
          <div className="hint">With 3 or more dates, the prediction uses the real average.</div>

          <label>Location (click the map)</label>
          <LocationPicker value={location} onChange={setLocation} center={center} />
          <div className="hint">
            {location
              ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
              : "No location chosen yet"}
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Saving..." : "Save household"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
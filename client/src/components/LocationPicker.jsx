import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import "./picker.css";

const COUNTRY = "in"; // search results are limited to India. Change or remove it for other countries.
const cache = new Map(); // remembers earlier searches, as the Nominatim policy expects

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// moves the map when a place was chosen from search or "My location"
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView([target.lat, target.lng], 16);
  }, [target, map]);
  return null;
}

export default function LocationPicker({ value, onChange, center }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(null);

  // pick a point AND move the map to it
  const choose = (point) => {
    onChange(point);
    setTarget({ ...point }); // a new object each time, so the map always moves
  };

  const search = async () => {
    const q = query.trim();
    if (q.length < 3) {
      setMessage("Type at least 3 characters");
      return;
    }
    setBusy(true);
    setMessage("");
    setResults([]);
    try {
      if (!cache.has(q)) {
        const url =
          "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5" +
          `&countrycodes=${COUNTRY}&q=${encodeURIComponent(q)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("search failed");
        cache.set(q, await res.json());
      }
      const found = cache.get(q);
      setResults(found);
      if (found.length === 0) {
        setMessage("No places found. Try a nearby landmark or click the map.");
      }
    } catch {
      setMessage("Search is unavailable right now. Click the map instead.");
    } finally {
      setBusy(false);
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setMessage("Your browser can't share its location");
      return;
    }
    setMessage("Finding you...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMessage("");
        choose({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setMessage("Could not get your location. Search or click the map instead.")
    );
  };

  return (
    <div>
      <div className="picker-search">
        <input
          type="text"
          placeholder="Search address or landmark"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // don't submit the form this picker sits in
              search();
            }
          }}
        />
        <button type="button" className="btn" disabled={busy} onClick={search}>
          {busy ? "..." : "Search"}
        </button>
        <button type="button" className="btn" onClick={locateMe}>
          My location
        </button>
      </div>

      {message && <div className="hint">{message}</div>}

      {results.length > 0 && (
        <ul className="picker-results">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => {
                  choose({ lat: Number(r.lat), lng: Number(r.lon) });
                  setResults([]);
                }}
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="picker">
        <MapContainer center={center} zoom={13} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          <FlyTo target={target} />
          {value && (
            <CircleMarker
              center={[value.lat, value.lng]}
              radius={9}
              pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
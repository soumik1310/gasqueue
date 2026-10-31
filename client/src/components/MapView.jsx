import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";

const DEFAULT_CENTER = [26.9124, 75.7873]; // Jaipur

const COLORS = {
  Overdue: "#dc2626",
  Urgent: "#ea580c",
  "Due Soon": "#d97706",
  Safe: "#16a34a",
  "No data": "#94a3b8",
};

// The map reads "center" only once, so this moves it when the depot changes
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Zooms the map so the whole route is visible
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 1) map.fitBounds(points, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function MapView({ depot, households = [], route = null }) {
  const center = depot ? [depot.lat, depot.lng] : DEFAULT_CENTER;

  // depot -> stops in order -> depot, as a list of [lat, lng]
  const path = useMemo(() => {
    if (!route || route.stops.length === 0) return null;
    const d = [route.depot.lat, route.depot.lng];
    return [d, ...route.stops.map((s) => [s.lat, s.lng]), d];
  }, [route]);

  return (
    <div className="map-wrap map-dark">
      <MapContainer center={center} zoom={12} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Routing: OSRM'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={center[0]} lng={center[1]} />
        <FitBounds points={path} />

        {path ? (
          <>
            <Polyline
              positions={path}
              pathOptions={{ color: "#60a5fa", weight: 3, dashArray: "6 6" }}
            />
            {route.stops.map((s) => (
              <CircleMarker
                key={s.id}
                center={[s.lat, s.lng]}
                radius={13}
                pathOptions={{ color: "#fff", weight: 2, fillColor: COLORS[s.status], fillOpacity: 1 }}
              >
                <Tooltip permanent direction="center" className="seq-tip">
                  {s.sequence}
                </Tooltip>
              </CircleMarker>
            ))}
          </>
        ) : (
          households.map((h) => (
            <CircleMarker
              key={h._id}
              center={[h.location.lat, h.location.lng]}
              radius={8}
              pathOptions={{
                color: "#fff",
                weight: 1.5,
                fillColor: COLORS[h.prediction.status],
                fillOpacity: 1,
              }}
            >
              <Tooltip>
                {h.name} · {h.prediction.status}
              </Tooltip>
            </CircleMarker>
          ))
        )}

        {depot && (
          <CircleMarker
            center={[depot.lat, depot.lng]}
            radius={10}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#7c3aed", fillOpacity: 1 }}
          >
            <Tooltip>Depot</Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
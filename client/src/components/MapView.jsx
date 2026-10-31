import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";

const DEFAULT_CENTER = [26.9124, 75.7873]; // Jaipur

// The map only reads "center" once, so this moves it when the depot changes
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function MapView({ depot }) {
  const center = depot ? [depot.lat, depot.lng] : DEFAULT_CENTER;

  return (
    <div className="map-wrap map-dark">
      <MapContainer center={center} zoom={12} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={center[0]} lng={center[1]} />
        {depot && (
          <CircleMarker
            center={[depot.lat, depot.lng]}
            radius={9}
            pathOptions={{ color: "#a78bfa", fillColor: "#7c3aed", fillOpacity: 1 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
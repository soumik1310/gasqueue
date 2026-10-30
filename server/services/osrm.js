const OSRM_URL = process.env.OSRM_URL || "https://router.project-osrm.org";
const round2 = (n) => Math.round(n * 100) / 100;

export async function osrmTrip(depot, stops) {
  if (stops.length === 0) {
    return {
      order: [],
      roadDistanceKm: 0,
      roadDurationMin: 0,
    };
  }

  const points = [depot, ...stops];
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${OSRM_URL}/trip/v1/driving/${coords}?roundtrip=true`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "GasQueue/1.0 (student project)",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`OSRM error ${res.status}`);
  }

  const data = await res.json();
  if (data.code !== "Ok") {
    throw new Error(`OSRM said: ${data.code}`);
  }

  const visited = points
    .map((point, i) => ({
      point,
      position: data.waypoints[i].waypoint_index,
    }))
    .sort((a, b) => a.position - b.position)
    .map((item) => item.point);

  const start = visited.indexOf(depot);
  const rotated = [...visited.slice(start), ...visited.slice(0, start)];
  const order = rotated.slice(1);

  const trip = data.trips[0];
  return {
    order,
    roadDistanceKm: round2(trip.distance / 1000),
    roadDurationMin: Math.round(trip.duration / 60),
  };
}
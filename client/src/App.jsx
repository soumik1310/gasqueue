import { useEffect, useState } from "react";
import api from "./api";

export default function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setStatus(res.data.status))
      .catch(() => setStatus("cannot reach server"));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>GasQueue</h1>
      <p>API status: {status}</p>
    </div>
  );
}
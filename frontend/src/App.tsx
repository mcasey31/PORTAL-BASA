import { useEffect, useState } from "react";

type HealthStatus = "checking" | "ok" | "error";

export default function App() {
  const [status, setStatus] = useState<HealthStatus>("checking");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "include",
        });
        setStatus(res.ok ? "ok" : "error");
      } catch {
        setStatus("error");
      }
    };

    void checkBackend();
  }, []);

  return (
    <main className="layout">
      <section className="card">
        <p className="eyebrow">PRM Platform</p>
        <h1>Frontend React Nativo</h1>
        <p>
          Este frontend corre en React + Vite y consume el backend por proxy
          en <strong>/api</strong>.
        </p>
        <div className={`status status-${status}`}>
          Estado backend: <strong>{status.toUpperCase()}</strong>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";

export default function GeoTest() {
  const [log, setLog] = useState<string[]>(["Premi il pulsante per testare il GPS"]);

  function addLog(msg: string) {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  }

  function testGeo() {
    addLog("Verifico supporto geolocalizzazione...");

    if (!navigator.geolocation) {
      addLog("❌ navigator.geolocation NON disponibile");
      return;
    }
    addLog("✅ navigator.geolocation disponibile");

    // Check permissions API
    if (navigator.permissions) {
      addLog("Controllo stato permesso...");
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        addLog(`Stato permesso: ${result.state}`);
      }).catch((e) => {
        addLog(`Permissions API errore: ${e.message}`);
      });
    } else {
      addLog("⚠️ Permissions API non disponibile");
    }

    addLog("Chiamo getCurrentPosition...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        addLog(`✅ SUCCESSO! Lat: ${pos.coords.latitude.toFixed(6)}, Lng: ${pos.coords.longitude.toFixed(6)}`);
        addLog(`Precisione: ${pos.coords.accuracy}m`);
      },
      (err) => {
        addLog(`❌ ERRORE code=${err.code}: ${err.message}`);
        if (err.code === 1) addLog("→ PERMISSION_DENIED");
        if (err.code === 2) addLog("→ POSITION_UNAVAILABLE");
        if (err.code === 3) addLog("→ TIMEOUT");
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 14, background: "#000", color: "#0f0", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 18, marginBottom: 16 }}>GPS Test</h1>
      <p style={{ color: "#888", marginBottom: 8 }}>
        Protocol: {typeof window !== "undefined" ? window.location.protocol : "?"}<br />
        Host: {typeof window !== "undefined" ? window.location.host : "?"}<br />
        UA: {typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 80) : "?"}
      </p>
      <button
        onClick={testGeo}
        style={{ padding: "16px 32px", fontSize: 18, background: "#0066ff", color: "#fff", border: "none", borderRadius: 12, marginBottom: 16, width: "100%", minHeight: 56 }}
      >
        TESTA GPS
      </button>
      <div style={{ background: "#111", padding: 12, borderRadius: 8, maxHeight: 400, overflow: "auto" }}>
        {log.map((l, i) => (
          <p key={i} style={{ margin: "4px 0", wordBreak: "break-all" }}>{l}</p>
        ))}
      </div>
    </div>
  );
}

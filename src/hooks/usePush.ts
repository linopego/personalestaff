"use client";

import { useEffect, useState } from "react";

export function usePush() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  async function requestPermission() {
    if (!supported) return false;

    // Registra SW
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // Chiedi permesso
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return false;

    // Sottoscrivi push
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    // Salva subscription nel backend
    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });

    return true;
  }

  return { supported, permission, requestPermission };
}

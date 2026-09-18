"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Detecta la zona horaria real del navegador (Intl) y la guarda en una
 * cookie que el servidor lee en cada request. Si cambió desde la última
 * vez (p. ej. el usuario viajó), refresca la página para que todo — "hoy",
 * horas mostradas, gráficos — se recalculen con la zona horaria correcta.
 * No renderiza nada visible.
 */
export default function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected) return;
    const current = getCookie("tz");
    if (current !== detected) {
      document.cookie = `tz=${encodeURIComponent(detected)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      router.refresh();
    }
  }, [router]);

  return null;
}
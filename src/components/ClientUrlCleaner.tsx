'use client';

import { useEffect } from 'react';

export function ClientUrlCleaner() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlHostId = urlParams.get("hostId");
    if (urlHostId) {
      sessionStorage.setItem("currentHostId", urlHostId);
      const url = new URL(window.location.href);
      url.searchParams.delete("hostId");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, []);
  return null;
}

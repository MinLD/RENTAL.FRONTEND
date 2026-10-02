"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Keep this listener mounted in the site layout: the page itself may be restored
// from the App Router cache after the browser's popstate event has already fired.
export function PartnerHistoryRefresh() {
  const router = useRouter();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    function refreshPartner() {
      if (window.location.pathname !== "/partner") return;
      clearTimeout(refreshTimer);
      // Let the router restore the destination before refreshing that route.
      refreshTimer = setTimeout(() => router.refresh(), 0);
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) refreshPartner();
    }

    window.addEventListener("popstate", refreshPartner);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      clearTimeout(refreshTimer);
      window.removeEventListener("popstate", refreshPartner);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router]);

  return null;
}

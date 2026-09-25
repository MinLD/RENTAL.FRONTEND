import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileMediaQuery,
    getMobileSnapshot,
    getServerSnapshot,
  )
}

function subscribeToMobileMediaQuery(callback: () => void) {
  const mql = window.matchMedia(MOBILE_MEDIA_QUERY)

  mql.addEventListener("change", callback)

  return () => mql.removeEventListener("change", callback)
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

function getServerSnapshot() {
  return false
}

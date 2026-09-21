"use client";

import NextTopLoader from "nextjs-toploader";

export function TopLoaderProvider() {
  return (
    <NextTopLoader
      color="#F26522"
      crawlSpeed={180}
      height={3}
      shadow="0 0 10px #F26522, 0 0 5px #F26522"
      showSpinner={false}
      zIndex={1600}
    />
  );
}

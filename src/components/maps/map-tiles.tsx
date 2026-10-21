"use client";

import type { LeafletEventHandlerFnMap } from "leaflet";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TileLayer } from "react-leaflet";

import { MAP_TILE_SOURCES } from "@/config/map";

export function MapTiles() {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const nextSource = useCallback(() => {
    setSourceIndex((index) => Math.min(index + 1, MAP_TILE_SOURCES.length - 1));
  }, []);
  const retry = useCallback(() => {
    setSourceIndex(0);
    setAttempt((value) => value + 1);
  }, []);

  return (
    <TileSource
      key={`${sourceIndex}-${attempt}`}
      onFailure={sourceIndex < MAP_TILE_SOURCES.length - 1 ? nextSource : undefined}
      onRetry={retry}
      source={MAP_TILE_SOURCES[sourceIndex]}
    />
  );
}

function TileSource({ source, onFailure, onRetry }: {
  source: (typeof MAP_TILE_SOURCES)[number];
  onFailure?: () => void;
  onRetry: () => void;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const loaded = useRef(0);
  const failures = useRef(0);
  const hasFailed = useRef(false);
  const loadingTimer = useRef<number | null>(null);
  const fail = useCallback(() => {
    if (hasFailed.current) return;
    hasFailed.current = true;
    if (loadingTimer.current !== null) window.clearTimeout(loadingTimer.current);
    if (onFailure) onFailure();
    else setStatus("error");
  }, [onFailure]);

  const events = useMemo<LeafletEventHandlerFnMap>(() => ({
    loading() {
      if (hasFailed.current) return;
      loaded.current = 0;
      failures.current = 0;
      setStatus("loading");
      if (loadingTimer.current !== null) window.clearTimeout(loadingTimer.current);
      loadingTimer.current = window.setTimeout(fail, 8_000);
    },
    tileload() {
      ++loaded.current;
    },
    load() {
      if (hasFailed.current) return;
      if (loadingTimer.current !== null) window.clearTimeout(loadingTimer.current);
      if (failures.current > 0) fail();
      else if (loaded.current > 0) setStatus("ready");
    },
    tileerror() {
      if (++failures.current >= 3) fail();
    },
  }), [fail]);

  useEffect(() => {
    // Also handle stalled requests, which may never emit tileerror promptly.
    if (loadingTimer.current === null) loadingTimer.current = window.setTimeout(fail, 8_000);
    return () => {
      if (loadingTimer.current !== null) window.clearTimeout(loadingTimer.current);
    };
  }, [fail]);

  return (
    <>
      <TileLayer
        attribution={source.attribution}
        eventHandlers={events}
        maxNativeZoom={source.maxNativeZoom}
        maxZoom={19}
        url={source.url}
      />
      {status === "loading" && (
        <div className="pointer-events-none absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded bg-background/95 px-3 py-2 text-xs text-foreground shadow" role="status">
          <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />Đang tải bản đồ...
        </div>
      )}
      {status === "error" && (
        <div className="absolute right-3 top-3 z-[1000] max-w-[calc(100%-4rem)] rounded border border-border bg-background/95 p-3 text-xs text-foreground shadow" role="alert">
          <p>Không tải được nền bản đồ. Vui lòng kiểm tra kết nối và thử lại.</p>
          <button
            className="mt-2 inline-flex cursor-pointer items-center gap-1 font-semibold text-primary"
            onClickCapture={(event) => { event.stopPropagation(); onRetry(); }}
            onPointerDownCapture={(event) => event.stopPropagation()}
            type="button"
          >
            <RefreshCw aria-hidden="true" className="size-3.5" />Tải lại bản đồ
          </button>
        </div>
      )}
    </>
  );
}

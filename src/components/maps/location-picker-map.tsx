"use client";

import { divIcon, type LeafletEventHandlerFnMap, type Marker as LeafletMarker } from "leaflet";
import { Locate, LocateFixed, Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, ZoomControl, useMapEvents } from "react-leaflet";

import { MapTiles } from "@/components/maps/map-tiles";
import type { LocationPickerProps, MapCoordinates } from "@/types/map";
import { parseMapCoordinates } from "@/utils/map-coordinates";

import "leaflet/dist/leaflet.css";

const VIETNAM_CENTER: MapCoordinates = { latitude: 16.0471, longitude: 108.2068 };
const SELECTED_ZOOM = 15;
// Use an inline icon so marker images do not depend on Leaflet's asset URL detection.
const LOCATION_ICON = divIcon({
  className: "location-picker-marker",
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><path d="M18 42S3 28 3 18a15 15 0 1 1 30 0c0 10-15 24-15 24Z" fill="#f26522" stroke="white" stroke-width="2"/><circle cx="18" cy="18" r="5" fill="white"/></svg>',
  iconSize: [36, 44],
  iconAnchor: [18, 42],
});

function selectedCoordinates(latitude: number, longitude: number) {
  return parseMapCoordinates(Number(latitude.toFixed(6)), Number(longitude.toFixed(6)));
}

type MapInteractionProps = Pick<LocationPickerProps, "value" | "onChange" | "disabled" | "focusCenter" | "focusZoom">;

function MapInteractions({ value, onChange, disabled, focusCenter, focusZoom }: MapInteractionProps) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const map = useMapEvents({
    click(event) {
      if (disabled) return;
      const point = event.latlng.wrap();
      const coordinates = selectedCoordinates(point.lat, point.lng);
      if (coordinates) onChange(coordinates);
    },
    locationfound(event) {
      if (disabled) return;
      const point = event.latlng.wrap();
      const coordinates = selectedCoordinates(point.lat, point.lng);
      if (!coordinates) return;
      setGeoError(null);
      onChange(coordinates);
    },
    locationerror() {
      setGeoError("Không lấy được vị trí. Hãy cấp quyền vị trí cho trình duyệt và thử lại.");
    },
  });
  const latitude = value?.latitude;
  const longitude = value?.longitude;

  useEffect(() => {
    if (focusCenter) {
      map.setView([focusCenter.latitude, focusCenter.longitude], focusZoom ?? 11, { animate: false });
      return;
    }
    if (latitude === undefined || longitude === undefined) return;
    // MapContainer's center prop is immutable; keep external form edits/reset in sync.
    map.setView([latitude, longitude], Math.max(map.getZoom(), SELECTED_ZOOM), { animate: false });
  }, [map, latitude, longitude, focusCenter, focusZoom]);

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === map.getContainer());
      map.invalidateSize({ animate: false });
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, [map]);

  const locateMe = useCallback(() => {
    if (disabled) return;
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Trình duyệt này không hỗ trợ xác định vị trí.");
      return;
    }
    map.locate({ enableHighAccuracy: true, maximumAge: 30_000, timeout: 12_000 });
  }, [disabled, map]);

  const toggleFullscreen = useCallback(async () => {
    const container = map.getContainer();
    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else if (!document.fullscreenElement) {
        await container.requestFullscreen();
      }
    } catch {
      setGeoError("Không thể mở bản đồ toàn màn hình trong trình duyệt này.");
    }
  }, [map]);

  return (
    <>
      <div className="absolute bottom-6 left-3 z-[1000] flex flex-col gap-2">
        <button
          aria-label="Dùng vị trí hiện tại của tôi"
          className="flex size-9 cursor-pointer items-center justify-center rounded border border-border bg-background text-foreground shadow hover:text-primary"
          disabled={disabled}
          onClickCapture={(event) => { event.stopPropagation(); locateMe(); }}
          onPointerDownCapture={(event) => event.stopPropagation()}
          title="Dùng vị trí hiện tại của tôi"
          type="button"
        >
          <Locate aria-hidden="true" className="size-4" />
        </button>
        {value && (
          <button
            aria-label="Về vị trí kho đã chọn"
            className="flex size-9 cursor-pointer items-center justify-center rounded border border-border bg-background text-foreground shadow hover:text-primary"
            onClickCapture={(event) => {
              event.stopPropagation();
              map.stop();
              map.setView([value.latitude, value.longitude], SELECTED_ZOOM, { animate: false });
            }}
            onPointerDownCapture={(event) => event.stopPropagation()}
            title="Về vị trí kho đã chọn"
            type="button"
          >
            <LocateFixed aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
      <button
        aria-label={isFullscreen ? "Thu nhỏ bản đồ" : "Mở bản đồ toàn màn hình"}
        className="absolute right-3 top-3 z-[1000] flex size-9 cursor-pointer items-center justify-center rounded border border-border bg-background text-foreground shadow hover:text-primary"
        onClickCapture={(event) => { event.stopPropagation(); void toggleFullscreen(); }}
        onPointerDownCapture={(event) => event.stopPropagation()}
        title={isFullscreen ? "Thu nhỏ bản đồ" : "Mở bản đồ toàn màn hình"}
        type="button"
      >
        {isFullscreen
          ? <Minimize2 aria-hidden="true" className="size-4" />
          : <Maximize2 aria-hidden="true" className="size-4" />}
      </button>
      {geoError && (
        <p className="absolute bottom-6 left-14 z-[1000] max-w-[calc(100%-5rem)] rounded border border-error/30 bg-background px-3 py-2 text-xs text-error shadow" role="status">
          {geoError}
        </p>
      )}
    </>
  );
}

function LocationMarker({ value, onChange, disabled }: MapInteractionProps & { value: MapCoordinates }) {
  const eventHandlers = useMemo<LeafletEventHandlerFnMap>(() => ({
    dragend(event) {
      if (disabled) return;
      const point = (event.target as LeafletMarker).getLatLng().wrap();
      const coordinates = selectedCoordinates(point.lat, point.lng);
      if (coordinates) onChange(coordinates);
    },
  }), [disabled, onChange]);

  return (
    <Marker
      alt="Vị trí đã chọn"
      draggable={!disabled}
      eventHandlers={eventHandlers}
      icon={LOCATION_ICON}
      position={[value.latitude, value.longitude]}
      title={disabled ? "Vị trí đã chọn" : "Kéo để thay đổi vị trí"}
    />
  );
}

export default function LocationPickerMap({
  value,
  onChange,
  disabled = false,
  defaultCenter = VIETNAM_CENTER,
  defaultZoom = 5,
  focusCenter = null,
  focusZoom,
}: LocationPickerProps) {
  const coordinates = value && parseMapCoordinates(value.latitude, value.longitude);
  const center = coordinates ?? defaultCenter;

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      className="location-picker-leaflet h-full w-full"
      scrollWheelZoom={false}
      zoom={coordinates ? SELECTED_ZOOM : defaultZoom}
      zoomControl={false}
    >
      <MapTiles />
      <ZoomControl zoomInTitle="Phóng to" zoomOutTitle="Thu nhỏ" />
      <MapInteractions disabled={disabled} focusCenter={focusCenter} focusZoom={focusZoom} onChange={onChange} value={coordinates} />
      {coordinates && <LocationMarker disabled={disabled} onChange={onChange} value={coordinates} />}
    </MapContainer>
  );
}

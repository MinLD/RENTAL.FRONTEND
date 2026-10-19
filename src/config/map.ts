const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const MAP_TILE_SOURCES = [
  {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: OSM_ATTRIBUTION,
    maxNativeZoom: 19,
  },
  {
    url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    attribution: `${OSM_ATTRIBUTION} | <a href="https://openstreetmap.de/">OSM Deutschland</a>`,
    maxNativeZoom: 18,
  },
] as const;

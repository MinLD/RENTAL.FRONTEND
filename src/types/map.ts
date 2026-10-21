export type MapCoordinates = {
  latitude: number;
  longitude: number;
};

export type MapReverseAddress = {
  addressDetail: string;
  provinceNames: string[];
  wardNames: string[];
};

export type LocationPickerProps = {
  value: MapCoordinates | null;
  onChange: (coordinates: MapCoordinates) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  defaultCenter?: MapCoordinates;
  defaultZoom?: number;
  focusCenter?: MapCoordinates | null;
  focusZoom?: number;
};

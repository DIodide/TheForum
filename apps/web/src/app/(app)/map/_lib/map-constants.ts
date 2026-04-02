/** MapBox uses [longitude, latitude] — the opposite of Leaflet's [lat, lng]. */
export const PRINCETON_CENTER = { lng: -74.6554, lat: 40.3473 } as const;

/** Southwest / Northeast corners in [lng, lat] for MapBox maxBounds. */
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [-74.674, 40.335],
  [-74.643, 40.358],
];

export const DEFAULT_ZOOM = 16;
export const MIN_ZOOM = 15;
export const MAX_ZOOM = 18;

/** Pin colors matching Figma design */
export const NOW_COLOR = "#FF7151";
export const FUTURE_COLOR = "#0A9CD5";

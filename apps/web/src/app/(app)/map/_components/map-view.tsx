"use client";

import { forwardRef, useCallback, useState } from "react";
import { Map as MapGL, type MapRef, Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import type { MapEvent } from "~/actions/map";
import { env } from "~/env";
import {
  CAMPUS_BOUNDS,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  PRINCETON_CENTER,
} from "../_lib/map-constants";
import { getTimeGroup } from "../_lib/map-helpers";
import { MapPin } from "./map-pin";
import { MapPopup } from "./map-popup";
import { MapPopupCarousel } from "./map-popup-carousel";

interface MapViewProps {
  locationGroups: Map<string, MapEvent[]>;
  selectedLocation: string | null;
  onSelectLocation: (locId: string | null) => void;
  onExpandEvent: (eventId: string) => void;
}

export const MapView = forwardRef<MapRef, MapViewProps>(function MapView(
  { locationGroups, selectedLocation, onSelectLocation, onExpandEvent },
  ref,
) {
  const [popupLoc, setPopupLoc] = useState<{
    lng: number;
    lat: number;
    events: MapEvent[];
  } | null>(null);

  const handleMarkerClick = useCallback(
    (locId: string, locEvents: MapEvent[]) => {
      const first = locEvents[0];
      if (!first) return;
      onSelectLocation(locId);
      setPopupLoc({ lng: first.longitude, lat: first.latitude, events: locEvents });
    },
    [onSelectLocation],
  );

  const handleMapClick = useCallback(() => {
    onSelectLocation(null);
    setPopupLoc(null);
  }, [onSelectLocation]);

  return (
    <MapGL
      ref={ref}
      mapboxAccessToken={env.NEXT_PUBLIC_CAMPUS_MAP_TOKEN}
      initialViewState={{
        longitude: PRINCETON_CENTER.lng,
        latitude: PRINCETON_CENTER.lat,
        zoom: DEFAULT_ZOOM,
        pitch: 0,
        bearing: 0,
      }}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      maxBounds={CAMPUS_BOUNDS}
      mapStyle={env.NEXT_PUBLIC_CAMPUS_MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
      reuseMaps
      onClick={handleMapClick}
    >
      <NavigationControl position="bottom-right" showCompass={false} />

      {Array.from(locationGroups.entries()).map(([locId, locEvents]) => {
        const first = locEvents[0];
        if (!first) return null;
        const isNow = getTimeGroup(first.rawDatetime) === "now";
        const isSelected = selectedLocation === locId;

        return (
          <Marker
            key={locId}
            longitude={first.longitude}
            latitude={first.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(locId, locEvents);
            }}
          >
            <MapPin
              isNow={isNow}
              count={locEvents.length > 1 ? locEvents.length : undefined}
              isSelected={isSelected}
            />
          </Marker>
        );
      })}

      {popupLoc && (
        <Popup
          longitude={popupLoc.lng}
          latitude={popupLoc.lat}
          anchor="bottom"
          offset={[0, -40] as [number, number]}
          closeOnClick={false}
          onClose={() => {
            setPopupLoc(null);
            onSelectLocation(null);
          }}
          maxWidth="340px"
          className="map-event-popup"
        >
          {popupLoc.events.length === 1 && popupLoc.events[0] ? (
            <MapPopup
              event={popupLoc.events[0]}
              onExpand={() => onExpandEvent(popupLoc.events[0]?.id ?? "")}
            />
          ) : (
            <MapPopupCarousel
              events={popupLoc.events}
              onExpand={(eventId) => onExpandEvent(eventId)}
            />
          )}
        </Popup>
      )}
    </MapGL>
  );
});

import { getMapEvents } from "~/actions/map";
import { MapClient } from "./map-client";

export default async function MapPage() {
  const events = await getMapEvents({ days: 7 });
  return <MapClient initialEvents={events} />;
}

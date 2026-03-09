import { notFound } from "next/navigation";
import { getEvent, getSimilarEvents } from "~/actions/events";
import { EventDetailClient } from "./event-detail-client";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) notFound();

  const similarEvents = await getSimilarEvents(id, event.tags, event.orgId);

  return <EventDetailClient event={event} similarEvents={similarEvents} />;
}

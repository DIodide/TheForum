import { notFound, redirect } from "next/navigation";
import { getCampusLocations, getEvent } from "~/actions/events";
import { EditEventForm } from "./edit-event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, locations] = await Promise.all([getEvent(id), getCampusLocations()]);

  if (!event) notFound();
  if (!event.isOwner) redirect(`/events/${id}`);

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Event</h1>
        <p className="text-sm text-gray-400 mt-1">Update your event details.</p>
      </div>
      <EditEventForm event={event} locations={locations} />
    </div>
  );
}

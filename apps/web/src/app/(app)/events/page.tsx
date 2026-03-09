import { getMyEvents } from "~/actions/events";
import { MyEventsClient } from "./my-events-client";

export default async function MyEventsPage() {
  const { created, rsvped, saved } = await getMyEvents();

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Events</h1>
        <p className="text-sm text-gray-400 mt-1">
          Events you&apos;ve created, RSVP&apos;d to, or saved.
        </p>
      </div>
      <MyEventsClient created={created} rsvped={rsvped} saved={saved} />
    </div>
  );
}

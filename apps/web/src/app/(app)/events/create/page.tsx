import { getCampusLocations } from "~/actions/events";
import { getUserOrgs } from "~/actions/orgs";
import { CreateEventForm } from "./create-event-form";

export default async function CreateEventPage() {
  const [locations, userOrgs] = await Promise.all([getCampusLocations(), getUserOrgs()]);

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Event</h1>
        <p className="text-sm text-gray-400 mt-1">Share something worth showing up for.</p>
      </div>
      <CreateEventForm locations={locations} userOrgs={userOrgs} />
    </div>
  );
}

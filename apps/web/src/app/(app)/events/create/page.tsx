import { getCampusLocations } from "~/actions/events";
import { getUserOrgs } from "~/actions/orgs";
import { CreateEventForm } from "./create-event-form";

export default async function CreateEventPage() {
  const [locations, userOrgs] = await Promise.all([getCampusLocations(), getUserOrgs()]);

  return <CreateEventForm locations={locations} userOrgs={userOrgs} />;
}

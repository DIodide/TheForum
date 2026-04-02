import { getMyEvents } from "~/actions/events";
import { MyEventsClient } from "./my-events-client";

export default async function MyEventsPage() {
  const { created, rsvped, saved } = await getMyEvents();

  return (
    <div className="px-[40px] py-[20px] max-w-5xl mx-auto">
      <h1 className="font-serif text-[60px] text-black leading-none mb-[24px]">Events</h1>
      <MyEventsClient created={created} rsvped={rsvped} saved={saved} />
    </div>
  );
}

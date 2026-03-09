import { getFeedEvents, getFriendsEvents, getSavedEvents } from "~/actions/events";
import { ExploreClient } from "./explore-client";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;

  const [feedResult, savedEvents, friendsEvents] = await Promise.all([
    getFeedEvents(search ? { search } : undefined),
    getSavedEvents(),
    getFriendsEvents(),
  ]);

  return (
    <ExploreClient
      initialEvents={feedResult.events}
      initialTotal={feedResult.total}
      savedEvents={savedEvents}
      friendsEvents={friendsEvents}
      initialSearch={search ?? ""}
    />
  );
}

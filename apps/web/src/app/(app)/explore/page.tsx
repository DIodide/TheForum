import { getCampusLocations, getExploreExperience } from "~/actions/events";
import { ExploreClient } from "./explore-client";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;

  const [experience, locations] = await Promise.all([
    getExploreExperience(search ? { search } : undefined),
    getCampusLocations(),
  ]);

  return (
    <ExploreClient
      initialExperience={experience}
      locations={locations}
      initialSearch={search ?? ""}
    />
  );
}

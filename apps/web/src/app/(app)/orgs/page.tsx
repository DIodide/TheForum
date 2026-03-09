import { getOrgs, getRecommendedOrgs } from "~/actions/orgs";
import { OrgsClient } from "./orgs-client";

export default async function OrgsPage() {
  const [orgs, recommended] = await Promise.all([getOrgs(), getRecommendedOrgs()]);

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Organizations</h1>
        <p className="text-sm text-gray-400 mt-1">
          Discover student groups and follow them for event updates.
        </p>
      </div>
      <OrgsClient initialOrgs={orgs} recommendedOrgs={recommended} />
    </div>
  );
}

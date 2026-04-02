import { getOrgs, getRecommendedOrgs } from "~/actions/orgs";
import { OrgsClient } from "./orgs-client";

export default async function OrgsPage() {
  const [orgs, recommended] = await Promise.all([getOrgs(), getRecommendedOrgs()]);

  return (
    <div className="px-[40px] py-[20px] max-w-4xl mx-auto">
      <h1 className="font-serif text-[48px] text-black leading-none mb-[24px]">Organizations</h1>
      <OrgsClient initialOrgs={orgs} recommendedOrgs={recommended} />
    </div>
  );
}

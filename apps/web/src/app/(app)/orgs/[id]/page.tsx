import { notFound } from "next/navigation";
import { getOrg } from "~/actions/orgs";
import { OrgProfileClient } from "./org-profile-client";

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getOrg(id);

  if (!org) notFound();

  return <OrgProfileClient org={org} />;
}

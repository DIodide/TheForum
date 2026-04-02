import { getFriends } from "~/actions/friends";
import { getUserProfile } from "~/actions/users";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const [profile, friends] = await Promise.all([getUserProfile(), getFriends()]);

  return <SettingsClient profile={profile} friends={friends} />;
}

import { getUserProfile } from "~/actions/users";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const profile = await getUserProfile();

  return (
    <div className="px-8 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your profile and preferences.</p>
      </div>
      <SettingsClient profile={profile} />
    </div>
  );
}

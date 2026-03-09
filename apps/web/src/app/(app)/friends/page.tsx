import { getFriends, getPendingRequests } from "~/actions/friends";
import { FriendsClient } from "./friends-client";

export default async function FriendsPage() {
  const [friends, pending] = await Promise.all([getFriends(), getPendingRequests()]);

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Friends</h1>
        <p className="text-sm text-gray-400 mt-1">Find people. See who&apos;s going where.</p>
      </div>
      <FriendsClient initialFriends={friends} initialPending={pending} />
    </div>
  );
}

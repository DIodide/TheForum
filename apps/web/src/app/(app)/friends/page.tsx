import { getFriends, getPendingRequests } from "~/actions/friends";
import { FriendsClient } from "./friends-client";

export default async function FriendsPage() {
  const [friends, pending] = await Promise.all([getFriends(), getPendingRequests()]);

  return (
    <div className="px-[40px] py-[20px] max-w-4xl mx-auto">
      <h1 className="font-serif text-[60px] text-black leading-none mb-[24px]">My Friends</h1>
      <FriendsClient initialFriends={friends} initialPending={pending} />
    </div>
  );
}

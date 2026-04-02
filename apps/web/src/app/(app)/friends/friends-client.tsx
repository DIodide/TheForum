"use client";

import { Check, Clock, Search, UserMinus, UserPlus, Users, X } from "lucide-react";
import { useCallback, useRef, useState, useTransition } from "react";
import {
  type FriendProfile,
  type FriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from "~/actions/friends";
import { cn } from "~/lib/utils";

function Avatar({
  name,
  avatarUrl,
  size = 56,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const initial = name[0]?.toUpperCase() ?? "?";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="rounded-[5px] border-[3px] border-forum-medium-gray object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-[5px] border-[3px] border-forum-medium-gray flex items-center justify-center bg-forum-turquoise/30 text-black font-bold"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initial}
    </div>
  );
}

interface FriendsClientProps {
  initialFriends: FriendProfile[];
  initialPending: {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  };
}

export function FriendsClient({ initialFriends, initialPending }: FriendsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [friends, setFriends] = useState(initialFriends);
  const [pending, setPending] = useState(initialPending);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(
    new Set(initialPending.outgoing.map((r) => r.id)),
  );
  const [activeTab, setActiveTab] = useState<"friends" | "find" | "requests">("friends");
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const friendIds = new Set(friends.map((f) => f.id));

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchUsers(query);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  }, []);

  const handleSendRequest = (userId: string) => {
    setSentIds((prev) => new Set([...prev, userId]));
    startTransition(async () => {
      await sendFriendRequest(userId);
    });
  };

  const handleAccept = (fromUserId: string) => {
    const accepted = pending.incoming.find((r) => r.id === fromUserId);
    setPending((prev) => ({ ...prev, incoming: prev.incoming.filter((r) => r.id !== fromUserId) }));
    if (accepted) {
      setFriends((prev) => [
        ...prev,
        {
          id: accepted.id,
          displayName: accepted.displayName,
          netId: accepted.netId,
          avatarUrl: accepted.avatarUrl,
          classYear: null,
          major: null,
        },
      ]);
    }
    startTransition(async () => {
      await acceptFriendRequest(fromUserId);
    });
  };

  const handleDecline = (fromUserId: string) => {
    setPending((prev) => ({ ...prev, incoming: prev.incoming.filter((r) => r.id !== fromUserId) }));
    startTransition(async () => {
      await declineFriendRequest(fromUserId);
    });
  };

  const handleRemove = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    startTransition(async () => {
      await removeFriend(friendId);
    });
  };

  const tabs = [
    { id: "friends" as const, label: "Your Friends", count: friends.length },
    { id: "find" as const, label: "Find New Friends", count: 0 },
    { id: "requests" as const, label: "Requests", count: pending.incoming.length },
  ];

  return (
    <div className="space-y-[24px]">
      {/* Tab bar */}
      <div className="bg-white rounded-[10px] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex">
          {tabs.map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 py-[16px] text-[16px] font-dm-sans font-semibold transition-colors relative",
                activeTab === id
                  ? "text-black"
                  : "text-forum-light-gray hover:text-forum-dark-gray",
              )}
            >
              {label}
              {count > 0 && (
                <span className="ml-2 text-[12px] px-[8px] py-[2px] rounded-full bg-forum-coral/10 text-forum-coral font-bold">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="h-[2px] bg-forum-medium-gray relative">
          <div
            className="absolute h-[2px] bg-forum-cerulean transition-all duration-300"
            style={{
              width: `${100 / tabs.length}%`,
              left: `${(tabs.findIndex((t) => t.id === activeTab) * 100) / tabs.length}%`,
            }}
          />
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-[17px] top-1/2 -translate-y-1/2 text-forum-placeholder"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="SEARCH USERS BY NAME OR NETID"
          className="w-full h-[42px] bg-forum-bg border border-forum-bg rounded-[10px] shadow-[5px_5px_10px_5px_rgba(0,0,0,0.05)] pl-[42px] pr-[17px] text-[14px] font-dm-sans tracking-wider text-black placeholder:text-[#a6a8ae] outline-none"
        />
      </div>

      {/* Search results overlay */}
      {searchQuery.trim() && (
        <div className="bg-white rounded-[10px] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          {isSearching ? (
            <div className="p-[20px] text-center text-[14px] text-forum-light-gray">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              {searchResults.map((user) => {
                const isFriend = friendIds.has(user.id);
                const isPendingSent = sentIds.has(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-[15px] px-[20px] py-[12px] hover:bg-forum-turquoise/5 transition-colors"
                  >
                    <Avatar name={user.displayName} avatarUrl={user.avatarUrl} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold font-dm-sans text-black truncate">
                        {user.displayName}
                      </p>
                      <p className="text-[12px] font-dm-sans text-forum-light-gray">
                        @{user.netId}
                        {user.classYear && ` · '${user.classYear.slice(-2)}`}
                      </p>
                    </div>
                    {isFriend ? (
                      <span className="text-[12px] font-bold text-forum-cerulean">Friends</span>
                    ) : isPendingSent ? (
                      <span className="text-[12px] font-bold text-forum-light-gray flex items-center gap-1">
                        <Clock size={12} /> Sent
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(user.id)}
                        disabled={isPending}
                        className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-[10px] bg-forum-cerulean text-white text-[12px] font-bold hover:opacity-90 disabled:opacity-50"
                      >
                        <UserPlus size={12} /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-[20px] text-center text-[14px] text-forum-light-gray">
              No users found
            </div>
          )}
        </div>
      )}

      {/* Tab content: Your Friends */}
      {activeTab === "friends" &&
        !searchQuery.trim() &&
        (friends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="group flex items-center gap-[15px] bg-white rounded-[10px] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] px-[20px] py-[14px] hover:bg-forum-turquoise/5 transition-colors"
              >
                <Avatar name={friend.displayName} avatarUrl={friend.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold font-dm-sans text-black truncate">
                    {friend.displayName}
                  </p>
                  <p className="text-[12px] font-dm-sans text-forum-light-gray">
                    @{friend.netId}
                    {friend.classYear && ` · '${friend.classYear.slice(-2)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(friend.id)}
                  className="p-2 rounded-full text-forum-medium-gray hover:text-forum-coral opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove friend"
                >
                  <UserMinus size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-[60px] bg-white rounded-[10px] shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">
            <Users size={32} className="text-forum-medium-gray mb-4" />
            <p className="font-serif text-[20px] text-forum-dark-gray mb-1">No friends yet</p>
            <p className="text-[14px] text-forum-light-gray">
              Search for classmates to start connecting.
            </p>
          </div>
        ))}

      {/* Tab content: Find New Friends */}
      {activeTab === "find" && !searchQuery.trim() && (
        <div className="flex flex-col items-center justify-center py-[60px] bg-white rounded-[10px] shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">
          <Search size={32} className="text-forum-medium-gray mb-4" />
          <p className="font-serif text-[20px] text-forum-dark-gray mb-1">Find your classmates</p>
          <p className="text-[14px] text-forum-light-gray">
            Use the search bar above to find people by name or NetID.
          </p>
        </div>
      )}

      {/* Tab content: Requests */}
      {activeTab === "requests" &&
        !searchQuery.trim() &&
        (pending.incoming.length > 0 ? (
          <div className="space-y-[12px]">
            {pending.incoming.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-[15px] bg-white rounded-[10px] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] px-[20px] py-[14px]"
              >
                <Avatar name={req.displayName} avatarUrl={req.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-dm-sans text-black">
                    <span className="font-bold">{req.displayName}</span> ({req.netId}) sent you a
                    friend request.
                  </p>
                </div>
                <div className="flex items-center gap-[8px]">
                  <button
                    type="button"
                    onClick={() => handleAccept(req.id)}
                    disabled={isPending}
                    className="px-[12px] py-[6px] rounded-[10px] bg-forum-cerulean text-white text-[12px] font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    ACCEPT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(req.id)}
                    disabled={isPending}
                    className="px-[12px] py-[6px] rounded-[10px] border border-forum-medium-gray text-[12px] font-bold text-forum-light-gray hover:border-forum-dark-gray disabled:opacity-50"
                  >
                    DECLINE
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-[60px] bg-white rounded-[10px] shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">
            <Check size={32} className="text-forum-medium-gray mb-4" />
            <p className="font-serif text-[20px] text-forum-dark-gray mb-1">All caught up</p>
            <p className="text-[14px] text-forum-light-gray">No pending friend requests.</p>
          </div>
        ))}
    </div>
  );
}

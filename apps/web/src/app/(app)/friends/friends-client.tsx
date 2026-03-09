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
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

function colorFromString(str: string) {
  const colors = [
    "#6366f1",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#8b5cf6",
    "#22c55e",
    "#ef4444",
    "#3b82f6",
    "#06b6d4",
    "#eab308",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length] ?? "#6366f1";
}

function Avatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const initial = name[0]?.toUpperCase() ?? "?";
  const bg = colorFromString(name);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size * 0.4,
      }}
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
    // Optimistic: move from incoming to friends
    const accepted = pending.incoming.find((r) => r.id === fromUserId);
    setPending((prev) => ({
      ...prev,
      incoming: prev.incoming.filter((r) => r.id !== fromUserId),
    }));
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
    setPending((prev) => ({
      ...prev,
      incoming: prev.incoming.filter((r) => r.id !== fromUserId),
    }));
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

  const totalPending = pending.incoming.length + pending.outgoing.length;

  return (
    <div className="space-y-8">
      {/* ── Search ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or NetID..."
              className="h-12 pl-11 text-base border-gray-200 bg-gray-50/50 placeholder:text-gray-300 focus:bg-white transition-colors rounded-xl"
            />
          </div>
        </div>

        {/* Search results */}
        {searchQuery.trim() && (
          <div className="border-t border-gray-100">
            {isSearching ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-400">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {searchResults.map((user) => {
                  const isFriend = friendIds.has(user.id);
                  const isPendingSent = sentIds.has(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <Avatar name={user.displayName} avatarUrl={user.avatarUrl} size={42} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-gray-400">
                          @{user.netId}
                          {user.classYear && ` · '${user.classYear.slice(-2)}`}
                          {user.major && ` · ${user.major}`}
                        </p>
                      </div>
                      {isFriend ? (
                        <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                          <Check size={12} />
                          Friends
                        </span>
                      ) : isPendingSent ? (
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <Clock size={12} />
                          Pending
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(user.id)}
                          disabled={isPending}
                          className="rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs gap-1.5 h-8 px-4"
                        >
                          <UserPlus size={12} />
                          Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-400">
                  No users found for &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Pending Requests ────────────────────────────── */}
      {totalPending > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            Pending
            <span className="bg-amber-100 text-amber-600 text-xs px-2 py-0.5 rounded-full font-semibold">
              {totalPending}
            </span>
          </h2>

          <div className="space-y-3">
            {/* Incoming */}
            {pending.incoming.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4"
              >
                <Avatar name={req.displayName} avatarUrl={req.avatarUrl} size={42} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{req.displayName}</p>
                  <p className="text-xs text-gray-400">@{req.netId} wants to be friends</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(req.id)}
                    disabled={isPending}
                    className="rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs gap-1 h-8 px-4"
                  >
                    <Check size={12} />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecline(req.id)}
                    disabled={isPending}
                    className="rounded-full text-xs gap-1 h-8 px-3 border-gray-200 text-gray-500 hover:text-gray-700"
                  >
                    <X size={12} />
                  </Button>
                </div>
              </div>
            ))}

            {/* Outgoing */}
            {pending.outgoing.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 opacity-70"
              >
                <Avatar name={req.displayName} avatarUrl={req.avatarUrl} size={42} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{req.displayName}</p>
                  <p className="text-xs text-gray-400">@{req.netId}</p>
                </div>
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                  <Clock size={11} />
                  Sent
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Friends List ─────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          Your Friends
          {friends.length > 0 && (
            <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-semibold">
              {friends.length}
            </span>
          )}
        </h2>

        {friends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:border-gray-200 transition-colors"
              >
                <Avatar name={friend.displayName} avatarUrl={friend.avatarUrl} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {friend.displayName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    @{friend.netId}
                    {friend.classYear && ` · '${friend.classYear.slice(-2)}`}
                    {friend.major && ` · ${friend.major}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(friend.id)}
                  className="p-2 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove friend"
                >
                  <UserMinus size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Users size={22} className="text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">No friends yet</h3>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              Search for classmates above to start connecting. See who&apos;s attending events
              you&apos;re interested in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { CalendarDays, ChevronLeft, Heart, MapPin, Search, Shield, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { type FriendProfile, searchUsers } from "~/actions/friends";
import { type OrgDetail, addOfficer, removeOfficer, toggleFollowOrg } from "~/actions/orgs";
import { getCardColor } from "~/components/events/event-card";
import { cn } from "~/lib/utils";

function colorFromString(str: string) {
  const colors = ["#6366f1", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#22c55e", "#3b82f6"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length] ?? "#6366f1";
}

interface OrgProfileClientProps {
  org: OrgDetail;
}

export function OrgProfileClient({ org }: OrgProfileClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFollowing, setIsFollowing] = useState(org.isFollowing);
  const [followerCount, setFollowerCount] = useState(org.followerCount);

  const handleToggleFollow = () => {
    setIsFollowing(!isFollowing);
    setFollowerCount((c) => (isFollowing ? c - 1 : c + 1));
    startTransition(async () => {
      const result = await toggleFollowOrg(org.id);
      setIsFollowing(result.following);
    });
  };

  const [members, setMembers] = useState(org.members);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const owners = members.filter((m) => m.role === "owner");
  const officers = members.filter((m) => m.role === "officer");
  const memberIds = new Set(members.map((m) => m.id));

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const results = await searchUsers(query);
      setSearchResults(results.filter((u) => !memberIds.has(u.id)));
      setIsSearching(false);
    },
    [memberIds],
  );

  const handleAddOfficer = (user: FriendProfile) => {
    startTransition(async () => {
      await addOfficer(org.id, user.id);
      setMembers((prev) => [
        ...prev,
        { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl, role: "officer" },
      ]);
      setSearchQuery("");
      setSearchResults([]);
      toast.success(`${user.displayName} added as officer`);
    });
  };

  const handleRemoveOfficer = (userId: string, name: string) => {
    startTransition(async () => {
      await removeOfficer(org.id, userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      toast.success(`${name} removed`);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6 group"
      >
        <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div
          className="h-28 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${colorFromString(org.name)}20, ${colorFromString(org.name)}40)`,
          }}
        >
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={org.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <span className="text-4xl font-black" style={{ color: colorFromString(org.name) }}>
              {org.name[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
              <p className="text-sm text-gray-400 capitalize mt-0.5">{org.category}</p>
            </div>
            <button
              type="button"
              onClick={handleToggleFollow}
              disabled={isPending}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors",
                isFollowing
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                  : "bg-indigo-500 text-white hover:bg-indigo-600",
              )}
            >
              <Heart size={14} fill={isFollowing ? "currentColor" : "none"} />
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm text-gray-500 flex items-center gap-1.5">
              <Users size={14} className="text-gray-400" />
              {followerCount} follower{followerCount !== 1 ? "s" : ""}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1.5">
              <CalendarDays size={14} className="text-gray-400" />
              {org.upcomingEvents.length} upcoming event{org.upcomingEvents.length !== 1 ? "s" : ""}
            </span>
          </div>

          {org.description && (
            <p className="text-sm text-gray-600 leading-relaxed mt-4 whitespace-pre-wrap">
              {org.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Events */}
        <div className="md:col-span-2">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Upcoming Events
          </h2>
          {org.upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {org.upcomingEvents.map((event) => {
                const color = getCardColor(event.id);
                return (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: color.bg }}
                      >
                        <CalendarDays size={16} style={{ color: color.text }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {event.datetime}
                          <span className="mx-1.5">·</span>
                          <MapPin size={10} className="inline -mt-0.5" /> {event.locationName}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <CalendarDays size={20} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No upcoming events</p>
            </div>
          )}
        </div>

        {/* Right: Members */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Team</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {[...owners, ...officers].map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: colorFromString(member.displayName) }}
                >
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    member.displayName[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{member.displayName}</p>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                  {member.role === "owner" && <Shield size={10} className="text-amber-500" />}
                  {member.role}
                </span>
                {org.isOwner && member.role === "officer" && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOfficer(member.id, member.displayName)}
                    disabled={isPending}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            {owners.length === 0 && officers.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-400">No team members listed</p>
              </div>
            )}
          </div>

          {/* Add officer search — owner only */}
          {org.isOwner && (
            <div className="mt-4">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                />
                <input
                  type="text"
                  placeholder="Search users to add..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white rounded-lg border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 px-3 py-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: colorFromString(user.displayName) }}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          user.displayName[0]?.toUpperCase()
                        )}
                      </div>
                      <span className="flex-1 text-sm text-gray-700 truncate">
                        {user.displayName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddOfficer(user)}
                        disabled={isPending}
                        className="text-xs text-indigo-500 font-medium hover:text-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {isSearching && <p className="text-xs text-gray-400 mt-2 px-1">Searching...</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Heart, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState, useTransition } from "react";
import { type OrgListItem, getOrgs, toggleFollowOrg } from "~/actions/orgs";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

const ORG_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "career", label: "Career" },
  { id: "affinity", label: "Affinity" },
  { id: "performance", label: "Performance" },
  { id: "academic", label: "Academic" },
  { id: "athletic", label: "Athletic" },
  { id: "social", label: "Social" },
  { id: "cultural", label: "Cultural" },
  { id: "religious", label: "Religious" },
  { id: "political", label: "Political" },
  { id: "service", label: "Service" },
];

function orgColor(name: string) {
  const colors = [
    { bg: "#eef2ff", text: "#4338ca" },
    { bg: "#fef3c7", text: "#92400e" },
    { bg: "#ecfdf5", text: "#065f46" },
    { bg: "#fce7f3", text: "#9d174d" },
    { bg: "#eff6ff", text: "#1e40af" },
    { bg: "#fef9c3", text: "#854d0e" },
    { bg: "#f0fdf4", text: "#166534" },
    { bg: "#faf5ff", text: "#6b21a8" },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length] ?? colors[0];
}

interface OrgsClientProps {
  initialOrgs: OrgListItem[];
  recommendedOrgs: OrgListItem[];
}

export function OrgsClient({ initialOrgs, recommendedOrgs }: OrgsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [orgs, setOrgs] = useState(initialOrgs);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const refreshOrgs = useCallback((search?: string, category?: string) => {
    startTransition(async () => {
      const result = await getOrgs({
        search: search || undefined,
        category: category === "all" ? undefined : category,
      });
      setOrgs(result);
    });
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      refreshOrgs(query, activeCategory);
    }, 300);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    refreshOrgs(searchQuery, cat);
  };

  const handleToggleFollow = (orgId: string) => {
    setOrgs((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? {
              ...o,
              isFollowing: !o.isFollowing,
              followerCount: o.isFollowing ? o.followerCount - 1 : o.followerCount + 1,
            }
          : o,
      ),
    );
    startTransition(async () => {
      await toggleFollowOrg(orgId);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search + Create */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search organizations..."
            className="h-11 pl-11 border-gray-200 bg-white placeholder:text-gray-300 rounded-xl"
          />
        </div>
        <Link href="/orgs/create">
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl h-11 gap-1.5">
            <Plus size={14} />
            Create
          </Button>
        </Link>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {ORG_CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleCategoryChange(id)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              activeCategory === id
                ? "bg-indigo-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Recommended for You */}
      {recommendedOrgs.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Recommended for You
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recommendedOrgs.map((org) => {
              const color = orgColor(org.name);
              return (
                <Link
                  key={org.id}
                  href={`/orgs/${org.id}`}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: color?.bg }}
                  >
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-sm font-black" style={{ color: color?.text }}>
                        {org.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{org.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{org.category}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Orgs grid */}
      {orgs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgs.map((org) => {
            const color = orgColor(org.name);
            return (
              <div
                key={org.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link href={`/orgs/${org.id}`}>
                  <div
                    className="h-20 flex items-center justify-center"
                    style={{ background: color?.bg }}
                  >
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-black" style={{ color: color?.text }}>
                        {org.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/orgs/${org.id}`}>
                    <h3 className="text-sm font-bold text-gray-800 hover:text-indigo-600 transition-colors">
                      {org.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{org.category}</p>
                  {org.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{org.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Users size={11} />
                      {org.followerCount} follower{org.followerCount !== 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(org.id)}
                      disabled={isPending}
                      className={cn(
                        "text-xs font-medium px-3 py-1 rounded-full transition-colors flex items-center gap-1",
                        org.isFollowing
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600",
                      )}
                    >
                      <Heart size={10} fill={org.isFollowing ? "currentColor" : "none"} />
                      {org.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <Users size={24} className="text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">No organizations found</h3>
          <p className="text-sm text-gray-400">
            {searchQuery || activeCategory !== "all"
              ? "Try adjusting your search or filters."
              : "Be the first to create one!"}
          </p>
        </div>
      )}
    </div>
  );
}

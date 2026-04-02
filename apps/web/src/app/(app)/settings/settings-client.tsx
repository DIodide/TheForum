"use client";

import { ArrowLeft, ExternalLink, Pencil, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { FriendProfile } from "~/actions/friends";
import { getPresignedUploadUrl } from "~/actions/upload";
import { type UserProfile, updateAvatar, updateProfile } from "~/actions/users";
import { cn } from "~/lib/utils";

const INTEREST_TAGS = [
  { id: "free-food", label: "free food" },
  { id: "tech", label: "technology" },
  { id: "workshop", label: "hackathon" },
  { id: "art", label: "graphic design" },
  { id: "wellness", label: "fitness & health" },
  { id: "academic", label: "science and engineering" },
  { id: "career", label: "career" },
  { id: "music", label: "music" },
  { id: "social", label: "social" },
  { id: "sports", label: "sports" },
  { id: "performance", label: "performance" },
  { id: "cultural", label: "cultural" },
  { id: "community-service", label: "service" },
  { id: "religious", label: "religious" },
  { id: "political", label: "political" },
  { id: "gaming", label: "gaming" },
  { id: "outdoor", label: "outdoor" },
  { id: "speaker", label: "speaker" },
];

const SUGGESTION_TAGS = [
  "tech talk",
  "Jane Street",
  "consulting",
  "internship",
  "Citadel",
  "Lockheed Martin",
  "free merch",
  "Bain & Company",
];

const CLASS_YEARS = ["2025", "2026", "2027", "2028", "2029", "Grad"];

interface SettingsClientProps {
  profile: UserProfile;
  friends: FriendProfile[];
}

export function SettingsClient({ profile, friends }: SettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [classYear, setClassYear] = useState(profile.classYear ?? "");
  const [major, setMajor] = useState(profile.major ?? "");
  const [isOrgLeader, setIsOrgLeader] = useState(profile.isOrgLeader);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [friendSearch, setFriendSearch] = useState("");
  const [orgSearch, setOrgSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");

  const toggleInterest = (id: string) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateProfile({
        classYear,
        major,
        isOrgLeader,
        interests,
        regions: [],
      });
      router.push("/explore");
    });
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl);

  const handleAvatarUpload = async (file: File) => {
    // Preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const { uploadUrl, publicUrl } = await getPresignedUploadUrl({
        filename: file.name,
        contentType: file.type,
        size: file.size,
        folder: "avatars",
      });
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      await updateAvatar(publicUrl);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setAvatarPreview(profile.avatarUrl);
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      !friendSearch ||
      f.displayName.toLowerCase().includes(friendSearch.toLowerCase()) ||
      f.netId.toLowerCase().includes(friendSearch.toLowerCase()),
  );

  return (
    <div className="px-[40px] py-[20px] max-w-[1200px] mx-auto">
      {/* Top bar — pr-[100px] reserves space so buttons don't overlap the TopBar notification/avatar */}
      <div className="flex items-center justify-between mb-[20px] pr-[100px]">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-[6px] text-[13px] font-dm-sans text-forum-dark-gray hover:text-black transition-colors"
        >
          <ArrowLeft size={14} />
          BACK
        </button>
        <div className="flex items-center gap-[12px]">
          <button
            type="button"
            onClick={() => router.push("/explore")}
            className="text-[13px] font-dm-sans text-forum-light-gray hover:text-forum-dark-gray transition-colors"
          >
            EXIT
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-[20px] py-[8px] bg-forum-coral text-white text-[12px] font-bold font-dm-sans rounded-[6px] hover:opacity-90 disabled:opacity-50 transition-all tracking-wider"
          >
            {isPending ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </div>

      {/* Title */}
      <h1 className="font-serif text-[36px] font-bold text-black mb-[30px]">My Account</h1>

      {/* ═══ Personal Info ═══ */}
      <div className="mb-[30px]">
        <div className="flex items-center gap-[8px] mb-[16px]">
          <div className="w-[12px] h-[12px] rounded-full bg-forum-coral" />
          <h2 className="font-serif text-[20px] text-forum-coral font-bold">Personal Info</h2>
        </div>

        <div className="flex items-start gap-[30px]">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-[8px]">
            <div className="w-[120px] h-[120px] rounded-full border-[4px] border-forum-medium-gray overflow-hidden bg-forum-turquoise/20">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[40px] font-bold text-black font-serif">
                  {profile.displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="flex items-center gap-[4px] px-[10px] py-[4px] rounded-[6px] border border-forum-cerulean text-forum-cerulean text-[11px] font-bold font-dm-sans hover:bg-forum-cerulean/5 transition-colors"
            >
              <Pencil size={10} />
              Edit Photo
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
            />
          </div>

          {/* Name + Class Year inline */}
          <div className="flex-1 pt-[10px]">
            <div className="flex gap-[20px] mb-[10px]">
              <div className="flex-1">
                <span className="text-[12px] font-bold text-forum-coral block mb-[4px]">
                  Name *
                </span>
                <div className="flex items-center gap-[8px] border-b border-forum-medium-gray pb-[6px]">
                  <span className="text-[15px] font-dm-sans text-black">{profile.displayName}</span>
                  <Pencil size={11} className="text-forum-light-gray" />
                </div>
              </div>
              <div className="w-[140px]">
                <span className="text-[12px] font-bold text-forum-coral block mb-[4px]">
                  Class Year *
                </span>
                <select
                  value={classYear}
                  onChange={(e) => setClassYear(e.target.value)}
                  className="w-full border-b border-forum-medium-gray pb-[6px] text-[15px] font-dm-sans text-black bg-transparent outline-none appearance-none"
                >
                  <option value="">Select</option>
                  {CLASS_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Friends + Organizations — two columns ═══ */}
      <div className="flex gap-[30px] mb-[30px]">
        {/* Friends column */}
        <div className="flex-1">
          <div className="flex items-center gap-[8px] mb-[12px]">
            <div className="w-[12px] h-[12px] rounded-full bg-forum-coral" />
            <h2 className="font-serif text-[20px] text-forum-coral font-bold">Friends</h2>
          </div>

          {/* Search */}
          <div className="relative mb-[12px]">
            <Search
              size={14}
              className="absolute left-[10px] top-1/2 -translate-y-1/2 text-forum-placeholder"
            />
            <input
              type="text"
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-[32px] pl-[30px] pr-[10px] border border-forum-medium-gray rounded-[6px] text-[12px] font-dm-sans outline-none focus:border-forum-cerulean"
            />
          </div>

          {/* Friend list */}
          <div className="space-y-[8px] max-h-[260px] overflow-y-auto">
            {filteredFriends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-[10px]">
                <div className="w-[36px] h-[36px] rounded-full overflow-hidden bg-forum-turquoise/20 flex-shrink-0">
                  {friend.avatarUrl ? (
                    <img
                      src={friend.avatarUrl}
                      alt={friend.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[13px] font-bold text-black">
                      {friend.displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-bold font-dm-sans text-black block truncate">
                    {friend.displayName}
                  </span>
                  <span className="text-[10px] font-dm-sans text-forum-light-gray">
                    @{friend.netId}
                  </span>
                </div>
                {friend.classYear && (
                  <span className="text-[11px] font-dm-sans text-forum-light-gray">
                    &apos;{friend.classYear.slice(-2)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Edit friends link */}
          <Link
            href="/friends"
            className="flex items-center gap-[6px] mt-[12px] px-[12px] py-[6px] border border-forum-medium-gray rounded-[6px] text-[10px] font-bold font-dm-sans text-forum-dark-gray tracking-wider hover:border-forum-dark-gray transition-colors w-fit"
          >
            ADD / EDIT MY FRIENDS LIST
            <ExternalLink size={10} />
          </Link>
        </div>

        {/* Organizations column */}
        <div className="flex-1">
          <div className="flex items-center gap-[8px] mb-[12px]">
            <div className="w-[12px] h-[12px] rounded-full bg-forum-coral" />
            <h2 className="font-serif text-[20px] text-forum-coral font-bold">Organizations</h2>
          </div>

          {/* Search */}
          <div className="relative mb-[12px]">
            <Search
              size={14}
              className="absolute left-[10px] top-1/2 -translate-y-1/2 text-forum-placeholder"
            />
            <input
              type="text"
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-[32px] pl-[30px] pr-[10px] border border-forum-medium-gray rounded-[6px] text-[12px] font-dm-sans outline-none focus:border-forum-cerulean"
            />
          </div>

          {/* Org list placeholder */}
          <div className="space-y-[8px] max-h-[260px] overflow-y-auto">
            <p className="text-[12px] font-dm-sans text-forum-light-gray italic">
              No organizations yet. Follow orgs from the Orgs page.
            </p>
          </div>

          <Link
            href="/orgs"
            className="flex items-center gap-[6px] mt-[12px] px-[12px] py-[6px] border border-forum-medium-gray rounded-[6px] text-[10px] font-bold font-dm-sans text-forum-dark-gray tracking-wider hover:border-forum-dark-gray transition-colors w-fit"
          >
            ADD / EDIT MY ORGANIZATIONS
            <ExternalLink size={10} />
          </Link>
        </div>
      </div>

      {/* ═══ Interest Tags ═══ */}
      <div className="mb-[40px]">
        <div className="flex items-center gap-[8px] mb-[16px]">
          <div className="w-[12px] h-[12px] rounded-full bg-forum-coral" />
          <h2 className="font-serif text-[20px] text-forum-coral font-bold">Interest Tags</h2>
        </div>

        <div className="flex gap-[30px]">
          {/* Selected topics */}
          <div className="flex-1">
            <span className="text-[12px] font-bold font-dm-sans text-forum-dark-gray block mb-[10px]">
              Topics
            </span>
            <div className="flex flex-wrap gap-[8px]">
              {interests.map((tagId) => {
                const tag = INTEREST_TAGS.find((t) => t.id === tagId);
                return (
                  <button
                    key={tagId}
                    type="button"
                    onClick={() => toggleInterest(tagId)}
                    className="flex items-center gap-[4px] h-[28px] px-[12px] rounded-[14px] bg-forum-cerulean text-white text-[11px] font-bold font-dm-sans"
                  >
                    {tag?.label ?? tagId}
                    <X size={11} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search for new tags */}
          <div className="flex-1">
            <div className="flex items-center gap-[8px] mb-[10px]">
              <Search size={12} className="text-forum-placeholder" />
              <span className="text-[12px] font-bold font-dm-sans text-forum-dark-gray">
                Search for new tags
              </span>
            </div>

            {/* Active filter tags (coral) */}
            <div className="flex flex-wrap gap-[6px] mb-[10px]">
              {interests.slice(0, 1).map((tagId) => {
                const tag = INTEREST_TAGS.find((t) => t.id === tagId);
                return (
                  <span
                    key={tagId}
                    className="h-[26px] px-[10px] rounded-[13px] border border-forum-coral text-forum-coral text-[11px] font-bold font-dm-sans flex items-center bg-forum-coral-light"
                  >
                    {tag?.label ?? tagId}
                  </span>
                );
              })}
            </div>

            {/* Suggestion tags */}
            <div className="flex flex-wrap gap-[6px]">
              {SUGGESTION_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="h-[26px] px-[10px] rounded-[13px] border border-forum-medium-gray text-forum-light-gray text-[11px] font-bold font-dm-sans flex items-center cursor-pointer hover:border-forum-dark-gray transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Organizations — link to orgs page */}
        <div className="mt-[20px]">
          <span className="text-[12px] font-bold font-dm-sans text-forum-coral block mb-[8px]">
            Organizations
          </span>
          <p className="text-[12px] font-dm-sans text-forum-light-gray">
            Manage your organization memberships from the{" "}
            <Link href="/orgs" className="text-forum-cerulean hover:underline">
              Orgs page
            </Link>
            .
          </p>
        </div>
      </div>

      {/* ═══ Friends + Organizations (bottom expanded view) ═══ */}
      <div className="flex gap-[30px] mb-[40px]">
        {/* Friends expanded */}
        <div className="flex-1">
          <div className="flex items-center gap-[8px] mb-[12px]">
            <div className="w-[12px] h-[12px] rounded-full bg-forum-coral" />
            <h2 className="font-serif text-[20px] text-forum-coral font-bold">Friends</h2>
          </div>

          {/* Avatar large */}
          <div className="w-[120px] h-[120px] rounded-full border-[4px] border-forum-medium-gray overflow-hidden bg-forum-turquoise/20 mx-auto mb-[16px]">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[40px] font-bold text-black font-serif">
                {profile.displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="relative mb-[12px]">
            <Search
              size={14}
              className="absolute left-[10px] top-1/2 -translate-y-1/2 text-forum-placeholder"
            />
            <input
              type="text"
              placeholder="Search"
              className="w-full h-[32px] pl-[30px] pr-[10px] border border-forum-medium-gray rounded-[6px] text-[12px] font-dm-sans outline-none focus:border-forum-cerulean"
            />
          </div>

          <div className="space-y-[8px]">
            {friends.map((friend) => (
              <div key={`bottom-${friend.id}`} className="flex items-center gap-[10px]">
                <div className="w-[36px] h-[36px] rounded-full overflow-hidden bg-forum-turquoise/20 flex-shrink-0">
                  {friend.avatarUrl ? (
                    <img
                      src={friend.avatarUrl}
                      alt={friend.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[13px] font-bold text-black">
                      {friend.displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-bold font-dm-sans text-black truncate block">
                    {friend.displayName}
                  </span>
                  <span className="text-[10px] font-dm-sans text-forum-light-gray">
                    @{friend.netId}
                  </span>
                </div>
                {friend.classYear && (
                  <span className="text-[11px] font-dm-sans text-forum-light-gray">
                    &apos;{friend.classYear.slice(-2)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <Link
            href="/friends"
            className="flex items-center gap-[6px] mt-[12px] px-[12px] py-[6px] border border-forum-medium-gray rounded-[6px] text-[10px] font-bold font-dm-sans text-forum-dark-gray tracking-wider hover:border-forum-dark-gray transition-colors w-fit"
          >
            ADD / EDIT MY FRIENDS LIST
            <ExternalLink size={10} />
          </Link>
        </div>

        {/* Organizations expanded */}
        <div className="flex-1">
          <div className="flex items-center gap-[8px] mb-[12px]">
            <div className="w-[12px] h-[12px] rounded-full bg-forum-coral" />
            <h2 className="font-serif text-[20px] text-forum-coral font-bold">Organizations</h2>
          </div>

          <div className="relative mb-[12px]">
            <Search
              size={14}
              className="absolute left-[10px] top-1/2 -translate-y-1/2 text-forum-placeholder"
            />
            <input
              type="text"
              placeholder="Search"
              className="w-full h-[32px] pl-[30px] pr-[10px] border border-forum-medium-gray rounded-[6px] text-[12px] font-dm-sans outline-none focus:border-forum-cerulean"
            />
          </div>

          <div className="space-y-[8px]">
            {[1, 2, 3, 4].map((i) => (
              <div key={`org-${i}`} className="flex items-center gap-[10px]">
                <div className="w-[36px] h-[36px] rounded-[5px] bg-forum-cerulean/20 flex-shrink-0 flex items-center justify-center">
                  <div className="w-[20px] h-[20px] bg-forum-cerulean rounded-[3px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-bold font-dm-sans text-black block">
                    Princeton TigerApps
                  </span>
                  <span className="text-[10px] font-dm-sans text-forum-light-gray">
                    Design Lead
                  </span>
                </div>
                <button
                  type="button"
                  className="text-[10px] font-bold font-dm-sans text-forum-light-gray hover:text-forum-dark-gray transition-colors"
                >
                  Edit Role
                </button>
              </div>
            ))}
          </div>

          <Link
            href="/orgs"
            className="flex items-center gap-[6px] mt-[12px] px-[12px] py-[6px] border border-forum-medium-gray rounded-[6px] text-[10px] font-bold font-dm-sans text-forum-dark-gray tracking-wider hover:border-forum-dark-gray transition-colors w-fit"
          >
            ADD / EDIT MY ORGANIZATIONS
            <ExternalLink size={10} />
          </Link>
        </div>
      </div>
    </div>
  );
}

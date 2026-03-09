"use client";

import { Check, Mail, User } from "lucide-react";
import { useState, useTransition } from "react";
import { type UserProfile, updateProfile } from "~/actions/users";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

const INTEREST_TAGS = [
  { id: "free-food", label: "Free Food", emoji: "🍕" },
  { id: "workshop", label: "Workshop", emoji: "🔧" },
  { id: "performance", label: "Performance", emoji: "🎭" },
  { id: "speaker", label: "Speaker", emoji: "🎤" },
  { id: "social", label: "Social", emoji: "🎉" },
  { id: "career", label: "Career", emoji: "💼" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "art", label: "Art", emoji: "🎨" },
  { id: "academic", label: "Academic", emoji: "📚" },
  { id: "cultural", label: "Cultural", emoji: "🌍" },
  { id: "community-service", label: "Service", emoji: "🤝" },
  { id: "religious", label: "Religious", emoji: "🕊️" },
  { id: "political", label: "Political", emoji: "🏛️" },
  { id: "tech", label: "Tech", emoji: "💻" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "outdoor", label: "Outdoor", emoji: "🌲" },
  { id: "wellness", label: "Wellness", emoji: "🧘" },
];

const CAMPUS_REGIONS = [
  { id: "central", label: "Central Campus" },
  { id: "east", label: "East Campus" },
  { id: "west", label: "West Campus" },
  { id: "south", label: "South Campus" },
  { id: "north", label: "North Campus" },
  { id: "off-campus", label: "Off Campus" },
];

const CLASS_YEARS = ["2025", "2026", "2027", "2028", "2029", "Grad"];

interface SettingsClientProps {
  profile: UserProfile;
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [classYear, setClassYear] = useState(profile.classYear ?? "");
  const [major, setMajor] = useState(profile.major ?? "");
  const [isOrgLeader, setIsOrgLeader] = useState(profile.isOrgLeader);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [regions, setRegions] = useState<string[]>(profile.regions);

  const toggleInterest = (id: string) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleRegion = (id: string) => {
    setRegions((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateProfile({
        classYear,
        major,
        isOrgLeader,
        interests,
        regions,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Account info (read-only) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <User size={14} />
          Account
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Name</span>
            <span className="text-sm font-medium text-gray-800">{profile.displayName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">NetID</span>
            <span className="text-sm font-medium text-gray-800">@{profile.netId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center gap-1.5">
              <Mail size={12} /> Email
            </span>
            <span className="text-sm font-medium text-gray-800">{profile.email}</span>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Demographics
        </h2>

        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Class Year</Label>
            <div className="flex flex-wrap gap-2">
              {CLASS_YEARS.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setClassYear(year)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                    classYear === year
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="major" className="text-sm font-medium text-gray-700 mb-2 block">
              Major / Concentration
            </Label>
            <Input
              id="major"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="e.g. Computer Science"
              className="h-11 border-gray-200 bg-gray-50/50"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Organization Leader
            </Label>
            <button
              type="button"
              onClick={() => setIsOrgLeader(!isOrgLeader)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                isOrgLeader ? "bg-indigo-500" : "bg-gray-300",
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                  isOrgLeader ? "translate-x-5.5" : "translate-x-0.5",
                )}
              />
            </button>
            <p className="text-xs text-gray-400 mt-1">
              {isOrgLeader
                ? "You can create organizations and post events on their behalf."
                : "Enable to create organizations."}
            </p>
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Interests</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {INTEREST_TAGS.map(({ id, label, emoji }) => {
            const selected = interests.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleInterest(id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-center",
                  selected
                    ? "border-indigo-400 bg-indigo-50 shadow-sm shadow-indigo-100"
                    : "border-gray-100 hover:border-gray-200 bg-gray-50/30",
                )}
              >
                <span className="text-lg">{emoji}</span>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-tight",
                    selected ? "text-indigo-700" : "text-gray-500",
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campus Regions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Campus Regions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CAMPUS_REGIONS.map(({ id, label }) => {
            const selected = regions.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleRegion(id)}
                className={cn(
                  "px-4 py-3 rounded-xl border text-sm font-medium text-left transition-colors",
                  selected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pb-8">
        {saved && (
          <span className="text-sm text-emerald-500 font-medium flex items-center gap-1">
            <Check size={14} />
            Saved
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-8 h-11 font-semibold"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

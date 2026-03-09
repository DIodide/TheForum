"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeOnboarding } from "~/actions/users";
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
  { id: "central", label: "Central Campus", desc: "Frist, Nassau Hall" },
  { id: "east", label: "East Campus", desc: "E-Quad, Bloomberg" },
  { id: "west", label: "West Campus", desc: "Wu, Forbes" },
  { id: "south", label: "South Campus", desc: "Jadwin, Stadium" },
  { id: "north", label: "North Campus", desc: "Grad College, Lawrence" },
  { id: "off-campus", label: "Off Campus", desc: "Nassau St, town" },
];

const CLASS_YEARS = ["2025", "2026", "2027", "2028", "2029", "Grad"];

const STEPS = ["Interests", "About You", "Almost Done"];

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [classYear, setClassYear] = useState("");
  const [major, setMajor] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [isOrgLeader, setIsOrgLeader] = useState(false);

  const toggleInterest = (id: string) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleRegion = (id: string) => {
    setRegions((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const canProceed =
    step === 0 ? interests.length >= 1 : step === 1 ? classYear !== "" && major !== "" : true;

  const handleSubmit = () => {
    startTransition(async () => {
      await completeOnboarding({
        interests,
        classYear,
        major,
        regions,
        isOrgLeader,
      });
      // Force session refresh so middleware sees updated onboarded flag
      // then do a full navigation to pick up the new JWT
      window.location.href = "/explore";
    });
  };

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  i <= step ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500",
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  "text-sm hidden sm:inline",
                  i <= step ? "text-gray-900 font-medium" : "text-gray-400",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={cn("w-12 h-0.5 mx-1", i < step ? "bg-indigo-500" : "bg-gray-200")}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Interests */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center">
              What are you interested in?
            </h1>
            <p className="text-sm text-gray-500 text-center mt-2 mb-8">
              Select at least one. This helps us personalize your event feed.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {INTEREST_TAGS.map(({ id, label, emoji }) => {
                const selected = interests.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleInterest(id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                      selected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300 bg-white",
                    )}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        selected ? "text-indigo-700" : "text-gray-600",
                      )}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Demographics */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center">Tell us about yourself</h1>
            <p className="text-sm text-gray-500 text-center mt-2 mb-8">
              This helps us show you the most relevant events.
            </p>
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-700">Class Year</Label>
                <div className="flex flex-wrap gap-2 mt-2">
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
                <Label htmlFor="major" className="text-sm font-medium text-gray-700">
                  Major / Concentration
                </Label>
                <Input
                  id="major"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Where do you hang out on campus?
                </Label>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">
                  Select all that apply — helps us surface nearby events.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CAMPUS_REGIONS.map(({ id, label, desc }) => {
                    const selected = regions.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleRegion(id)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-colors",
                          selected
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300",
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm font-medium block",
                            selected ? "text-indigo-700" : "text-gray-700",
                          )}
                        >
                          {label}
                        </span>
                        <span className="text-xs text-gray-400">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Org Leader */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center">One last thing</h1>
            <p className="text-sm text-gray-500 text-center mt-2 mb-8">
              Are you a leader of any student organization?
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => setIsOrgLeader(true)}
                  className={cn(
                    "flex-1 p-6 rounded-xl border-2 text-center transition-all",
                    isOrgLeader
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <span className="text-3xl block mb-2">🎯</span>
                  <span
                    className={cn(
                      "text-sm font-semibold block",
                      isOrgLeader ? "text-indigo-700" : "text-gray-700",
                    )}
                  >
                    Yes, I&apos;m an org leader
                  </span>
                  <span className="text-xs text-gray-400 mt-1 block">
                    You&apos;ll be able to create organizations and post events
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOrgLeader(false)}
                  className={cn(
                    "flex-1 p-6 rounded-xl border-2 text-center transition-all",
                    !isOrgLeader
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <span className="text-3xl block mb-2">🎓</span>
                  <span
                    className={cn(
                      "text-sm font-semibold block",
                      !isOrgLeader ? "text-indigo-700" : "text-gray-700",
                    )}
                  >
                    No, just exploring
                  </span>
                  <span className="text-xs text-gray-400 mt-1 block">
                    You can change this later in settings
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="text-gray-500"
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-8"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-8"
            >
              {isPending ? "Setting up..." : "Get Started"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

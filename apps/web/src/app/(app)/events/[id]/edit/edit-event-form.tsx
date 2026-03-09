"use client";

import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  Clock,
  ExternalLink,
  Globe,
  ImagePlus,
  Link2,
  Lock,
  MapPin,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { type EventDetail, updateEvent } from "~/actions/events";
import { getPresignedUploadUrl } from "~/actions/upload";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

const EVENT_TAGS = [
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

interface EditEventFormProps {
  event: EventDetail;
  locations: { id: string; name: string; category: string }[];
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function EditEventForm({ event, locations }: EditEventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill from existing event
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [date, setDate] = useState<Date | undefined>(event.datetime);
  const [time, setTime] = useState(
    `${pad(event.datetime.getHours())}:${pad(event.datetime.getMinutes())}`,
  );
  const [showEndDate, setShowEndDate] = useState(!!event.endDatetime);
  const [endDate, setEndDate] = useState<Date | undefined>(event.endDatetime ?? undefined);
  const [endTime, setEndTime] = useState(
    event.endDatetime
      ? `${pad(event.endDatetime.getHours())}:${pad(event.endDatetime.getMinutes())}`
      : "20:00",
  );
  const [locationId, setLocationId] = useState(event.locationId);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [tags, setTags] = useState<string[]>(event.tags);
  const [flyerUrl, setFlyerUrl] = useState<string | null>(event.flyerUrl);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(event.flyerUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [externalLink, setExternalLink] = useState(event.externalLink ?? "");
  const [isPublic, setIsPublic] = useState(event.isPublic);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(locationSearch.toLowerCase()),
  );
  const selectedLocationName = locations.find((l) => l.id === locationId)?.name ?? "";

  const toggleTag = (id: string) => {
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (isUploading) return;
      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.onload = (e) => setFlyerPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        const { uploadUrl, publicUrl } = await getPresignedUploadUrl({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          folder: "event-flyers",
        });

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        setFlyerUrl(publicUrl);
      } catch (err) {
        console.error("Upload failed:", err);
        setFlyerPreview(event.flyerUrl);
      } finally {
        setIsUploading(false);
      }
    },
    [isUploading, event.flyerUrl],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload],
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!date) newErrors.date = "Date is required";
    if (!locationId) newErrors.location = "Location is required";
    if (tags.length === 0) newErrors.tags = "Select at least one tag";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    startTransition(async () => {
      const datetime = new Date(date as Date);
      const [hours, minutes] = time.split(":").map(Number);
      datetime.setHours(hours ?? 0, minutes ?? 0);

      let endDatetime: string | undefined;
      if (showEndDate && endDate) {
        const end = new Date(endDate);
        const [eh, em] = endTime.split(":").map(Number);
        end.setHours(eh ?? 0, em ?? 0);
        endDatetime = end.toISOString();
      }

      await updateEvent(event.id, {
        title: title.trim(),
        description: description.trim(),
        datetime: datetime.toISOString(),
        endDatetime,
        locationId,
        tags,
        flyerUrl: flyerUrl ?? undefined,
        externalLink: externalLink.trim() || undefined,
        isPublic,
      });

      router.push(`/events/${event.id}`);
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2 block">
              Event Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              placeholder="What's happening?"
              maxLength={200}
              className={cn(
                "h-12 text-base border-gray-200 bg-gray-50/50 placeholder:text-gray-300 focus:bg-white transition-colors",
                errors.title && "border-red-300 focus-visible:ring-red-200",
              )}
            />
            <div className="flex justify-between mt-1.5">
              {errors.title ? <p className="text-xs text-red-400">{errors.title}</p> : <span />}
              <span className="text-xs text-gray-300">{title.length}/200</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
              }}
              placeholder="Tell people what to expect..."
              rows={4}
              className={cn(
                "text-base border-gray-200 bg-gray-50/50 placeholder:text-gray-300 focus:bg-white transition-colors resize-none",
                errors.description && "border-red-300 focus-visible:ring-red-200",
              )}
            />
            {errors.description && (
              <p className="text-xs text-red-400 mt-1.5">{errors.description}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="border-t border-gray-100 pt-8">
            <div className="flex items-start gap-3 mb-5">
              <Clock size={16} className="text-indigo-400 mt-0.5" strokeWidth={2} />
              <span className="text-sm font-semibold text-gray-700">When</span>
            </div>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-2 h-11 px-4 rounded-lg border text-sm transition-colors",
                      date
                        ? "border-gray-200 bg-white text-gray-700"
                        : "border-gray-200 bg-gray-50/50 text-gray-300",
                      errors.date && "border-red-300",
                    )}
                  >
                    <CalendarIcon size={14} className="text-gray-400" />
                    {date ? format(date, "EEE, MMM d, yyyy") : "Pick a date"}
                    <ChevronDown size={12} className="text-gray-300 ml-1" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
                    }}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-2 h-11 px-4 rounded-lg border border-gray-200 bg-white">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="text-sm text-gray-700 bg-transparent outline-none"
                />
              </div>
            </div>
            {errors.date && <p className="text-xs text-red-400 mt-1.5">{errors.date}</p>}
            <div className="mt-4">
              {!showEndDate ? (
                <button
                  type="button"
                  onClick={() => setShowEndDate(true)}
                  className="text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
                >
                  + Add end time
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-medium w-6">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex items-center gap-2 h-11 px-4 rounded-lg border text-sm transition-colors",
                          endDate
                            ? "border-gray-200 bg-white text-gray-700"
                            : "border-gray-200 bg-gray-50/50 text-gray-300",
                        )}
                      >
                        <CalendarIcon size={14} className="text-gray-400" />
                        {endDate ? format(endDate, "EEE, MMM d, yyyy") : "End date"}
                        <ChevronDown size={12} className="text-gray-300 ml-1" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={{ before: date ?? new Date() }}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center gap-2 h-11 px-4 rounded-lg border border-gray-200 bg-white">
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="text-sm text-gray-700 bg-transparent outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEndDate(false);
                      setEndDate(undefined);
                    }}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="border-t border-gray-100 pt-8">
            <div className="flex items-start gap-3 mb-5">
              <MapPin size={16} className="text-indigo-400 mt-0.5" strokeWidth={2} />
              <span className="text-sm font-semibold text-gray-700">Where</span>
            </div>
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-between w-full h-11 px-4 rounded-lg border text-sm transition-colors text-left",
                    locationId
                      ? "border-gray-200 bg-white text-gray-700"
                      : "border-gray-200 bg-gray-50/50 text-gray-300",
                    errors.location && "border-red-300",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    {selectedLocationName || "Select a campus location"}
                  </span>
                  <ChevronDown size={14} className="text-gray-300" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="p-2 border-b border-gray-100">
                  <Input
                    placeholder="Search locations..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="h-9 border-0 shadow-none focus-visible:ring-0 bg-gray-50 text-sm"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto p-1">
                  {filteredLocations.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        setLocationId(loc.id);
                        setLocationOpen(false);
                        setLocationSearch("");
                        if (errors.location) setErrors((prev) => ({ ...prev, location: "" }));
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        locationId === loc.id
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      <span className="font-medium">{loc.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{loc.category}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {errors.location && <p className="text-xs text-red-400 mt-1.5">{errors.location}</p>}
          </div>

          {/* Tags */}
          <div className="border-t border-gray-100 pt-8">
            <div className="flex items-start gap-3 mb-5">
              <Sparkles size={16} className="text-indigo-400 mt-0.5" strokeWidth={2} />
              <div>
                <span className="text-sm font-semibold text-gray-700">Categories</span>
                <p className="text-xs text-gray-400 mt-0.5">Select all that apply</p>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {EVENT_TAGS.map(({ id, label, emoji }) => {
                const selected = tags.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      toggleTag(id);
                      if (errors.tags) setErrors((prev) => ({ ...prev, tags: "" }));
                    }}
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
            {errors.tags && <p className="text-xs text-red-400 mt-2">{errors.tags}</p>}
          </div>

          {/* Flyer Upload */}
          <div className="border-t border-gray-100 pt-8">
            <div className="flex items-start gap-3 mb-5">
              <ImagePlus size={16} className="text-indigo-400 mt-0.5" strokeWidth={2} />
              <div>
                <span className="text-sm font-semibold text-gray-700">Flyer</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Optional - JPEG, PNG, or WebP up to 5MB
                </p>
              </div>
            </div>
            {flyerPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-100 inline-block">
                <img
                  src={flyerPreview}
                  alt="Flyer preview"
                  className="max-h-56 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFlyerPreview(null);
                    setFlyerUrl(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X size={12} />
                </button>
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Upload size={14} className="animate-bounce" />
                      Uploading...
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="w-full h-36 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 bg-gray-50/30 hover:bg-indigo-50/30 transition-colors flex flex-col items-center justify-center gap-2 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                  <ImagePlus
                    size={18}
                    className="text-gray-400 group-hover:text-indigo-500 transition-colors"
                  />
                </div>
                <p className="text-sm text-gray-500 group-hover:text-indigo-600 font-medium transition-colors">
                  Drop an image or click to upload
                </p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
          </div>

          {/* External Link */}
          <div className="border-t border-gray-100 pt-8">
            <div className="flex items-start gap-3 mb-5">
              <Link2 size={16} className="text-indigo-400 mt-0.5" strokeWidth={2} />
              <div>
                <span className="text-sm font-semibold text-gray-700">External Link</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Optional - registration page or more info
                </p>
              </div>
            </div>
            <div className="relative">
              <ExternalLink
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://"
                className="h-11 pl-10 border-gray-200 bg-gray-50/50 placeholder:text-gray-300 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="border-t border-gray-100 pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe size={16} className="text-indigo-400" strokeWidth={2} />
                ) : (
                  <Lock size={16} className="text-amber-500" strokeWidth={2} />
                )}
                <div>
                  <span className="text-sm font-semibold text-gray-700">
                    {isPublic ? "Public Event" : "Private Event"}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isPublic
                      ? "Anyone on campus can discover this event"
                      : "Only people with the link can see this event"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  isPublic ? "bg-indigo-500" : "bg-gray-300",
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                    isPublic ? "translate-x-5.5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-8 h-11 font-semibold shadow-sm shadow-indigo-200 transition-all"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { ImagePlus, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { createOrg } from "~/actions/orgs";
import { getPresignedUploadUrl } from "~/actions/upload";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

const ORG_CATEGORIES = [
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

export default function CreateOrgPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogoUpload = useCallback(
    async (file: File) => {
      if (isUploading) return;
      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.onload = (e) => setLogoPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        const { uploadUrl, publicUrl } = await getPresignedUploadUrl({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          folder: "org-logos",
        });

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        setLogoUrl(publicUrl);
      } catch (err) {
        console.error("Upload failed:", err);
        setLogoPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [isUploading],
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!category) newErrors.category = "Select a category";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    startTransition(async () => {
      try {
        const result = await createOrg({
          name: name.trim(),
          description: description.trim(),
          category,
          logoUrl: logoUrl ?? undefined,
        });
        router.push(`/orgs/${result.id}`);
      } catch (err) {
        if (err instanceof Error && err.message.includes("org leaders")) {
          setErrors({
            name: "Only org leaders can create organizations. Update this in Settings.",
          });
        }
      }
    });
  };

  return (
    <div className="px-8 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Organization</h1>
        <p className="text-sm text-gray-400 mt-1">Set up your student group on The Forum.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-6">
          {logoPreview ? (
            <div className="relative">
              <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-2xl object-cover" />
              <button
                type="button"
                onClick={() => {
                  setLogoPreview(null);
                  setLogoUrl(null);
                }}
                className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X size={10} />
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                  <Upload size={14} className="animate-bounce text-gray-500" />
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-300 bg-gray-50/50 flex items-center justify-center group cursor-pointer transition-colors"
            >
              <ImagePlus
                size={20}
                className="text-gray-400 group-hover:text-indigo-500 transition-colors"
              />
            </button>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-700">Organization Logo</p>
            <p className="text-xs text-gray-400 mt-0.5">Optional. JPEG, PNG, or WebP.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleLogoUpload(file);
            }}
          />
        </div>

        {/* Name */}
        <div>
          <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">
            Organization Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="e.g. Princeton Entrepreneurship Club"
            className={cn(
              "h-12 text-base border-gray-200 bg-gray-50/50 placeholder:text-gray-300",
              errors.name && "border-red-300",
            )}
          />
          {errors.name && <p className="text-xs text-red-400 mt-1.5">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="desc" className="text-sm font-semibold text-gray-700 mb-2 block">
            Description
          </Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
            }}
            placeholder="What does your organization do?"
            rows={4}
            className={cn(
              "text-base border-gray-200 bg-gray-50/50 placeholder:text-gray-300 resize-none",
              errors.description && "border-red-300",
            )}
          />
          {errors.description && (
            <p className="text-xs text-red-400 mt-1.5">{errors.description}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-3 block">Category</Label>
          <div className="flex flex-wrap gap-2">
            {ORG_CATEGORIES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setCategory(id);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  category === id
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.category && <p className="text-xs text-red-400 mt-2">{errors.category}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pb-8">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-500">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-8 h-11 font-semibold"
        >
          {isPending ? "Creating..." : "Create Organization"}
        </Button>
      </div>
    </div>
  );
}

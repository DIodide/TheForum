export interface EventQualityInput {
  title: string;
  description: string;
  tags: string[];
  flyerUrl?: string | null;
  externalLink?: string | null;
  endDatetime?: string | Date | null;
  orgId?: string | null;
  isPublic?: boolean;
}

export interface EventQualityChecklistItem {
  id: string;
  label: string;
  met: boolean;
}

export interface EventQualityReport {
  score: number;
  label: "Needs Work" | "Good" | "Strong";
  checklist: EventQualityChecklistItem[];
  suggestions: string[];
}

const QUALITY_WEIGHTS = {
  title: 15,
  description: 25,
  tags: 20,
  flyer: 15,
  externalLink: 10,
  endTime: 5,
  orgAssociation: 5,
  publicVisibility: 5,
} as const;

export function getEventQualityReport(input: EventQualityInput): EventQualityReport {
  const checklist: EventQualityChecklistItem[] = [
    {
      id: "title",
      label: "Clear, specific title",
      met: input.title.trim().length >= 12,
    },
    {
      id: "description",
      label: "Detailed description",
      met: input.description.trim().length >= 140,
    },
    {
      id: "tags",
      label: "At least 2 strong tags",
      met: input.tags.length >= 2,
    },
    {
      id: "flyer",
      label: "Flyer or visual",
      met: !!input.flyerUrl,
    },
    {
      id: "external-link",
      label: "Registration or more info link",
      met: !!input.externalLink,
    },
    {
      id: "end-time",
      label: "End time included",
      met: !!input.endDatetime,
    },
    {
      id: "org",
      label: "Posted from an organization",
      met: !!input.orgId,
    },
    {
      id: "visibility",
      label: "Publicly discoverable",
      met: input.isPublic ?? true,
    },
  ];

  let score = 0;

  if (input.title.trim().length >= 12) {
    score += QUALITY_WEIGHTS.title;
  } else if (input.title.trim().length >= 6) {
    score += Math.round(QUALITY_WEIGHTS.title * 0.5);
  }

  if (input.description.trim().length >= 140) {
    score += QUALITY_WEIGHTS.description;
  } else if (input.description.trim().length >= 80) {
    score += Math.round(QUALITY_WEIGHTS.description * 0.6);
  } else if (input.description.trim().length >= 30) {
    score += Math.round(QUALITY_WEIGHTS.description * 0.3);
  }

  if (input.tags.length >= 3) {
    score += QUALITY_WEIGHTS.tags;
  } else if (input.tags.length >= 1) {
    score += Math.round(QUALITY_WEIGHTS.tags * 0.6);
  }

  if (input.flyerUrl) score += QUALITY_WEIGHTS.flyer;
  if (input.externalLink) score += QUALITY_WEIGHTS.externalLink;
  if (input.endDatetime) score += QUALITY_WEIGHTS.endTime;
  if (input.orgId) score += QUALITY_WEIGHTS.orgAssociation;
  if (input.isPublic ?? true) score += QUALITY_WEIGHTS.publicVisibility;

  const suggestions: string[] = [];

  if (!checklist[1]?.met) {
    suggestions.push("Add more detail so students know exactly what to expect.");
  }
  if (!checklist[2]?.met) {
    suggestions.push("Use at least two tags to improve recommendation quality.");
  }
  if (!checklist[3]?.met) {
    suggestions.push("Upload a flyer to make the event stand out in the feed.");
  }
  if (!checklist[4]?.met) {
    suggestions.push("Add a registration or information link to reduce drop-off.");
  }
  if (!checklist[5]?.met) {
    suggestions.push("Include an end time so students can plan around the event.");
  }
  if (!checklist[6]?.met) {
    suggestions.push("Post through an organization when possible to build trust.");
  }

  const label = score >= 80 ? "Strong" : score >= 60 ? "Good" : "Needs Work";

  return {
    score,
    label,
    checklist,
    suggestions,
  };
}

export interface OrganizerInsightInput {
  quality: EventQualityReport;
  impressionCount: number;
  detailOpenCount: number;
  saveCount: number;
  rsvpCount: number;
  exportCount: number;
  dismissCount: number;
}

export function getOrganizerInsightSuggestions(input: OrganizerInsightInput): string[] {
  const suggestions = [...input.quality.suggestions];
  const ctr = input.impressionCount > 0 ? input.detailOpenCount / input.impressionCount : 0;
  const saveRate = input.impressionCount > 0 ? input.saveCount / input.impressionCount : 0;
  const rsvpRate = input.impressionCount > 0 ? input.rsvpCount / input.impressionCount : 0;

  if (input.impressionCount > 20 && ctr < 0.15) {
    suggestions.push("The title or flyer may not be pulling people in. Tighten the hook.");
  }

  if (input.detailOpenCount > 10 && saveRate < 0.08) {
    suggestions.push("People are opening the event but not saving it. Clarify who this is for.");
  }

  if (input.saveCount > 0 && rsvpRate < 0.05) {
    suggestions.push("Students seem interested but not committed. Add a stronger CTA or link.");
  }

  if (input.dismissCount > input.saveCount + input.rsvpCount && input.dismissCount > 2) {
    suggestions.push(
      "Dismissals are high. Revisit tags and positioning so the audience fit is sharper.",
    );
  }

  if (input.exportCount > 0 && input.rsvpCount === 0) {
    suggestions.push(
      "Students may be interested but undecided. Consider a reminder push closer to the date.",
    );
  }

  return [...new Set(suggestions)].slice(0, 4);
}

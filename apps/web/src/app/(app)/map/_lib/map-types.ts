export type TimeGroup = "now" | "soon" | "later-today" | "tomorrow" | "this-week";

export interface RelativeLabel {
  label: string;
  urgency: TimeGroup;
}

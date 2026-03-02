export const CATEGORIES = [
  { id: "eximia", label: "eximIA Systems" },
  { id: "dev", label: "Development" },
  { id: "design", label: "Design" },
  { id: "business", label: "Business" },
  { id: "infra", label: "Infrastructure" },
  { id: "general", label: "General" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const ACCENT_COLORS = [
  "#C4A882",
  "#7C9E8F",
  "#8B9CC4",
  "#C48BB4",
  "#D4956A",
  "#E8837C",
  "#82B4C4",
  "#A8C482",
] as const;

export const CREDENTIAL_REVEAL_DURATION = 30_000; // 30 seconds

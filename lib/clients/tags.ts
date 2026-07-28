export const CLIENT_TAG_SUGGESTIONS = [
  "VIP",
  "Mauvais payeur",
  "Résident",
  "Abonné Studio",
] as const;

export const MAX_CLIENT_TAGS = 10;

const TAG_STYLE_PRESETS: Record<string, string> = {
  vip: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "mauvais payeur": "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  resident: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  résident: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "abonné studio": "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  "abonne studio": "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
};

const TAG_STYLE_PALETTE = [
  "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
  "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
];

export function normalizeClientTag(tag: string) {
  return tag.trim().replace(/\s+/g, " ");
}

export function tagsMatch(left: string, right: string) {
  return normalizeClientTag(left).toLowerCase() === normalizeClientTag(right).toLowerCase();
}

export function getClientTagClassName(tag: string) {
  const preset = TAG_STYLE_PRESETS[normalizeClientTag(tag).toLowerCase()];

  if (preset) {
    return preset;
  }

  const hash = normalizeClientTag(tag)
    .toLowerCase()
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return TAG_STYLE_PALETTE[hash % TAG_STYLE_PALETTE.length] ?? TAG_STYLE_PALETTE[0];
}

export function mergeUniqueTags(existing: string[], nextTag: string) {
  const normalized = normalizeClientTag(nextTag);

  if (!normalized) {
    return existing;
  }

  if (existing.some((tag) => tagsMatch(tag, normalized))) {
    return existing;
  }

  return [...existing, normalized];
}

export function removeTagFromList(existing: string[], tagToRemove: string) {
  return existing.filter((tag) => !tagsMatch(tag, tagToRemove));
}

export function collectDistinctTags(clients: Array<{ tags: string[] }>) {
  const tagSet = new Set<string>();

  for (const client of clients) {
    for (const tag of client.tags) {
      tagSet.add(tag);
    }
  }

  return [...tagSet].sort((a, b) => a.localeCompare(b, "fr"));
}

export function clientMatchesTagFilter(clientTags: string[], selectedTags: string[]) {
  if (selectedTags.length === 0) {
    return true;
  }

  return selectedTags.every((selectedTag) =>
    clientTags.some((clientTag) => tagsMatch(clientTag, selectedTag))
  );
}

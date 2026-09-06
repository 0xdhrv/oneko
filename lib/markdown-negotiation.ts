/** Prefer HTML on ties and wildcard requests; honor explicit q=0 exclusions. */
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const qualities = new Map<string, number>();
  for (const entry of accept.toLowerCase().split(",")) {
    const [type, ...params] = entry.trim().split(";");
    const quality = params.find((param) => param.trim().startsWith("q="));
    const value = quality ? Number(quality.trim().slice(2)) : 1;
    const q = Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0;
    const mediaType = type.trim();
    qualities.set(mediaType, Math.max(qualities.get(mediaType) ?? 0, q));
  }
  const markdown = qualities.get("text/markdown") ?? 0;
  const html = qualities.get("text/html") ?? qualities.get("text/*") ?? qualities.get("*/*") ?? 0;
  return markdown > 0 && markdown > html;
}

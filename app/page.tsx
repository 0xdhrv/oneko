import dynamic from "next/dynamic";
import { InspirationAttribution } from "@/components/inspiration-attribution";
import { GitHubLink } from "@/components/github-link";

const OnekoPlayground = dynamic(() => import("./oneko-playground"), {
  loading: () => (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-[50vh] items-center justify-center px-4"
    >
      <p className="sr-only">Loading playground</p>
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
    </div>
  ),
});

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <h1 className="sr-only">Oneko playground</h1>
      <OnekoPlayground />
      <footer className="pointer-events-none fixed bottom-4 left-4 z-2147483647 max-w-[min(100vw-2rem,20rem)] text-pretty text-xs leading-snug text-muted-foreground">
        <InspirationAttribution />
      </footer>
      <GitHubLink />
    </div>
  );
}

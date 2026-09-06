import dynamic from "next/dynamic";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { InspirationAttribution } from "@/components/inspiration-attribution";
import { GitHubLink } from "@/components/github-link";

export const metadata: Metadata = {
  title: "Oneko playground",
  description: "Interactive pixel cat: tweak speed, sounds, bubbles, and motion in the browser.",
};

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
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Oneko React pixel cat",
            description:
              "An open-source shadcn registry component that adds a customizable pixel cat to React websites, with 12 skins, bubbles, optional sounds, and cat-friendly zones.",
            url: "https://oneko.dhrv.pw",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            sameAs: "https://github.com/0xdhrv/oneko",
          }),
        }}
      />
      <div className="flex-1">
        <OnekoPlayground />
        <section className="oneko-guide-summary" aria-labelledby="cat-guide-title">
          <h2 id="cat-guide-title">Give your cat a home.</h2>
          <p>
            Oneko is a shadcn component that brings a tiny pixel cat to your React website. Choose
            from twelve coats, adjust its pace, and give it a little cat thought. Your companion can
            chase the cursor, enjoy a nap, or stay cozy in one spot.
          </p>
          <p>
            The cat guide covers installation, every option, Next.js examples, keep-out areas,
            favorite spots, and optional purrs. It also includes a prompt for your coding agent and
            the full guide in Markdown, so your cat can settle into an existing project.
          </p>
          <p>
            Try the comforts above, then copy your cat’s settings to bring it along. The installer
            adds the source to your project, ready to make your own.
          </p>
          <Link href="/docs">
            Read the cat docs <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </section>
      </div>
      <footer className="oneko-footer">
        <Link href="/docs">Cat docs</Link>
        <InspirationAttribution />
        <a
          href="https://github.com/oneko-swift/oneko-swift#credits"
          target="_blank"
          rel="noreferrer"
        >
          Skin credits <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <GitHubLink />
      </footer>
    </div>
  );
}

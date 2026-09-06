import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 py-12 text-sm leading-7">
      <p className="text-muted-foreground">404 / A wandering cat</p>
      <h1 className="font-mono text-2xl">No cat on this page.</h1>
      <p>
        This spot is empty. Find your way back to the playground, or open the cat guide for
        installation, every option, and examples.
      </p>
      <nav aria-label="Find your cat" className="flex flex-wrap gap-x-6 gap-y-2">
        <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/">
          Cat playground
        </Link>
        <Link
          className="inline-flex min-h-11 items-center underline underline-offset-4"
          href="/docs"
        >
          Cat documentation
        </Link>
        <a
          className="inline-flex min-h-11 items-center underline underline-offset-4"
          href="/llms.txt"
        >
          Cat guide for agents
        </a>
        <a
          className="inline-flex min-h-11 items-center underline underline-offset-4"
          href="/sitemap.xml"
        >
          Site map
        </a>
      </nav>
    </main>
  );
}

import type { Metadata } from "next";
import { ArrowDown, ArrowUp, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { CopyButton } from "@/components/docs/copy-button";
import { DocsSidebar } from "@/components/docs/sidebar";
import { DOC_SECTIONS, PROP_DOCS, PROP_GROUPS } from "@/lib/oneko-docs";
import { highlightCode, type CodeLanguage } from "@/lib/shiki";
import "./docs.css";

const description =
  "Install the Oneko shadcn pixel cat. Complete React prop reference, Next.js examples, skins, bubbles, zones, sounds, and a ready-to-copy coding agent prompt.";
export const metadata: Metadata = {
  title: "Documentation",
  description,
  alternates: { canonical: "/docs", types: { "text/markdown": "/docs.md" } },
  openGraph: {
    title: "Oneko documentation",
    description,
    url: "/docs",
    type: "website",
    images: ["/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Oneko documentation",
    description,
    images: ["/icon-512.png"],
  },
};

export default async function DocsPage() {
  const sidebarSections = [
    { id: "overview", title: "Overview" },
    ...DOC_SECTIONS.map(({ id, title }) => ({ id, title })),
  ];
  const highlightedSections = await Promise.all(
    DOC_SECTIONS.map(async (section) => ({
      ...section,
      blocks: await Promise.all(
        section.blocks.map(async (block) =>
          block.kind === "code"
            ? {
                ...block,
                highlightedCode: await highlightCode(block.code, block.language as CodeLanguage),
              }
            : block,
        ),
      ),
    })),
  );

  return (
    <div className="docs-shell">
      <a className="docs-skip" href="#docs-content">
        Skip to the cat guide
      </a>
      <div className="docs-layout">
        <DocsSidebar sections={sidebarSections} />
        <main id="docs-content" className="docs-content" tabIndex={-1}>
          <div className="docs-intro" id="overview">
            <p className="docs-eyebrow">ONEKO / DOCUMENTATION</p>
            <h1>
              A little guide
              <br />
              for little paws<span aria-hidden="true">.</span>
            </h1>
            <p>
              A pixel cat, at home in your React app. Install it, pick a coat, and make its little
              habits your own.
            </p>
            <div className="docs-intro-links">
              <a href="#installation">
                Bring your cat home <ArrowDown size={14} aria-hidden="true" />
              </a>
              <a href="#agents">
                Let an agent help <ArrowDown size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
          {highlightedSections.map((section, index) => (
            <section
              className="docs-section"
              id={section.id}
              key={section.id}
              aria-labelledby={`${section.id}-title`}
            >
              <div className="docs-section-heading">
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h2 id={`${section.id}-title`}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </h2>
              </div>
              {section.blocks.map((block, blockIndex) => {
                if (block.kind === "text") return <p key={blockIndex}>{block.text}</p>;
                if (block.kind === "list")
                  return (
                    <ul key={blockIndex}>
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                return (
                  <figure
                    className={`docs-code ${block.language === "text" ? "docs-prompt" : ""}`}
                    key={blockIndex}
                  >
                    <figcaption>
                      <span>{block.label}</span>
                      <CopyButton text={block.code} label={`Copy ${block.label}`} />
                    </figcaption>
                    <div
                      className="docs-highlighted-code"
                      role="region"
                      aria-label={block.label}
                      dangerouslySetInnerHTML={{ __html: block.highlightedCode }}
                    />
                  </figure>
                );
              })}
              {section.id === "options" &&
                PROP_GROUPS.map((group) => (
                  <div className="docs-prop-group" key={group}>
                    <h3>{group}</h3>
                    <dl>
                      {Object.entries(PROP_DOCS)
                        .filter(([, prop]) => prop.group === group)
                        .map(([name, prop]) => (
                          <div className="docs-prop" key={name} id={`prop-${name}`}>
                            <dt>
                              <a href={`#prop-${name}`}>
                                <code>{name}</code>
                              </a>
                            </dt>
                            <dd>
                              <div className="docs-prop-meta">
                                <code>{prop.type}</code>
                                <span>
                                  Default <code>{prop.default}</code>
                                </span>
                              </div>
                              <p>{prop.description}</p>
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                ))}
              {section.id === "agents" && (
                <div className="docs-resource-links">
                  <a href="/llms.txt">
                    Agent index <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                  <a href="/docs.md">
                    Full Markdown guide <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                  <a href="/r/oneko.json">
                    Cat registry <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                </div>
              )}
              {section.id === "skins" && (
                <a
                  className="docs-inline-link"
                  href="https://github.com/0xdhrv/oneko/blob/main/docs/skins.md"
                >
                  Meet the cat artists <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              )}
              {section.id === "sounds" && (
                <a
                  className="docs-inline-link"
                  href="https://github.com/0xdhrv/oneko/tree/main/public/cat-sounds"
                >
                  Find the cat sound files <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              )}
            </section>
          ))}
          <footer className="docs-footer">
            <p>A small cat. A little company.</p>
            <Link href="/">
              Back to your cat <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <a href="#docs-content">
              Back to the top <ArrowUp size={14} aria-hidden="true" />
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}

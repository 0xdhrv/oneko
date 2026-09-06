"use client";

import { ArrowUpRight, CaretDown } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type SidebarSection = { id: string; title: string };
const ACTIVE_MARKER_HEIGHT = 16;

function SectionLinks({
  sections,
  activeSection,
}: {
  sections: SidebarSection[];
  activeSection: string;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const [markerStyle, setMarkerStyle] = useState<{
    opacity: number;
    transform: string;
    transition?: string;
  }>({ opacity: 0, transform: "translate(0, 0) scaleY(1)", transition: "none" });

  useLayoutEffect(() => {
    const list = listRef.current;
    const activeLink = list?.querySelector<HTMLAnchorElement>('[aria-current="location"]');
    if (!list || !activeLink) return;

    const placeMarker = () => {
      // Hidden desktop/mobile navigation has no geometry until it is revealed.
      if (!activeLink.offsetHeight) return;

      const x = activeLink.offsetLeft;
      const y = activeLink.offsetTop + (activeLink.offsetHeight - ACTIVE_MARKER_HEIGHT) / 2;
      const transform = `translate(${x}px, ${y}px) scaleY(1)`;

      // Let CSS retarget from the current visual position, including mid-transition.
      // Repeated resize notifications must not restart or cancel the motion.
      setMarkerStyle((current) =>
        current.opacity === 1 && current.transform === transform
          ? current
          : { opacity: 1, transform, transition: current.opacity === 0 ? "none" : undefined },
      );
    };
    const resizeObserver = new ResizeObserver(placeMarker);

    placeMarker();
    resizeObserver.observe(list);
    resizeObserver.observe(activeLink);
    return () => resizeObserver.disconnect();
  }, [activeSection, sections]);

  return (
    <ol className="docs-section-links" ref={listRef}>
      <li className="docs-active-marker" style={markerStyle} aria-hidden="true" />
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            aria-current={activeSection === section.id ? "location" : undefined}
          >
            {section.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

function ResourceLinks() {
  return (
    <div className="docs-resource-nav">
      <p>Resources</p>
      <a href="/docs.md">Markdown guide</a>
      <a href="/llms.txt">Agent index</a>
      <a href="/r/oneko.json">Cat registry</a>
      <a href="https://github.com/0xdhrv/oneko">
        GitHub <ArrowUpRight size={13} aria-hidden="true" />
      </a>
    </div>
  );
}

export function DocsSidebar({ sections }: { sections: SidebarSection[] }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "overview");

  useEffect(() => {
    let frame = 0;
    const updateActiveSection = () => {
      frame = 0;
      let nextSection = sections[0]?.id ?? "overview";

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (!element || element.getBoundingClientRect().top > 132) break;
        nextSection = section.id;
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        nextSection = sections.at(-1)?.id ?? nextSection;
      }

      setActiveSection((current) => (current === nextSection ? current : nextSection));
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [sections]);

  return (
    <>
      <aside className="docs-sidebar">
        <Link href="/" className="docs-brand" aria-label="Oneko playground">
          oneko<span aria-hidden="true">.</span>
        </Link>
        <nav aria-label="Cat guide navigation">
          <Link href="/">Playground</Link>
          <p>Guide</p>
          <a className="docs-current-page" href="#overview">
            Documentation
          </a>
          <SectionLinks sections={sections} activeSection={activeSection} />
          <ResourceLinks />
        </nav>
        <div className="docs-sidebar-footer">
          <span>little cat guide</span>
          <ThemeToggle />
        </div>
      </aside>

      <header className="docs-mobile-header">
        <div>
          <Link href="/" className="docs-brand" aria-label="Oneko playground">
            oneko<span aria-hidden="true">.</span>
          </Link>
          <ThemeToggle />
        </div>
        <details>
          <summary>
            Browse the cat guide
            <CaretDown className="docs-mobile-nav-icon" size={14} aria-hidden="true" />
          </summary>
          <nav aria-label="Cat guide navigation">
            <SectionLinks sections={sections} activeSection={activeSection} />
            <ResourceLinks />
          </nav>
        </details>
      </header>
    </>
  );
}

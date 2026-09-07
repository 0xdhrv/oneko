# Oneko SEO audit

Audited September 7, 2026. Scope: the current working tree and a local production build of `/`, `/docs`, `/studio`, crawler endpoints, and Markdown content negotiation. Existing uncommitted feature work was preserved.

The site has a sound technical foundation: all three HTML pages are prerendered, internally linked, and have one H1, a unique description, and a self-referencing canonical. Robots permits crawling and advertises the sitemap. Missing pages return HTTP 404 with noindex. The home page already includes SoftwareApplication structured data. The main opportunities were clearer search intent and more consistent metadata.

Live production availability is **unverified**. Direct requests from this environment failed DNS resolution for `oneko.dhrv.pw`; web retrieval did not provide usable live endpoint evidence. This does not establish a global outage, but checking public DNS and production responses is the first follow-up. Search Console, traffic, backlinks, Google-selected canonicals, and field Core Web Vitals were not available. No ranking or performance score is claimed.

## Findings and fixes

| Priority / impact | Finding and evidence | Action |
| --- | --- | --- |
| High if confirmed | Production DNS could not resolve from the audit environment. A genuine DNS failure would block crawling and users. | Verify the hostname and deployment from another network before requesting indexing. No DNS changes made. |
| Medium | Titles were generic: “Oneko playground”, “Documentation”, and “Studio”. The home title also inherited a redundant brand suffix. | Added distinct titles targeting the React/shadcn component, React/Next.js installation, and pixel cat customization. Updated corresponding social titles and the homepage description. |
| Medium | The homepage advertised twelve coats while the current catalog has seventeen; the summary still referred to controls “above” after customization moved to Studio. | Removed the brittle count, corrected the workflow copy, and made the summary heading, introduction, and docs link more descriptive. Preserved the visual H1 design. |
| Medium | Root metadata declared docs and an agent index as alternate representations of every inheriting page. `/llms-full.txt` duplicates the docs without a canonical header; the Markdown canonical was relative. | Scoped canonicals to pages, retained the genuine Markdown alternate on `/docs`, and added absolute docs canonicals to both complete text representations. Content negotiation continues to work. |
| Low | Homepage sitemap `lastModified` used `new Date()`, reporting build time rather than a significant content edit. | Removed the unsupported date. Restore only with a reliable content modification source. Google ignores priority and changeFrequency; existing values were left intact. |
| Medium, preventive | Vercel previews used their own canonical origin but the application had no explicit preview noindex metadata. | Added noindex/follow for Vercel preview HTML pages. Verify on an actual preview deployment; this audit did not build a preview. Hosting protection is still relevant to non-HTML assets. |
| Low / sharing | Homepage Twitter metadata requested a large image card for a square 512px icon. | Switched to a summary card suited to the existing image. A designed landscape share image remains optional. |
| Low | Existing SoftwareApplication JSON-LD hard-coded its site URL separately from metadata. | Reused the site URL helper, removed the hard-coded skin count, and escaped less-than characters when serializing JSON-LD. No ratings or unsupported claims added. |

## Validation

- `pnpm run lint`: no warnings or errors.
- `pnpm test`: 101 tests passed across 16 files.
- `pnpm exec next build`: passed, including TypeScript and static generation. Invoked directly to avoid rewriting the existing registry artifacts through the prebuild hook.
- `git diff --check`: passed.
- HTTP checks against `next start`: all three pages return 200, unique titles/descriptions, one H1 each, and correct production canonicals.
- Parsed the existing JSON-LD from the actual homepage HTML and confirmed valid JSON and its canonical URL. This is not a Google Rich Results eligibility test.
- Robots, sitemap, Markdown guide, and full plain-text guide return 200 with expected content types. Both complete text guides point canonically to `/docs`.
- `/docs` with `Accept: text/markdown` still serves Markdown. Unknown routes return 404 and noindex.

## Next actions

1. Verify public DNS and production HTTP responses, then deploy these changes through the normal release process.
2. In Google Search Console, submit `https://oneko.dhrv.pw/sitemap.xml` and inspect `/`, `/docs`, and `/studio`. Check Google-selected canonicals and indexing reasons. Deployment and Search Console actions were not performed.
3. Measure the deployed pages with PageSpeed Insights on mobile and desktop. Review real LCP, INP, and CLS when field data exists; then profile fonts, animation work, and JavaScript only where measurements identify a problem.
4. Use Search Console queries to validate the initial keyword mapping: homepage for “Oneko React / shadcn pixel cat”, docs for installation and Next.js integration, Studio for customization and sprite sheets. These are intent-based starting points, not measured search-volume findings.
5. Keep examples aligned with the shipped component. Add focused tutorials only when actual questions justify them; the existing docs already provide substantial server-rendered integration content.

## References

- [Google: descriptive title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: sitemaps and accurate lastmod values](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: consolidate duplicate URLs, including canonical HTTP headers](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

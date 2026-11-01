import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site-url";
import OnekoStudio from "./studio";

const description =
  "Make Oneko your own. Draw sprites frame by frame, record custom sounds, write thoughts, tune behavior, and share your cat with a link.";

export const metadata: Metadata = {
  title: "Pixel Cat Studio — Custom Skins & Animations",
  description,
  alternates: { canonical: "/studio" },
  openGraph: {
    title: "Oneko Pixel Cat Studio — Custom Skins & Animations",
    description,
    url: "/studio",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oneko Pixel Cat Studio — Custom Skins & Animations",
    description,
    images: [OG_IMAGE.url],
  },
};

export default function StudioPage() {
  return <OnekoStudio />;
}

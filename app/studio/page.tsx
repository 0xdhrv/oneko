import type { Metadata } from "next";
import OnekoStudio from "./studio";

const description =
  "Make Oneko your own. Upload sprite sheets, write custom thoughts, adjust animations, and copy your cat into a React project.";

export const metadata: Metadata = {
  title: "Pixel Cat Studio — Custom Skins & Animations",
  description,
  alternates: { canonical: "/studio" },
  openGraph: {
    title: "Oneko Pixel Cat Studio — Custom Skins & Animations",
    description,
    url: "/studio",
    type: "website",
    images: ["/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Oneko Pixel Cat Studio — Custom Skins & Animations",
    description,
    images: ["/icon-512.png"],
  },
};

export default function StudioPage() {
  return <OnekoStudio />;
}

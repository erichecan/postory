import { IndustryDemoPage } from "@/components/visual/public-pages";

export const metadata = {
  title: "Nail Studio Social Media Demo | PoStory",
  description:
    "Explore a sample social media plan for nail studios, with nail sets, client stories, aftercare tips and appointment-focused content.",
};

export default function Page() {
  return (
    <IndustryDemoPage
      industry="beauty"
      tag="NAIL STUDIO"
      title="Nail Studio"
      body="A sample monthly plan for a nail studio — featuring finished sets, seasonal inspiration, aftercare tips and content that makes it easy for clients to book."
    />
  );
}

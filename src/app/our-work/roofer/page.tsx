import { IndustryDemoPage } from "@/components/visual/public-pages";

export const metadata = {
  title: "Roofer Social Media Demo | PoStory",
  description:
    "Explore a sample social media plan for roofers, with project transformations, seasonal advice and customer-friendly service content.",
};

export default function Page() {
  return (
    <IndustryDemoPage
      industry="contractor"
      tag="ROOFING SERVICES"
      title="Roofing Company"
      body="A sample monthly plan for a roofing company — highlighting before-and-after projects, seasonal roof care and straightforward advice that helps homeowners know when to call."
    />
  );
}

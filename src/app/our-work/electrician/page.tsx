import { IndustryDemoPage } from "@/components/visual/public-pages";

export const metadata = {
  title: "Electrician Social Media Demo | PoStory",
  description:
    "See a sample social media plan for an electrical business, built around completed work, safety education and clear service explainers.",
};

export default function Page() {
  return (
    <IndustryDemoPage
      industry="contractor"
      tag="ELECTRICAL SERVICES"
      title="Electrician"
      body="A sample monthly plan for an electrical business — using completed projects, practical safety tips and clear service explainers to build local trust."
    />
  );
}

import { FidelityDemo } from "@/components/demo/fidelity/page";

// Keep the legacy Nails demo URL, but render the current mobile-first demo flow.
export default function DemoPage() {
  return <div className="nails-fidelity-demo"><FidelityDemo industry="nails" page="landing" /></div>;
}

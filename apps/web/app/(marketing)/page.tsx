import { Hero } from "../../components/landing/Hero";
import { Capabilities } from "../../components/landing/Capabilities";
import { CodeExample } from "../../components/landing/CodeExample";
import { StreamingSection } from "../../components/landing/StreamingSection";
import { RuntimeSupport } from "../../components/landing/RuntimeSupport";
import { FinalCTA } from "../../components/landing/FinalCTA";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <Capabilities />
      <CodeExample />
      <StreamingSection />
      <RuntimeSupport />
      <FinalCTA />
    </div>
  );
}

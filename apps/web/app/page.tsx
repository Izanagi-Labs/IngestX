import { Container } from "../components/layout/Container";
import { Button } from "../components/ui/Button";

export default function Home() {
  return (
    <Container variant="wide" className="py-24">
      <div className="flex flex-col items-center text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          IngestX
        </h1>
        <p className="text-xl text-foreground-muted max-w-[600px]">
          Landing page — Phase 2
        </p>
        <div className="flex gap-4">
          <Button variant="primary">Get Started</Button>
          <Button variant="secondary">Documentation</Button>
        </div>
      </div>
    </Container>
  );
}

import { Container } from "../../../components/layout/Container";

export const metadata = {
  title: "Interactive Demo",
};

export default function DemoPage() {
  return (
    <Container variant="full" className="py-8">
      <h1 className="text-2xl font-bold mb-4">Interactive Demo</h1>
      <p className="text-foreground-muted">Playground — Phase 5</p>
    </Container>
  );
}

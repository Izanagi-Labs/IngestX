import { Container } from "../../components/layout/Container";

export const metadata = {
  title: "Documentation",
};

export default function DocsPage() {
  return (
    <Container variant="standard" className="py-12">
      <h1 className="text-3xl font-bold mb-4">Documentation</h1>
      <p className="text-foreground-muted">Documentation system — Phase 3</p>
    </Container>
  );
}

import { Container } from "../../../components/layout/Container";
import { DemoPlayground } from "../../../components/demo/DemoPlayground";

export const metadata = {
  title: "Interactive Demo - IngestX Playground",
  description: "Test your schemas against CSV and Excel files in the browser.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Interactive Demo - IngestX Playground",
    description: "Test your schemas against CSV and Excel files in the browser.",
    url: "https://ingestx.vercel.app/demo",
  },
};

export default function DemoPage() {
  return (
    <Container variant="full" className="py-8">
      <DemoPlayground />
    </Container>
  );
}

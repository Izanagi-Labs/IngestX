import { Container } from "../../../components/layout/Container";
import { DemoPlayground } from "../../../components/demo/DemoPlayground";

export const metadata = {
  title: "Interactive Demo - IngestX Playground",
  description: "Test your schemas against CSV and Excel files in the browser.",
};

export default function DemoPage() {
  return (
    <Container variant="full" className="py-8">
      <DemoPlayground />
    </Container>
  );
}

import Link from "next/link";
import { Container } from "../components/layout/Container";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col w-full">
        <Container className="py-24 flex flex-col items-center justify-center text-center">
          <h1 className="text-6xl font-bold tracking-tight text-foreground mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Page Not Found</h2>
          <p className="text-foreground-muted mb-8 max-w-md">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Go back home
          </Link>
        </Container>
      </main>
      <Footer />
    </>
  );
}

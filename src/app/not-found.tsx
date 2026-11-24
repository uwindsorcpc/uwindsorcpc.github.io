import { SiteChrome } from "@/components/SiteChrome";
import { ButtonLink, Container } from "@/components/ui";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <SiteChrome>
    <Container className="py-24 sm:py-32">
      <p className="font-mono text-sm text-muted">
        <span className="text-accent">$</span> curl {"<this page>"}
      </p>
      <h1 className="mt-4 font-mono text-5xl font-bold text-hard sm:text-6xl">404: Wrong Answer</h1>
      <p className="mt-4 max-w-lg text-lg text-muted">
        Expected a page, found nothing. The link may be old, or the URL may have a typo.
      </p>
      <div className="mt-8">
        <ButtonLink href="/">Back to home</ButtonLink>
      </div>
    </Container>
    </SiteChrome>
  );
}

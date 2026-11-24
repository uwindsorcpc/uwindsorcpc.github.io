import { SiteChrome } from "@/components/SiteChrome";
import { ButtonLink, Container } from "@/components/ui";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <SiteChrome>
    <Container className="py-24 sm:py-32">
      <p className="headline text-[8rem] text-hard sm:text-[12rem]">404</p>
      <h1 className="condensed mt-2 text-4xl font-bold sm:text-5xl">Wrong Answer</h1>
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

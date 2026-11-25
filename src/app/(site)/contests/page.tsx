import { ContestsView } from "@/components/contests/ContestsView";
import { Container, PageHeader } from "@/components/ui";
import Link from "next/link";

import { fetchPastContests } from "@/lib/db/queries";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Contests",
  description: "Past CPC UWindsor club contests on Kattis. Every contest stays open for practice.",
  path: "/contests",
});

export default async function ContestsPage() {
  const contests = await fetchPastContests();

  return (
    <>
      <PageHeader
        title="Contests"
        intro="Club contests run on Kattis. Here is every past one, and each stays open so you can practise the problems you missed."
      />
      <Container className="py-14">
        <ContestsView contests={contests} />
        <p className="mt-12 text-muted">
          Looking for practice problems? They&apos;re in{" "}
          <Link href="/resources" className="text-accent underline underline-offset-4">
            Resources
          </Link>
          , sorted by platform.
        </p>
      </Container>
    </>
  );
}

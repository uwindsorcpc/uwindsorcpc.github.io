import { ContestsView } from "@/components/contests/ContestsView";
import { Container, PageHeader } from "@/components/ui";
import { fetchPastContests, fetchProblems } from "@/lib/db/queries";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Contests",
  description: "Past CPC UWindsor club contests on Kattis, plus curated practice problems sorted into easy, medium and hard.",
  path: "/contests",
});

export default async function ContestsPage() {
  const [contests, problems] = await Promise.all([fetchPastContests(), fetchProblems()]);

  return (
    <>
      <PageHeader
        title="Contests"
        intro="Club contests run on Kattis. Here is every past one, plus a set of problems to practise with."
      />
      <Container className="py-14">
        <ContestsView contests={contests} problems={problems} />
      </Container>
    </>
  );
}

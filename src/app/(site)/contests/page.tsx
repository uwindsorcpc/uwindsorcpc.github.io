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
        command="ls contests/"
        title="Contests"
        intro="Club contests run on Kattis, the same judge used at the ICPC regional. Missed one? Every past contest stays open for practice."
      />
      <Container className="py-14">
        <ContestsView contests={contests} problems={problems} />
      </Container>
    </>
  );
}

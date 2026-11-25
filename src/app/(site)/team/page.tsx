import { TeamGrid } from "@/components/team/TeamGrid";
import { Container, PageHeader } from "@/components/ui";
import { fetchTeam } from "@/lib/db/queries";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Team",
  description: "Meet the UWindsor CPC executive team: ICPC contestants who run the club's practices, workshops and contests.",
  path: "/team",
});

export default async function TeamPage() {
  const team = await fetchTeam();

  return (
    <>
      <PageHeader
        title="The team"
        intro="UWindsor CPC was started by three UWindsor ICPC contestants. Say hi at any practice night, or message us on Discord."
      />
      <Container className="py-14">
        <TeamGrid team={team} />
      </Container>
    </>
  );
}

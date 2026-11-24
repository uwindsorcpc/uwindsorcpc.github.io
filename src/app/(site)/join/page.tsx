import { DiscordIcon } from "@/components/icons";
import { FaqList } from "@/components/join/FaqList";
import { SignupForm } from "@/components/join/SignupForm";
import { Container, ExternalButton, PageHeader, SectionHeading } from "@/components/ui";
import { isPlaceholder, site } from "@/lib/content";
import { fetchFaqs } from "@/lib/db/queries";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Join",
  description: "Join CPC UWindsor: sign up in two minutes, hop on the Discord, and come to a practice. Free, and no experience needed.",
  path: "/join",
});

const steps = [
  { title: "Sign up", text: "Fill in the short form so we can add you to the member list and send you event updates." },
  { title: "Join the Discord", text: "Announcements, problem discussion, and a place to ask for help between sessions." },
  { title: "Come to a practice", text: "Bring a laptop and show up. We'll help you set up and solve your first problem." },
];

export default async function JoinPage() {
  const faqs = await fetchFaqs();

  return (
    <>
      <PageHeader
        command="./join --no-experience-needed"
        title="Join the club"
        intro="Membership is free and open to every UWindsor student. It takes about two minutes."
      />

      <Container className="py-14">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section aria-labelledby="signup" className="rounded-2xl border border-accent/50 bg-surface p-6 sm:p-10">
            <p className="font-mono text-sm text-accent">step_1</p>
            <h2 id="signup" className="mt-2 text-2xl font-bold">
              Become a member
            </h2>
            <p className="mt-2 mb-8 text-muted">Any experience level is welcome, including none at all.</p>
            <SignupForm clubEmail={site.email} />
          </section>

          <section aria-labelledby="discord" className="flex flex-col items-start self-start rounded-2xl border border-border bg-surface p-6 sm:p-10">
            <p className="font-mono text-sm text-accent">step_2</p>
            <h2 id="discord" className="mt-2 text-2xl font-bold">
              Join the Discord
            </h2>
            <p className="mt-2 text-muted">Where we post events, share problems, and help each other debug.</p>
            <ExternalButton href={site.discordUrl} variant="secondary" size="lg" className="mt-6 w-full">
              <DiscordIcon /> Join the Discord
            </ExternalButton>
          </section>
        </div>

        <section aria-labelledby="how" className="mt-20">
          <SectionHeading id="how">How it works</SectionHeading>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-border bg-surface p-6">
                <span aria-hidden="true" className="font-mono text-3xl font-bold text-accent">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="faq" className="mt-20">
          <SectionHeading id="faq">FAQ</SectionHeading>
          <FaqList faqs={faqs} />
          <p className="mt-8 text-sm text-muted">
            Still have a question? Email us at{" "}
            {isPlaceholder(site.email) ? (
              <span className="font-mono text-fg">{site.email}</span>
            ) : (
              <a href={`mailto:${site.email}`} className="font-mono text-accent underline underline-offset-4">
                {site.email}
              </a>
            )}{" "}
            or ask on Discord.
          </p>
        </section>
      </Container>
    </>
  );
}

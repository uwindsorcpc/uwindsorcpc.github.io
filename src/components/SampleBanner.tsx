import { site } from "@/lib/content";

/** Shown while content/site.json has "showSampleContentBanner": true. */
export function SampleBanner() {
  if (!site.showSampleContentBanner) return null;
  return (
    <div className="border-b border-medium/40 bg-medium/10 px-4 py-2 text-center text-sm text-fg">
      <span className="font-semibold">Preview:</span> this site uses sample placeholder content.
      Events, team members and links are not real yet.
    </div>
  );
}

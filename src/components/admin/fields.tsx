"use client";

import { useState } from "react";

import { getAdminDb } from "@/lib/supabase/clients";
import { TEAM_LINK_KEYS, type TeamLinkKey } from "@/lib/db/types";
import { inputClass, labelClass, secondaryBtn } from "./styles";

export type FormValue = string | boolean | Record<string, string>;
export type FormValues = Record<string, FormValue>;

type Base = { name: string; label: string; required?: boolean; help?: string; wide?: boolean };
export type FieldDef =
  | (Base & { kind: "text" | "url" | "email" | "textarea"; maxLength?: number; placeholder?: string })
  | (Base & { kind: "number"; min?: number; max?: number })
  | (Base & { kind: "date" | "time" })
  | (Base & { kind: "checkbox" })
  | (Base & { kind: "select"; options: readonly (readonly [string, string])[] })
  | (Base & { kind: "photo" })
  | (Base & { kind: "links" });

const LINK_LABELS: Record<TeamLinkKey, string> = {
  github: "GitHub URL",
  linkedin: "LinkedIn URL",
  codeforces: "Codeforces profile URL",
  kattis: "Kattis profile URL",
  website: "Website URL",
  email: "Email address",
};

function PhotoField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [status, setStatus] = useState("");

  async function upload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStatus("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatus("Image must be under 2 MB.");
      return;
    }
    setStatus("Uploading…");
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${crypto.randomUUID()}.${ext}`;
    const bucket = getAdminDb().storage.from("team-photos");
    const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      setStatus(`Upload failed: ${error.message}`);
      return;
    }
    onChange(bucket.getPublicUrl(path).data.publicUrl);
    setStatus("Uploaded. Click Save to keep it.");
  }

  return (
    <div className="mt-1.5 flex items-center gap-4">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element -- preview of an uploaded photo
        <img src={value} alt="Current photo" className="size-16 rounded-lg border border-border object-cover" />
      ) : (
        <div className="flex size-16 items-center justify-center rounded-lg border border-dashed border-border font-mono text-xs text-muted">
          none
        </div>
      )}
      <div className="grid gap-1.5">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          className="text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface-2 file:px-3 file:py-1.5 file:font-mono file:text-xs file:text-fg"
        />
        {value && (
          <button type="button" onClick={() => onChange("")} className={`${secondaryBtn} w-fit px-2 py-1 text-xs`}>
            Remove photo
          </button>
        )}
        {status && <p className="text-xs text-muted">{status}</p>}
      </div>
    </div>
  );
}

export function Field({ def, value, onChange }: { def: FieldDef; value: FormValue; onChange: (v: FormValue) => void }) {
  const id = `field-${def.name}`;
  const req = def.required ? <span className="text-hard" aria-hidden="true"> *</span> : null;
  const help = def.help ? <p className="mt-1 text-xs text-muted">{def.help}</p> : null;
  const str = typeof value === "string" ? value : "";

  switch (def.kind) {
    case "checkbox":
      return (
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--accent)]" />
          {def.label}
        </label>
      );
    case "textarea":
      return (
        <div>
          <label htmlFor={id} className={labelClass}>
            {def.label}
            {req}
          </label>
          <textarea
            id={id}
            value={str}
            required={def.required}
            maxLength={def.maxLength}
            rows={4}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          {help}
        </div>
      );
    case "select":
      return (
        <div>
          <label htmlFor={id} className={labelClass}>
            {def.label}
            {req}
          </label>
          <select id={id} value={str} required={def.required} onChange={(e) => onChange(e.target.value)} className={inputClass}>
            {!def.required && <option value="">—</option>}
            {def.options.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          {help}
        </div>
      );
    case "photo":
      return (
        <div>
          <span className={labelClass}>{def.label}</span>
          <PhotoField value={str} onChange={onChange} />
          {help}
        </div>
      );
    case "links": {
      const links = typeof value === "object" && value !== null ? (value as Record<string, string>) : {};
      return (
        <fieldset>
          <legend className={labelClass}>{def.label}</legend>
          <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
            {TEAM_LINK_KEYS.map((k) => (
              <div key={k}>
                <label htmlFor={`${id}-${k}`} className="text-xs text-muted">
                  {LINK_LABELS[k]}
                </label>
                <input
                  id={`${id}-${k}`}
                  type={k === "email" ? "email" : "url"}
                  value={links[k] ?? ""}
                  placeholder={k === "email" ? "name@example.com" : "https://…"}
                  onChange={(e) => onChange({ ...links, [k]: e.target.value })}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          {help}
        </fieldset>
      );
    }
    default:
      return (
        <div>
          <label htmlFor={id} className={labelClass}>
            {def.label}
            {req}
          </label>
          <input
            id={id}
            type={def.kind}
            value={str}
            required={def.required}
            maxLength={"maxLength" in def ? def.maxLength : undefined}
            placeholder={"placeholder" in def ? def.placeholder : def.kind === "url" ? "https://…" : undefined}
            min={"min" in def ? def.min : undefined}
            max={"max" in def ? def.max : undefined}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          {help}
        </div>
      );
  }
}

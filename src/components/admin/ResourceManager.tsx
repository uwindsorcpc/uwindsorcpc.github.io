"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { getAdminDb } from "@/lib/supabase/clients";
import { Field, type FormValues } from "./fields";
import { defaultFromForm, defaultToForm, type ResourceDef, type Row } from "./resources";
import { dangerBtn, inputClass, primaryBtn, secondaryBtn } from "./styles";

/** Spreadsheet-safe CSV: quotes every cell and defuses formula injection. */
function toCsv(rows: Row[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const cell = (v: unknown) => {
    let t = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
    return `"${t.replace(/"/g, '""')}"`;
  };
  return [cols.map(cell).join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export function ResourceManager({ def }: { def: ResourceDef }) {
  const db = getAdminDb();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<{ row: Row | null; values: FormValues } | null>(null);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const toForm = useCallback((row: Row | null) => (def.toForm ? def.toForm(row) : defaultToForm(def.fields, row)), [def]);
  const fromForm = (v: FormValues) => (def.fromForm ? def.fromForm(v) : defaultFromForm(def.fields, v));

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let active = true;
    let q = db.from(def.table).select(def.select);
    for (const o of def.order) q = q.order(o.column, { ascending: o.ascending ?? true });
    q.then(({ data, error }) => {
      if (!active) return;
      setLoadError(error ? error.message : "");
      if (!error) setRows(data as unknown as Row[]);
    });
    return () => {
      active = false;
    };
  }, [db, def, reloadKey]);

  const shown = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q || !def.searchText) return rows;
    return rows.filter((r) => def.searchText!(r).includes(q));
  }, [rows, query, def]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaveError("");
    let payload: Record<string, unknown>;
    try {
      payload = fromForm(editing.values);
    } catch (err) {
      setSaveError((err as Error).message);
      return;
    }
    setSaving(true);
    const { error } = editing.row
      ? await db.from(def.table).update(payload).eq("id", editing.row.id)
      : await db.from(def.table).insert(Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null)));
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    setEditing(null);
    reload();
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete ${def.singular} "${def.describe(row)}"? This can't be undone.`)) return;
    const { error } = await db.from(def.table).delete().eq("id", row.id);
    if (error) window.alert(`Couldn't delete: ${error.message}`);
    reload();
  }

  if (editing) {
    return (
      <form onSubmit={save} className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-mono text-lg font-bold">
          {editing.row ? `Edit ${def.singular}` : `New ${def.singular}`}
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {def.fields.map((f) => (
            <div key={f.name} className={f.wide || f.kind === "checkbox" ? "sm:col-span-2" : ""}>
              <Field
                def={f}
                value={editing.values[f.name]}
                onChange={(v) => setEditing((cur) => cur && { ...cur, values: { ...cur.values, [f.name]: v } })}
              />
            </div>
          ))}
        </div>
        {saveError && (
          <p role="alert" className="mt-5 text-sm text-hard">
            {saveError}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(null)} className={secondaryBtn}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {def.canCreate !== false && (
          <button type="button" onClick={() => setEditing({ row: null, values: toForm(null) })} className={primaryBtn}>
            + New {def.singular}
          </button>
        )}
        {def.searchText && (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label={`Search ${def.title.toLowerCase()}`}
            className={`${inputClass} mt-0 max-w-xs`}
          />
        )}
        {def.csv && rows && rows.length > 0 && (
          <button type="button" onClick={() => download(`${def.table}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows))} className={secondaryBtn}>
            Export CSV
          </button>
        )}
        <span className="ml-auto font-mono text-xs text-muted">{rows ? `${shown.length} of ${rows.length}` : ""}</span>
      </div>

      {loadError && (
        <p role="alert" className="rounded-lg border border-hard/40 bg-hard/10 p-4 text-sm text-hard">
          Couldn&apos;t load {def.title.toLowerCase()}: {loadError}
        </p>
      )}

      {!rows && !loadError && <p className="font-mono text-sm text-muted">Loading…</p>}

      {rows && rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 font-mono text-sm text-muted">Nothing here yet.</p>
      )}

      {shown.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 font-mono text-xs text-muted">
              <tr>
                {def.columns.map((c) => (
                  <th key={c.label} scope="col" className="px-4 py-3 font-medium">
                    {c.label}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {shown.map((r) => (
                <tr key={r.id} className="align-top">
                  {def.columns.map((c) => (
                    <td key={c.label} className="px-4 py-3">
                      {c.render(r)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSaveError("");
                          setEditing({ row: r, values: toForm(r) });
                        }}
                        className={`${secondaryBtn} px-3 py-1.5 text-xs`}
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => remove(r)} className={dangerBtn}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

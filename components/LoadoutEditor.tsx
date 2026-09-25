"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LoadoutScreen,
  type LoadoutEditHandlers,
} from "@/components/LoadoutScreen";
import { CURATED_BUILDS } from "@/data/builds";
import {
  BUILD_FORMAT_VERSION,
  serializeBuild,
  slugify,
  type BuildFile,
} from "@/lib/buildFormat";
import {
  setGearSource,
  setName,
  setSkill,
  setSpecialization,
  setWeaponAttribute,
  setWeaponSource,
} from "@/lib/loadoutEdits";
import type { Loadout } from "@/lib/types";

/**
 * The build as it would be saved. Keeping the curated name keeps its id and
 * source, so copying an edited curated build overwrites that build's file.
 * Renaming it makes a new build: a new id, and no source, since the edits are
 * no longer the source's.
 */
const toBuildFile = (base: BuildFile, loadout: Loadout): BuildFile => {
  const renamed = loadout.name.trim() !== base.loadout.name;
  return {
    version: BUILD_FORMAT_VERSION,
    id: renamed ? slugify(loadout.name) : base.id,
    ...(!renamed && base.source ? { source: base.source } : {}),
    loadout: { ...loadout, name: loadout.name.trim() || base.loadout.name },
  };
};

/**
 * Holds the loadout being edited. The toolbar's Edit button switches the whole
 * screen into edit mode, where every slot shows its controls at once on its
 * own card; Done switches back to the plain character screen. The toolbar also
 * chooses a build, resets it, and copies it out as JSON.
 *
 * Nothing persists yet — a reload restores the curated build.
 */
export const LoadoutEditor = ({ build }: { build: BuildFile }) => {
  const router = useRouter();
  const [loadout, setLoadout] = useState<Loadout>(build.loadout);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const dirty = loadout !== build.loadout;

  const edit: LoadoutEditHandlers = {
    name: (name) => setLoadout((l) => setName(l, name)),
    gear: (slot, source) => setLoadout((l) => setGearSource(l, slot, source)),
    weapon: (slot, source) => setLoadout((l) => setWeaponSource(l, slot, source)),
    weaponAttribute: (slot, name) =>
      setLoadout((l) => setWeaponAttribute(l, slot, name)),
    skill: (index, skill) => setLoadout((l) => setSkill(l, index, skill)),
    specialization: (id) => setLoadout((l) => setSpecialization(l, id)),
  };

  const copyJson = async () => {
    const file = toBuildFile(build, loadout);
    const json = serializeBuild(file);
    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus(`Copied — save as data/builds/${file.id}.json`);
    } catch {
      // Clipboard access is refused in some browsers and contexts; a file
      // download works everywhere and already has the right name.
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setCopyStatus(`Downloaded ${file.id}.json`);
    }
    window.setTimeout(() => setCopyStatus(null), 4000);
  };

  return (
    <>
      <div className="editor-shell">
        <div className="toolbar panel">
          <label className="picker build-picker">
            <span className="picker-label">Build</span>
            <select
              className="picker-select"
              value={build.id}
              onChange={(e) => router.push(`/builds/${e.target.value}`)}
            >
              {CURATED_BUILDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.loadout.name}
                </option>
              ))}
            </select>
          </label>

          <div className="editor-actions">
            {dirty ? (
              <button
                type="button"
                className="action"
                onClick={() => setLoadout(build.loadout)}
              >
                Reset
              </button>
            ) : null}
            <button
              type="button"
              className={`action${editing ? " is-active" : ""}`}
              aria-pressed={editing}
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? "Done" : "Edit"}
            </button>
            <button type="button" className="action" onClick={copyJson}>
              Copy JSON
            </button>
          </div>

          {copyStatus ? (
            <p className="copy-status" role="status">
              {copyStatus}
            </p>
          ) : null}
        </div>
      </div>

      <LoadoutScreen
        loadout={loadout}
        source={build.source}
        edit={editing ? edit : undefined}
      />
    </>
  );
};

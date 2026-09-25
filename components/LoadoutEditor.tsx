"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadoutScreen } from "@/components/LoadoutScreen";
import {
  GearSourcePicker,
  SkillPicker,
  SpecializationPicker,
} from "@/components/SlotPickers";
import { CURATED_BUILDS } from "@/data/builds";
import {
  BUILD_FORMAT_VERSION,
  serializeBuild,
  slugify,
  type BuildFile,
} from "@/lib/buildFormat";
import {
  SKILL_SLOTS,
  gearSourceOf,
  setGearSource,
  setSkill,
  setSpecialization,
} from "@/lib/loadoutEdits";
import type { GearSlot, Loadout } from "@/lib/types";

/** Matches the slot order the screen renders, so the two columns line up. */
const GEAR_ORDER: readonly GearSlot[] = [
  "mask",
  "chest",
  "backpack",
  "gloves",
  "holster",
  "kneepads",
];

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
 * Holds the edited loadout and renders the read-only screen beneath the
 * pickers. Set bonuses are derived on every render by `lib/setBonuses.ts`, so
 * changing a slot re-resolves them with no extra wiring.
 *
 * Nothing persists yet — a reload restores the curated build. Saving builds in
 * the browser is the next step.
 */
export const LoadoutEditor = ({ build }: { build: BuildFile }) => {
  const router = useRouter();
  const [loadout, setLoadout] = useState<Loadout>(build.loadout);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const gearBySlot = new Map(loadout.gear.map((p) => [p.slot, p]));
  const dirty = loadout !== build.loadout;

  // Show every filled skill slot plus one empty one, up to the limit, so a
  // build with no skills still offers somewhere to add the first.
  const skillSlots = Math.min(loadout.skills.length + 1, SKILL_SLOTS);

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
        <section className="editor panel">
          <div className="editor-head">
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
              <button type="button" className="action" onClick={copyJson}>
                Copy JSON
              </button>
            </div>
          </div>

          {copyStatus ? (
            <p className="copy-status" role="status">
              {copyStatus}
            </p>
          ) : null}

          <div className="picker-grid">
            <label className="picker">
              <span className="picker-label">Build name</span>
              <input
                className="picker-select"
                type="text"
                value={loadout.name}
                onChange={(e) =>
                  setLoadout((current) => ({ ...current, name: e.target.value }))
                }
              />
            </label>

            {GEAR_ORDER.map((slot) => {
              const piece = gearBySlot.get(slot);
              return (
                <GearSourcePicker
                  key={slot}
                  slot={slot}
                  source={gearSourceOf(piece)}
                  currentItemName={piece?.name}
                  onChange={(next) =>
                    setLoadout((current) => setGearSource(current, slot, next))
                  }
                />
              );
            })}

            {Array.from({ length: skillSlots }, (_, i) => (
              <SkillPicker
                key={`skill-${i}`}
                index={i}
                skill={loadout.skills[i]}
                onChange={(next) =>
                  setLoadout((current) => setSkill(current, i, next))
                }
              />
            ))}

            <SpecializationPicker
              specializationId={loadout.specializationId}
              onChange={(id) =>
                setLoadout((current) => setSpecialization(current, id))
              }
            />
          </div>

          <p className="editor-note">
            Changing a slot keeps its rolled attributes and mod but clears the
            item&rsquo;s name and talent, which belong to one specific item.
            Nothing is saved: a reload restores the build. To add a curated
            build, rename it, use Copy JSON, and commit the file to{" "}
            <code>data/builds/</code>.
          </p>
        </section>
      </div>

      <LoadoutScreen loadout={loadout} source={build.source} />
    </>
  );
};

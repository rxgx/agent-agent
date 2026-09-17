"use client";

import { useState } from "react";
import { LoadoutScreen } from "@/components/LoadoutScreen";
import {
  GearSourcePicker,
  SkillPicker,
  SpecializationPicker,
} from "@/components/SlotPickers";
import {
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
 * Holds the edited loadout and renders the read-only screen beneath the
 * pickers. Set bonuses are derived on every render by `lib/setBonuses.ts`, so
 * changing a slot re-resolves them with no extra wiring.
 *
 * Nothing persists yet — a reload restores the sample. localStorage and
 * JSON import/export are the next step.
 */
export const LoadoutEditor = ({ initial }: { initial: Loadout }) => {
  const [loadout, setLoadout] = useState<Loadout>(initial);
  const gearBySlot = new Map(loadout.gear.map((p) => [p.slot, p]));
  const dirty = loadout !== initial;

  return (
    <>
      <div className="editor-shell">
        <section className="editor panel">
        <div className="editor-head">
          <h2>Edit Loadout</h2>
          {dirty ? (
            <button
              type="button"
              className="reset"
              onClick={() => setLoadout(initial)}
            >
              Reset to sample
            </button>
          ) : null}
        </div>

        <div className="picker-grid">
          {GEAR_ORDER.map((slot) => (
            <GearSourcePicker
              key={slot}
              slot={slot}
              source={gearSourceOf(gearBySlot.get(slot))}
              onChange={(next) =>
                setLoadout((current) => setGearSource(current, slot, next))
              }
            />
          ))}

          {loadout.skills.map((skill, i) => (
            <SkillPicker
              key={`skill-${i}`}
              index={i}
              platformId={skill.platformId}
              variant={skill.variant}
              onChange={(platformId, variant) =>
                setLoadout((current) =>
                  setSkill(current, i, platformId, variant),
                )
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
          Changing a slot keeps its rolled attributes and mod — a reroll is
          independent of the brand — but clears the item&rsquo;s name and talent,
          which belong to one specific item. Nothing persists; a reload restores
          the sample.
        </p>
        </section>
      </div>

      <LoadoutScreen loadout={loadout} />
    </>
  );
};

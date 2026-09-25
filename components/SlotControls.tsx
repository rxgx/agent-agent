"use client";

/**
 * The selects shown inside a card while it is being edited. Each one reads the
 * current loadout, so it can mark the equipped choice and apply the exotic
 * rule: once one exotic weapon (or armor piece) is equipped, the other exotics
 * are disabled in the remaining slots, as the game refuses them. The equipped
 * exotic itself can still be swapped out.
 */

import { BRANDS } from "@/data/brands";
import { GEAR_SETS } from "@/data/gearSets";
import { SKILL_PLATFORMS, SPECIALIZATIONS } from "@/data/skills";
import {
  decodeGearSource,
  decodeWeaponSource,
  encodeGearSource,
  encodeWeaponSource,
  exoticGearElsewhere,
  exoticWeaponElsewhere,
  gearItemsFor,
  gearSourceOf,
  weaponSourceOf,
  weaponsFor,
  type GearSource,
  type WeaponSource,
} from "@/lib/loadoutEdits";
import type {
  EquippedSkill,
  GearSlot,
  Loadout,
  WeaponDef,
  WeaponSlot,
  WeaponType,
} from "@/lib/types";

const EXOTIC_TAKEN = " — another exotic is equipped";

export const GearSelect = ({
  slot,
  loadout,
  onChange,
}: {
  slot: GearSlot;
  loadout: Loadout;
  onChange: (next: GearSource) => void;
}) => {
  const piece = loadout.gear.find((p) => p.slot === slot);
  const source = gearSourceOf(piece);
  const items = gearItemsFor(slot);
  const exotics = items.filter((g) => g.rarity === "exotic");
  const named = items.filter((g) => g.rarity === "named");
  const exoticLocked = exoticGearElsewhere(loadout, slot);

  return (
    <select
      className="picker-select"
      aria-label={`${slot} item`}
      value={encodeGearSource(source)}
      onChange={(e) => onChange(decodeGearSource(e.target.value))}
    >
      <option value="empty">— Empty —</option>

      {/* Offered only while equipped: switching away drops it for good. */}
      {source.kind === "current" && piece?.name ? (
        <optgroup label="Equipped">
          <option value="current">{piece.name}</option>
        </optgroup>
      ) : null}

      {exotics.length > 0 ? (
        <optgroup label="Exotic">
          {exotics.map((g) => (
            <option key={g.id} value={`item:${g.id}`} disabled={exoticLocked}>
              {g.name}
              {exoticLocked ? EXOTIC_TAKEN : ""}
            </option>
          ))}
        </optgroup>
      ) : null}

      <optgroup label="Gear Sets">
        {GEAR_SETS.map((set) => (
          <option key={set.id} value={`gearSet:${set.id}`}>
            {set.name}
          </option>
        ))}
      </optgroup>

      <optgroup label="Brands">
        {BRANDS.map((brand) => (
          <option key={brand.id} value={`brand:${brand.id}`}>
            {brand.name}
          </option>
        ))}
      </optgroup>

      {named.length > 0 ? (
        <optgroup label="Named">
          {named.map((g) => (
            <option key={g.id} value={`item:${g.id}`}>
              {g.name}
            </option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
};

const byType = (weapons: readonly WeaponDef[]) => {
  const groups = new Map<WeaponType, WeaponDef[]>();
  for (const w of weapons) {
    groups.set(w.type, [...(groups.get(w.type) ?? []), w]);
  }
  return [...groups.entries()];
};

const RARITY_SUFFIX: Record<WeaponDef["rarity"], string> = {
  exotic: " (exotic)",
  named: " (named)",
  highEnd: "",
};

export const WeaponSelect = ({
  slot,
  loadout,
  onChange,
}: {
  slot: WeaponSlot;
  loadout: Loadout;
  onChange: (next: WeaponSource) => void;
}) => {
  const weapon = loadout.weapons.find((w) => w.slot === slot);
  const source = weaponSourceOf(weapon);
  const exoticLocked = exoticWeaponElsewhere(loadout, slot);

  return (
    <select
      className="picker-select"
      aria-label={`${slot} weapon`}
      value={encodeWeaponSource(source)}
      onChange={(e) => onChange(decodeWeaponSource(e.target.value))}
    >
      <option value="empty">— Empty —</option>

      {source.kind === "current" && weapon ? (
        <optgroup label="Equipped">
          <option value="current">{weapon.name}</option>
        </optgroup>
      ) : null}

      {byType(weaponsFor(slot)).map(([type, weapons]) => (
        <optgroup key={type} label={type}>
          {weapons.map((w) => {
            const locked = w.rarity === "exotic" && exoticLocked;
            return (
              <option key={w.id} value={`weapon:${w.id}`} disabled={locked}>
                {w.name}
                {RARITY_SUFFIX[w.rarity]}
                {locked ? EXOTIC_TAKEN : ""}
              </option>
            );
          })}
        </optgroup>
      ))}
    </select>
  );
};

export const SkillSelects = ({
  skill,
  onChange,
}: {
  skill: EquippedSkill | undefined;
  onChange: (next: EquippedSkill | null) => void;
}) => {
  const platform = skill
    ? SKILL_PLATFORMS.find((p) => p.id === skill.platformId)
    : undefined;

  return (
    <>
      <select
        className="picker-select"
        aria-label="Skill"
        value={skill?.platformId ?? ""}
        onChange={(e) => {
          const next = SKILL_PLATFORMS.find((p) => p.id === e.target.value);
          // Variants do not survive a platform change — they belong to it.
          onChange(next ? { platformId: next.id, variant: next.variants[0] } : null);
        }}
      >
        <option value="">— None —</option>
        {SKILL_PLATFORMS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {platform ? (
        <select
          className="picker-select"
          aria-label="Skill variant"
          value={skill?.variant ?? ""}
          onChange={(e) =>
            onChange({ platformId: platform.id, variant: e.target.value })
          }
        >
          {platform.variants.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      ) : null}
    </>
  );
};

export const SpecializationSelect = ({
  specializationId,
  onChange,
}: {
  specializationId: string | undefined;
  onChange: (id: string) => void;
}) => (
  <select
    className="picker-select"
    aria-label="Specialization"
    value={specializationId ?? ""}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="">— None —</option>
    {SPECIALIZATIONS.map((spec) => (
      <option key={spec.id} value={spec.id}>
        {spec.name}
      </option>
    ))}
  </select>
);

"use client";

import { BRANDS } from "@/data/brands";
import { GEAR_SETS } from "@/data/gearSets";
import { SKILL_PLATFORMS, SPECIALIZATIONS } from "@/data/skills";
import {
  encodeSource,
  decodeSource,
  type GearSource,
} from "@/lib/loadoutEdits";
import type { EquippedSkill, GearSlot } from "@/lib/types";

const GEAR_SLOT_LABELS: Record<GearSlot, string> = {
  mask: "Mask",
  backpack: "Backpack",
  chest: "Body Armor",
  gloves: "Gloves",
  holster: "Holster",
  kneepads: "Kneepads",
};

export const GearSourcePicker = ({
  slot,
  source,
  currentItemName,
  onChange,
}: {
  slot: GearSlot;
  source: GearSource;
  /** The named or exotic piece in the slot now, if the pickers can't rebuild it. */
  currentItemName?: string;
  onChange: (next: GearSource) => void;
}) => (
  <label className="picker">
    <span className="picker-label">{GEAR_SLOT_LABELS[slot]}</span>
    <select
      className="picker-select"
      value={encodeSource(source)}
      onChange={(e) => onChange(decodeSource(e.target.value))}
    >
      <option value="empty">— Empty —</option>

      {/* Offered only while equipped: switching away drops it for good. */}
      {source.kind === "item" && currentItemName ? (
        <optgroup label="Equipped">
          <option value="item">{currentItemName}</option>
        </optgroup>
      ) : null}

      {/* Backpack only: the one exotic the bonus engine models. */}
      {slot === "backpack" ? (
        <optgroup label="Exotic">
          <option value="ninjabike">NinjaBike Messenger Backpack</option>
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
    </select>
  </label>
);

export const SkillPicker = ({
  index,
  skill,
  onChange,
}: {
  index: number;
  skill: EquippedSkill | undefined;
  onChange: (next: EquippedSkill | null) => void;
}) => {
  const platform = skill
    ? SKILL_PLATFORMS.find((p) => p.id === skill.platformId)
    : undefined;

  return (
    <label className="picker">
      <span className="picker-label">Skill {index + 1}</span>
      <select
        className="picker-select"
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

      <select
        className="picker-select is-variant"
        value={skill?.variant ?? ""}
        onChange={(e) =>
          skill && onChange({ platformId: skill.platformId, variant: e.target.value })
        }
        disabled={!platform || platform.variants.length === 0}
      >
        {platform ? (
          platform.variants.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))
        ) : (
          <option value="">—</option>
        )}
      </select>
    </label>
  );
};

export const SpecializationPicker = ({
  specializationId,
  onChange,
}: {
  specializationId: string | undefined;
  onChange: (id: string) => void;
}) => (
  <label className="picker">
    <span className="picker-label">Specialization</span>
    <select
      className="picker-select"
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
  </label>
);

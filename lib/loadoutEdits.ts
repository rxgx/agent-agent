/**
 * Pure loadout edits.
 *
 * Every change a picker can make is a function from one Loadout to the next.
 * Keeping them here rather than inside the component means the interesting
 * behaviour — what survives a slot change and what does not — can be reasoned
 * about and exercised without rendering anything.
 */

import { BRANDS_BY_ID } from "@/data/brands";
import { GEAR_SETS_BY_ID } from "@/data/gearSets";
import type {
  EquippedSkill,
  GearPiece,
  GearSlot,
  Loadout,
  Rarity,
} from "@/lib/types";

/** The NinjaBike backpack is the one exotic the view models, for its wildcard talent. */
export const NINJABIKE = {
  slot: "backpack" as const,
  name: "NinjaBike Messenger Backpack",
  talent: "Resourceful",
  core: "Weapon Damage",
};

/**
 * What a gear slot is currently filled with.
 *
 * `item` is a named or exotic piece the pickers cannot build from scratch —
 * Memento, say, which has no brand. The picker offers it only while it is the
 * slot's current piece, so choosing it again leaves the piece untouched.
 */
export type GearSource =
  | { readonly kind: "empty" }
  | { readonly kind: "brand"; readonly id: string }
  | { readonly kind: "gearSet"; readonly id: string }
  | { readonly kind: "ninjabike" }
  | { readonly kind: "item" };

export const gearSourceOf = (piece: GearPiece | undefined): GearSource => {
  if (!piece) return { kind: "empty" };
  if (piece.countsForAllSets) return { kind: "ninjabike" };
  if (piece.gearSetId) return { kind: "gearSet", id: piece.gearSetId };
  if (piece.brandId) return { kind: "brand", id: piece.brandId };
  if (piece.name) return { kind: "item" };
  return { kind: "empty" };
};

/** Serialised form, so a <select> can round-trip a source through its value. */
export const encodeSource = (source: GearSource): string =>
  source.kind === "brand" || source.kind === "gearSet"
    ? `${source.kind}:${source.id}`
    : source.kind;

export const decodeSource = (value: string): GearSource => {
  if (value === "ninjabike") return { kind: "ninjabike" };
  if (value === "item") return { kind: "item" };
  const [kind, ...rest] = value.split(":");
  const id = rest.join(":");
  if (kind === "brand" && id) return { kind: "brand", id };
  if (kind === "gearSet" && id) return { kind: "gearSet", id };
  return { kind: "empty" };
};

const RARITY_FOR: Record<Exclude<GearSource["kind"], "empty" | "item">, Rarity> = {
  brand: "highEnd",
  gearSet: "gearSet",
  ninjabike: "exotic",
};

/**
 * Build the piece for a slot under a new source.
 *
 * Rolled attributes and the slotted mod carry over — a reroll is independent of
 * which brand the item came from, so dropping them on every change would be
 * both wrong and annoying. Item identity does not carry over: name and talent
 * belong to one specific item, so they are cleared. The core attribute is taken
 * from the brand or set, without a magnitude, because no source emits per-roll
 * values.
 */
const repieceSlot = (
  slot: GearSlot,
  source: GearSource,
  previous: GearPiece | undefined,
): GearPiece | undefined => {
  if (source.kind === "empty") return undefined;
  if (source.kind === "item") return previous;

  const carried = {
    attributes: previous?.attributes,
    mod: previous?.mod,
  };

  if (source.kind === "ninjabike") {
    return {
      slot,
      name: NINJABIKE.name,
      rarity: "exotic",
      core: { name: NINJABIKE.core },
      talent: NINJABIKE.talent,
      countsForAllSets: true,
      ...carried,
    };
  }

  const ref =
    source.kind === "gearSet"
      ? GEAR_SETS_BY_ID.get(source.id)
      : BRANDS_BY_ID.get(source.id);
  if (!ref) return previous;

  return {
    slot,
    rarity: RARITY_FOR[source.kind],
    ...(source.kind === "gearSet"
      ? { gearSetId: source.id }
      : { brandId: source.id }),
    ...(ref.coreAttribute ? { core: { name: ref.coreAttribute } } : {}),
    ...carried,
  };
};

/** Slot order is the view's concern; the array only needs to hold each slot once. */
export const setGearSource = (
  loadout: Loadout,
  slot: GearSlot,
  source: GearSource,
): Loadout => {
  const previous = loadout.gear.find((p) => p.slot === slot);
  const next = repieceSlot(slot, source, previous);
  const others = loadout.gear.filter((p) => p.slot !== slot);

  return { ...loadout, gear: next ? [...others, next] : others };
};

/** A loadout carries at most two skills, in slot order. */
export const SKILL_SLOTS = 2;

/**
 * Fill, replace or clear a skill slot. Filling a slot past the end appends;
 * clearing one closes the gap, as the game does with a single skill equipped.
 */
export const setSkill = (
  loadout: Loadout,
  index: number,
  skill: EquippedSkill | null,
): Loadout => {
  const skills = [...loadout.skills];
  if (skill === null) skills.splice(index, 1);
  else if (index < skills.length) skills[index] = skill;
  else skills.push(skill);
  return { ...loadout, skills: skills.slice(0, SKILL_SLOTS) };
};

/** An empty id clears the specialization rather than storing "". */
export const setSpecialization = (
  loadout: Loadout,
  specializationId: string,
): Loadout => {
  const { specializationId: _dropped, ...rest } = loadout;
  return specializationId ? { ...rest, specializationId } : rest;
};

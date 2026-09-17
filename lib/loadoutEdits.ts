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
import type { GearPiece, GearSlot, Loadout, Rarity } from "@/lib/types";

/** The NinjaBike backpack is the one exotic the view models, for its wildcard talent. */
export const NINJABIKE = {
  slot: "backpack" as const,
  name: "NinjaBike Messenger Backpack",
  talent: "Resourceful",
  core: "Weapon Damage",
};

/** What a gear slot is currently filled with. */
export type GearSource =
  | { readonly kind: "empty" }
  | { readonly kind: "brand"; readonly id: string }
  | { readonly kind: "gearSet"; readonly id: string }
  | { readonly kind: "ninjabike" };

export const gearSourceOf = (piece: GearPiece | undefined): GearSource => {
  if (!piece) return { kind: "empty" };
  if (piece.countsForAllSets) return { kind: "ninjabike" };
  if (piece.gearSetId) return { kind: "gearSet", id: piece.gearSetId };
  if (piece.brandId) return { kind: "brand", id: piece.brandId };
  return { kind: "empty" };
};

/** Serialised form, so a <select> can round-trip a source through its value. */
export const encodeSource = (source: GearSource): string =>
  source.kind === "brand" || source.kind === "gearSet"
    ? `${source.kind}:${source.id}`
    : source.kind;

export const decodeSource = (value: string): GearSource => {
  if (value === "ninjabike") return { kind: "ninjabike" };
  const [kind, ...rest] = value.split(":");
  const id = rest.join(":");
  if (kind === "brand" && id) return { kind: "brand", id };
  if (kind === "gearSet" && id) return { kind: "gearSet", id };
  return { kind: "empty" };
};

const RARITY_FOR: Record<Exclude<GearSource["kind"], "empty">, Rarity> = {
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

export const setSkill = (
  loadout: Loadout,
  index: number,
  platformId: string,
  variant: string,
): Loadout => ({
  ...loadout,
  skills: loadout.skills.map((skill, i) =>
    i === index ? { platformId, variant } : skill,
  ),
});

export const setSpecialization = (
  loadout: Loadout,
  specializationId: string,
): Loadout => ({ ...loadout, specializationId });

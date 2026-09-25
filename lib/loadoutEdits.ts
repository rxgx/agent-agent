/**
 * Pure loadout edits.
 *
 * Every change a picker can make is a function from one Loadout to the next.
 * Keeping them here rather than inside the components means the interesting
 * behaviour — what survives a slot change, which choices the exotic rule
 * locks out — can be reasoned about without rendering anything.
 */

import { BRANDS_BY_ID } from "@/data/brands";
import { GEAR_SETS_BY_ID } from "@/data/gearSets";
import { GEAR_ITEMS, GEAR_ITEMS_BY_ID, WEAPONS, WEAPONS_BY_ID } from "@/data/items";
import type {
  EquippedSkill,
  GearItemDef,
  GearPiece,
  GearSlot,
  Loadout,
  Weapon,
  WeaponDef,
  WeaponSlot,
} from "@/lib/types";

/* ---- gear ---------------------------------------------------------- */

/**
 * What a gear slot is filled with.
 *
 * `item` is a named or exotic piece from `data/items.ts`. `current` is a piece
 * that matches nothing in the data — hand-entered, or from an older data
 * version — offered only while it is equipped, so choosing it again leaves it
 * untouched.
 */
export type GearSource =
  | { readonly kind: "empty" }
  | { readonly kind: "brand"; readonly id: string }
  | { readonly kind: "gearSet"; readonly id: string }
  | { readonly kind: "item"; readonly id: string }
  | { readonly kind: "current" };

const findGearItem = (slot: GearSlot, name: string): GearItemDef | undefined =>
  GEAR_ITEMS.find((g) => g.slot === slot && g.name === name);

export const gearSourceOf = (piece: GearPiece | undefined): GearSource => {
  if (!piece) return { kind: "empty" };
  // A named piece also carries its brand, so match the item first.
  const item = piece.name ? findGearItem(piece.slot, piece.name) : undefined;
  if (item) return { kind: "item", id: item.id };
  if (piece.gearSetId) return { kind: "gearSet", id: piece.gearSetId };
  if (piece.brandId) return { kind: "brand", id: piece.brandId };
  if (piece.name) return { kind: "current" };
  return { kind: "empty" };
};

/** Serialised form, so a <select> can round-trip a source through its value. */
export const encodeGearSource = (source: GearSource): string =>
  source.kind === "empty" || source.kind === "current"
    ? source.kind
    : `${source.kind}:${source.id}`;

export const decodeGearSource = (value: string): GearSource => {
  if (value === "current") return { kind: "current" };
  const [kind, ...rest] = value.split(":");
  const id = rest.join(":");
  if (id && (kind === "brand" || kind === "gearSet" || kind === "item")) {
    return { kind, id };
  }
  return { kind: "empty" };
};

/**
 * Build the piece for a slot under a new source.
 *
 * Rolled attributes and the slotted mod carry over — a reroll is independent of
 * which brand the item came from, so dropping them on every change would be
 * both wrong and annoying. Item identity does not carry over: a named piece's
 * name and talent belong to that piece. The core attribute comes from the
 * brand, set or item, without a magnitude, because no source emits per-roll
 * values.
 */
const repieceSlot = (
  slot: GearSlot,
  source: GearSource,
  previous: GearPiece | undefined,
): GearPiece | undefined => {
  if (source.kind === "empty") return undefined;
  if (source.kind === "current") return previous;

  const carried = {
    ...(previous?.attributes ? { attributes: previous.attributes } : {}),
    ...(previous?.mod ? { mod: previous.mod } : {}),
  };

  if (source.kind === "item") {
    const item = GEAR_ITEMS_BY_ID.get(source.id);
    if (!item || item.slot !== slot) return previous;
    return {
      slot,
      name: item.name,
      rarity: item.rarity,
      ...(item.brandId ? { brandId: item.brandId } : {}),
      ...(item.core ? { core: { name: item.core } } : {}),
      ...(item.talent ? { talent: item.talent } : {}),
      ...(item.countsForAllSets ? { countsForAllSets: true } : {}),
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
    rarity: source.kind === "gearSet" ? "gearSet" : "highEnd",
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

/** The named and exotic pieces that can go in a slot. */
export const gearItemsFor = (slot: GearSlot): readonly GearItemDef[] =>
  GEAR_ITEMS.filter((g) => g.slot === slot);

/* ---- weapons ------------------------------------------------------- */

/** As with gear, `current` is an equipped weapon the data doesn't know. */
export type WeaponSource =
  | { readonly kind: "empty" }
  | { readonly kind: "weapon"; readonly id: string }
  | { readonly kind: "current" };

export const weaponSourceOf = (weapon: Weapon | undefined): WeaponSource => {
  if (!weapon) return { kind: "empty" };
  const def = WEAPONS.find((w) => w.name === weapon.name && w.type === weapon.type);
  return def ? { kind: "weapon", id: def.id } : { kind: "current" };
};

export const encodeWeaponSource = (source: WeaponSource): string =>
  source.kind === "weapon" ? `weapon:${source.id}` : source.kind;

export const decodeWeaponSource = (value: string): WeaponSource => {
  if (value === "current") return { kind: "current" };
  if (value.startsWith("weapon:")) return { kind: "weapon", id: value.slice(7) };
  return { kind: "empty" };
};

/** The game allows only pistols in the sidearm slot, and no pistols elsewhere. */
export const weaponsFor = (slot: WeaponSlot): readonly WeaponDef[] =>
  WEAPONS.filter((w) => (slot === "sidearm") === (w.type === "Pistol"));

/**
 * Swapping a weapon replaces the whole gun. Unlike gear, its rolls, damage and
 * mods belong to the weapon they were on, so none of them carry over.
 */
export const setWeaponSource = (
  loadout: Loadout,
  slot: WeaponSlot,
  source: WeaponSource,
): Loadout => {
  if (source.kind === "current") return loadout;
  const others = loadout.weapons.filter((w) => w.slot !== slot);
  if (source.kind === "empty") return { ...loadout, weapons: others };

  const def = WEAPONS_BY_ID.get(source.id);
  if (!def) return loadout;
  const weapon: Weapon = {
    slot,
    name: def.name,
    type: def.type,
    rarity: def.rarity,
    ...(def.talent ? { talent: def.talent } : {}),
  };
  return { ...loadout, weapons: [...others, weapon] };
};

/* ---- the exotic rule, as the pickers apply it --------------------- */

/**
 * Whether an exotic in another slot rules out choosing an exotic here. The
 * game refuses the second exotic outright, so the pickers do too — the
 * equipped exotic can always be swapped, just not joined.
 */
export const exoticWeaponElsewhere = (loadout: Loadout, slot: WeaponSlot) =>
  loadout.weapons.some((w) => w.slot !== slot && w.rarity === "exotic");

export const exoticGearElsewhere = (loadout: Loadout, slot: GearSlot) =>
  loadout.gear.some((g) => g.slot !== slot && g.rarity === "exotic");

/* ---- skills and specialization ------------------------------------ */

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

export const setName = (loadout: Loadout, name: string): Loadout => ({
  ...loadout,
  name,
});

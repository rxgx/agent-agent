// HAND-MAINTAINED — not generated. `scripts/build-data.mjs` does not write
// this file, and upstream (knowlesy/division-config) emits no named or exotic
// items, so they are entered here as curated builds need them.
//
// Named and exotic items: one specific piece with its own name, rather than a
// generic brand or gear set piece. Every named or exotic item in a curated
// build must be listed, which `lib/buildFormat.ts` checks, so a typo in a
// build file fails the build instead of rendering a piece that doesn't exist.
//
// Talent names only, as elsewhere. `talent: null` means not recorded yet, not
// that the item has none.

import type { NamedGear, NamedItem, NamedWeapon } from "@/lib/types";

export const NAMED_GEAR: readonly NamedGear[] = [
  { kind: "gear", name: "Iron Will", slot: "chest", rarity: "exotic", talent: "Resolved" },
  { kind: "gear", name: "Memento", slot: "backpack", rarity: "exotic", talent: "Kill Confirmed" },
  { kind: "gear", name: "NinjaBike Messenger Backpack", slot: "backpack", rarity: "exotic", talent: "Resourceful" },
  { kind: "gear", name: "Melon Baller", slot: "backpack", rarity: "named", talent: null },
  { kind: "gear", name: "Fox's Prayer", slot: "holster", rarity: "named", talent: "Perfectly Opportunistic" },
];

export const NAMED_WEAPONS: readonly NamedWeapon[] = [
  { kind: "weapon", name: "Prima Donna", type: "Marksman Rifle", rarity: "exotic", talent: null },
  { kind: "weapon", name: "St. Elmo's Engine", type: "Assault Rifle", rarity: "exotic", talent: "Actum Est" },
  { kind: "weapon", name: "The Grudge", type: "SMG", rarity: "named", talent: "Perfectly Vindictive" },
  { kind: "weapon", name: "Mozambique Special", type: "Pistol", rarity: "named", talent: "Perfect Breadbasket" },
];

/** Keyed by display name: builds refer to named items by the name they print. */
export const NAMED_ITEMS_BY_NAME: ReadonlyMap<string, NamedItem> = new Map(
  [...NAMED_GEAR, ...NAMED_WEAPONS].map((item) => [item.name, item]),
);

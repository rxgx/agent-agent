// GENERATED FILE — do not edit by hand.
// Run `node scripts/build-data.mjs` to regenerate.
//
// Weapon cores by type, and the 13 attributes a weapon can roll.
// Source: knowlesy/division-config (MIT), patch Y8S3 / TU30 / 2.34
// Generated upstream at 2026-08-29T17:29:12.927Z

import type { WeaponAttributeDef, WeaponType } from "@/lib/types";

/** Fixed by weapon type: its damage, then a second core (none on pistols). */
export const WEAPON_CORES: Readonly<Record<WeaponType, readonly WeaponAttributeDef[]>> = {
  "Assault Rifle": [{ name: "Assault Rifle Damage", max: "15%" }, { name: "Health Damage", max: "21%" }],
  "LMG": [{ name: "LMG Damage", max: "15%" }, { name: "Damage to Target out of Cover", max: "12%" }],
  "SMG": [{ name: "SMG Damage", max: "15%" }, { name: "Critical Hit Chance", max: "21%" }],
  "Shotgun": [{ name: "Shotgun Damage", max: "15%" }, { name: "Damage to Armor", max: "12%" }],
  "Rifle": [{ name: "Rifle Damage", max: "15%" }, { name: "Critical Hit Damage", max: "17%" }],
  "Marksman Rifle": [{ name: "Marksman Rifle Damage", max: "15%" }, { name: "Headshot Damage", max: "111%" }],
  "Pistol": [{ name: "Pistol Damage", max: "15%" }],
};

/** The third attribute: one roll from this list. */
export const WEAPON_ATTRIBUTES: readonly WeaponAttributeDef[] = [
  { name: "Damage to Armor", max: "6%" },
  { name: "Critical Hit Chance", max: "9.5%" },
  { name: "Health Damage", max: "9.5%" },
  { name: "Damage to Target out of Cover", max: "10%" },
  { name: "Headshot Damage", max: "10%" },
  { name: "Critical Hit Damage", max: "10%" },
  { name: "Reload Speed", max: "12%" },
  { name: "Stability", max: "12%" },
  { name: "Accuracy", max: "12%" },
  { name: "Optimal Range", max: "24%" },
  { name: "Magazine Size", max: "12.5%" },
  { name: "Rate of Fire", max: "5%" },
  { name: "Swap Speed", max: "15%" },
];

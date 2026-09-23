/**
 * Equip restrictions the game enforces that are not set bonuses.
 *
 * The Division 2 allows one exotic weapon and one exotic armor piece at a
 * time — not two of either, even across different weapon classes. An exotic
 * pistol and an exotic assault rifle together is still illegal.
 *
 * These return violations rather than throwing, so the view can show an
 * illegal loadout honestly instead of refusing to render it. Data entered by
 * hand, an import, or a future weapon picker can all produce one.
 */

import type { Loadout } from "@/lib/types";

export type EquipRule = "oneExoticWeapon" | "oneExoticGear";

export interface RuleViolation {
  readonly rule: EquipRule;
  readonly limit: number;
  /** Singular noun for the restricted thing, e.g. "exotic weapon". */
  readonly subject: string;
  /** Display names of every item counted against the limit. */
  readonly equipped: readonly string[];
}

const EXOTIC_LIMIT = 1;

export const findViolations = (loadout: Loadout): RuleViolation[] => {
  const violations: RuleViolation[] = [];

  const exoticWeapons = loadout.weapons
    .filter((w) => w.rarity === "exotic")
    .map((w) => w.name);
  if (exoticWeapons.length > EXOTIC_LIMIT) {
    violations.push({
      rule: "oneExoticWeapon",
      limit: EXOTIC_LIMIT,
      subject: "exotic weapon",
      equipped: exoticWeapons,
    });
  }

  const exoticGear = loadout.gear
    .filter((g) => g.rarity === "exotic")
    .map((g) => g.name ?? g.slot);
  if (exoticGear.length > EXOTIC_LIMIT) {
    violations.push({
      rule: "oneExoticGear",
      limit: EXOTIC_LIMIT,
      subject: "exotic armor piece",
      equipped: exoticGear,
    });
  }

  return violations;
};

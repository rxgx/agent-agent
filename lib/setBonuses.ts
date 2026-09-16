import { BRANDS_BY_ID } from "@/data/brands";
import { GEAR_SETS_BY_ID } from "@/data/gearSets";
import type { GearPiece, Loadout } from "@/lib/types";

/**
 * A bonus tier and whether the equipped piece count has reached it.
 * Locked tiers are still returned so the view can show what the next piece buys.
 */
export interface BonusTier {
  readonly piecesRequired: number;
  readonly active: boolean;
  readonly effects: readonly string[];
}

export interface ActiveSet {
  readonly id: string;
  readonly name: string;
  readonly kind: "brand" | "gearSet";
  /** Pieces physically equipped, excluding any wildcard contribution. */
  readonly equipped: number;
  /** Pieces counted toward bonuses, including wildcards such as NinjaBike. */
  readonly counted: number;
  readonly tiers: readonly BonusTier[];
  /** Item-bound talent names (gear set chest and backpack). The 4-piece
   *  talent is not repeated here — it is the 4-piece tier. */
  readonly talents: readonly string[];
}

/**
 * The NinjaBike Messenger Backpack's "Resourceful" talent slots into any
 * equipped gear set and/or brand set item to fulfil a requirement toward
 * unlocking that set's bonus, and can unlock bonuses from multiple sets
 * simultaneously.
 *
 * It contributes to every set that already has at least one real piece
 * equipped — it cannot conjure a set out of nothing, and it does not stack
 * with itself.
 */
const isWildcard = (piece: GearPiece): boolean =>
  piece.countsForAllSets === true;

interface Counts {
  readonly real: Map<string, number>;
  /** Set ids each wildcard already belongs to, so it is never counted twice. */
  readonly wildcardOwnSets: readonly (string | undefined)[];
}

const tally = (
  gear: readonly GearPiece[],
  key: (piece: GearPiece) => string | undefined,
): Counts => {
  const real = new Map<string, number>();
  const wildcardOwnSets: (string | undefined)[] = [];

  for (const piece of gear) {
    const id = key(piece);
    if (isWildcard(piece)) wildcardOwnSets.push(id);
    if (!id) continue;
    real.set(id, (real.get(id) ?? 0) + 1);
  }

  return { real, wildcardOwnSets };
};

/**
 * How much the wildcards add to one set. A wildcard that is itself a piece of
 * that set is already in the real count, so it must not be added again.
 */
const wildcardBonus = (
  { wildcardOwnSets }: Counts,
  setId: string,
): number => wildcardOwnSets.filter((own) => own !== setId).length;

const brandTiers = (
  bonuses: readonly (string | null)[],
  counted: number,
): BonusTier[] =>
  bonuses.map((effect, index) => ({
    piecesRequired: index + 1,
    active: counted >= index + 1,
    effects: effect ? [effect] : [],
  }));

/** Sorted most-complete first, then alphabetically, so the view is stable. */
const byCompleteness = (a: ActiveSet, b: ActiveSet): number =>
  b.counted - a.counted || a.name.localeCompare(b.name);

export const resolveBrandSets = (loadout: Loadout): ActiveSet[] => {
  const counts = tally(loadout.gear, (p) => p.brandId);
  const sets: ActiveSet[] = [];

  for (const [id, equipped] of counts.real) {
    const brand = BRANDS_BY_ID.get(id);
    if (!brand) continue;
    const counted = Math.min(equipped + wildcardBonus(counts, id), 3);
    sets.push({
      id,
      name: brand.name,
      kind: "brand",
      equipped,
      counted,
      tiers: brandTiers(brand.bonuses, counted),
      talents: [],
    });
  }

  return sets.sort(byCompleteness);
};

export const resolveGearSets = (loadout: Loadout): ActiveSet[] => {
  const counts = tally(loadout.gear, (p) => p.gearSetId);
  const sets: ActiveSet[] = [];

  for (const [id, equipped] of counts.real) {
    const set = GEAR_SETS_BY_ID.get(id);
    if (!set) continue;
    const counted = Math.min(equipped + wildcardBonus(counts, id), 4);

    // Only item-bound talents go here. The 4-piece talent is already shown as
    // the 4-piece tier, so repeating it would print the same name twice.
    // Chest and backpack talents apply only when that slot is a piece of
    // this set, which no piece count can express.
    const talents: string[] = [];
    for (const piece of loadout.gear) {
      if (piece.gearSetId !== id) continue;
      if (piece.slot === "chest" && set.chestTalent) talents.push(set.chestTalent);
      if (piece.slot === "backpack" && set.backpackTalent) {
        talents.push(set.backpackTalent);
      }
    }

    sets.push({
      id,
      name: set.name,
      kind: "gearSet",
      equipped,
      counted,
      tiers: [
        { piecesRequired: 2, active: counted >= 2, effects: set.bonus2pc },
        { piecesRequired: 3, active: counted >= 3, effects: set.bonus3pc },
        {
          piecesRequired: 4,
          active: counted >= 4,
          effects: set.talent4pc ? [set.talent4pc] : [],
        },
      ],
      talents,
    });
  }

  return sets.sort(byCompleteness);
};

export const resolveSets = (loadout: Loadout): ActiveSet[] => [
  ...resolveGearSets(loadout),
  ...resolveBrandSets(loadout),
];

/** True when any equipped piece is a wildcard, so the view can footnote the counts. */
export const hasWildcard = (loadout: Loadout): boolean =>
  loadout.gear.some(isWildcard);

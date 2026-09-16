/**
 * Loadout schema.
 *
 * Deliberately shaped as the target for an import layer rather than for this
 * view: every field a picker or an OCR pass would eventually write exists here,
 * even where the static sample leaves it undefined. Optional means "not
 * captured yet", not "not applicable".
 */

/** Rarity drives the 3px left-edge stripe, the only place color carries meaning. */
export type Rarity =
  | "standard"
  | "specialized"
  | "superior"
  | "highEnd"
  | "gearSet"
  | "named"
  | "exotic";

export type GearSlot =
  | "mask"
  | "backpack"
  | "chest"
  | "gloves"
  | "holster"
  | "kneepads";

export type WeaponSlot = "primary" | "secondary" | "sidearm";

export type WeaponType =
  | "Assault Rifle"
  | "SMG"
  | "LMG"
  | "Rifle"
  | "Marksman Rifle"
  | "Shotgun"
  | "Pistol";

/** A rolled attribute. `value` is absent until magnitudes are captured. */
export interface Attribute {
  readonly name: string;
  readonly value?: string;
}

export interface GearPiece {
  readonly slot: GearSlot;
  /** Named and exotic items have their own name; generic ones fall back to the brand. */
  readonly name?: string;
  readonly rarity: Rarity;
  /** Mutually exclusive with `gearSetId` in practice — a piece belongs to one or the other. */
  readonly brandId?: string;
  readonly gearSetId?: string;
  readonly core?: Attribute;
  readonly attributes?: readonly Attribute[];
  /** Talent name only. Descriptions change every title update. */
  readonly talent?: string;
  readonly mod?: string;
  /**
   * Set to true for the NinjaBike Messenger Backpack, whose "Resourceful"
   * talent counts it toward every equipped gear and brand set at once.
   */
  readonly countsForAllSets?: boolean;
}

export interface Weapon {
  readonly slot: WeaponSlot;
  readonly name: string;
  readonly type: WeaponType;
  readonly rarity: Rarity;
  readonly damage?: string;
  readonly talent?: string;
  readonly attributes?: readonly Attribute[];
  readonly mods?: readonly string[];
}

export interface EquippedSkill {
  readonly platformId: string;
  readonly variant: string;
}

export interface Loadout {
  readonly name: string;
  readonly agent?: string;
  readonly watchLevel?: number;
  readonly specializationId: string;
  readonly skillTier?: number;
  readonly gear: readonly GearPiece[];
  readonly weapons: readonly Weapon[];
  readonly skills: readonly EquippedSkill[];
  readonly notes?: string;
}

/* ---- reference data, shaped by scripts/build-data.mjs ---- */

export interface Brand {
  readonly id: string;
  readonly name: string;
  readonly coreAttribute: string | null;
  /** Index 0 is the 1-piece bonus, 1 the 2-piece, 2 the 3-piece. */
  readonly bonuses: readonly (string | null)[];
}

export interface GearSet {
  readonly id: string;
  readonly name: string;
  readonly coreAttribute: string | null;
  readonly bonus2pc: readonly string[];
  readonly bonus3pc: readonly string[];
  readonly talent4pc: string | null;
  readonly chestTalent: string | null;
  readonly backpackTalent: string | null;
}

export interface SkillPlatform {
  readonly id: string;
  readonly name: string;
  readonly variants: readonly string[];
}

export interface Specialization {
  readonly id: string;
  readonly name: string;
  readonly passives: readonly string[];
}

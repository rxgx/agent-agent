/**
 * The on-disk format for a build: curated builds in `data/builds/`, and later
 * builds saved in the browser or imported from a file.
 *
 * One format for all of them, so a build made in the editor and exported is
 * already a valid curated build. `version` lets an old saved build be migrated
 * rather than rejected when the format changes.
 *
 * JSON is not checked by the TypeScript compiler the way a `.ts` file is, so
 * every build is parsed here. Parsing also checks references against `data/`:
 * a brand or gear set id that a data regeneration removed is an error, not a
 * silently empty slot.
 */

import { BRANDS_BY_ID } from "@/data/brands";
import { GEAR_SETS_BY_ID } from "@/data/gearSets";
import { NAMED_ITEMS_BY_NAME } from "@/data/items";
import { SKILL_PLATFORMS_BY_ID, SPECIALIZATIONS_BY_ID } from "@/data/skills";
import type {
  Attribute,
  EquippedSkill,
  GearPiece,
  GearSlot,
  Loadout,
  NamedItem,
  Rarity,
  Weapon,
  WeaponSlot,
  WeaponType,
} from "@/lib/types";

export const BUILD_FORMAT_VERSION = 1;

export interface BuildSource {
  readonly label: string;
  readonly url: string;
}

export interface BuildFile {
  readonly version: typeof BUILD_FORMAT_VERSION;
  /** URL slug: the build is served at `/builds/<id>`. */
  readonly id: string;
  /** Where a curated build was transcribed from. */
  readonly source?: BuildSource;
  readonly loadout: Loadout;
}

export type ParseResult =
  | { readonly ok: true; readonly build: BuildFile }
  | { readonly ok: false; readonly errors: readonly string[] };

const RARITIES: readonly Rarity[] = [
  "standard", "specialized", "superior", "highEnd", "gearSet", "named", "exotic",
];
const GEAR_SLOTS: readonly GearSlot[] = [
  "mask", "backpack", "chest", "gloves", "holster", "kneepads",
];
const WEAPON_SLOTS: readonly WeaponSlot[] = ["primary", "secondary", "sidearm"];
const WEAPON_TYPES: readonly WeaponType[] = [
  "Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol",
];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const oneOf = <T extends string>(allowed: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v);

/**
 * Collects every problem rather than stopping at the first, so fixing a
 * hand-edited file is one round trip, not one per mistake.
 */
export const parseBuildFile = (raw: unknown): ParseResult => {
  const errors: string[] = [];
  const fail = (path: string, msg: string) => errors.push(`${path}: ${msg}`);

  const str = (obj: Json, key: string, path: string, required = true) => {
    const v = obj[key];
    if (v === undefined && !required) return undefined;
    if (typeof v !== "string" || v.trim() === "") {
      fail(`${path}.${key}`, "must be a non-empty string");
      return undefined;
    }
    return v;
  };

  const attribute = (v: unknown, path: string): Attribute | undefined => {
    if (!isObject(v)) return void fail(path, "must be an object");
    const name = str(v, "name", path);
    const value = str(v, "value", path, false);
    return name ? { name, ...(value ? { value } : {}) } : undefined;
  };

  const attributes = (v: unknown, path: string) => {
    if (v === undefined) return undefined;
    if (!Array.isArray(v)) return void fail(path, "must be an array");
    return v
      .map((a, i) => attribute(a, `${path}[${i}]`))
      .filter((a): a is Attribute => a !== undefined);
  };

  if (!isObject(raw)) return { ok: false, errors: ["build: must be an object"] };

  if (raw.version !== BUILD_FORMAT_VERSION) {
    fail("version", `must be ${BUILD_FORMAT_VERSION}`);
  }

  const id = str(raw, "id", "build");
  if (id && !SLUG.test(id)) fail("id", "must be a lowercase-hyphenated slug");

  let source: BuildSource | undefined;
  if (raw.source !== undefined) {
    if (!isObject(raw.source)) fail("source", "must be an object");
    else {
      const label = str(raw.source, "label", "source");
      const url = str(raw.source, "url", "source");
      if (url && !/^https?:\/\//.test(url)) fail("source.url", "must be http(s)");
      if (label && url) source = { label, url };
    }
  }

  const l = raw.loadout;
  if (!isObject(l)) {
    fail("loadout", "must be an object");
    return { ok: false, errors };
  }

  const name = str(l, "name", "loadout");

  const specializationId = str(l, "specializationId", "loadout", false);
  if (specializationId && !SPECIALIZATIONS_BY_ID.has(specializationId)) {
    fail("loadout.specializationId", `unknown specialization "${specializationId}"`);
  }

  /**
   * A named or exotic item must be in `data/items.ts`, in the right slot or
   * weapon class, with the talent recorded there. Generic pieces are checked
   * against their brand or gear set instead.
   */
  const namedItem = (
    path: string,
    rarity: Rarity,
    itemName: string | undefined,
    talent: string | undefined,
    matches: (item: NamedItem) => string | undefined,
  ) => {
    if (!itemName || (rarity !== "named" && rarity !== "exotic")) return;
    const item = NAMED_ITEMS_BY_NAME.get(itemName);
    if (!item) return fail(`${path}.name`, `unknown ${rarity} item "${itemName}" — add it to data/items.ts`);
    if (item.rarity !== rarity) fail(`${path}.rarity`, `"${itemName}" is ${item.rarity}`);
    const mismatch = matches(item);
    if (mismatch) fail(path, mismatch);
    if (talent && item.talent && talent !== item.talent) {
      fail(`${path}.talent`, `"${itemName}" has talent "${item.talent}"`);
    }
  };

  const alternatesOf = <T,>(
    v: unknown,
    path: string,
    nested: boolean,
    parse: (a: unknown, path: string) => T | undefined,
  ): T[] | undefined => {
    if (v === undefined) return undefined;
    if (nested) return void fail(path, "an alternate cannot have alternates");
    if (!Array.isArray(v) || v.length === 0) return void fail(path, "must be a non-empty array");
    return v
      .map((a, i) => parse(a, `${path}[${i}]`))
      .filter((a): a is T => a !== undefined);
  };

  const gearPiece = (
    g: unknown,
    path: string,
    slot?: GearSlot,
  ): GearPiece | undefined => {
    if (!isObject(g)) return void fail(path, "must be an object");
    if (!oneOf(GEAR_SLOTS, g.slot)) return void fail(`${path}.slot`, `must be one of ${GEAR_SLOTS.join(", ")}`);
    if (slot && g.slot !== slot) fail(`${path}.slot`, `an alternate must be for the same slot, "${slot}"`);
    if (!oneOf(RARITIES, g.rarity)) fail(`${path}.rarity`, `must be one of ${RARITIES.join(", ")}`);

    const brandId = str(g, "brandId", path, false);
    const gearSetId = str(g, "gearSetId", path, false);
    if (brandId && !BRANDS_BY_ID.has(brandId)) fail(`${path}.brandId`, `unknown brand "${brandId}"`);
    if (gearSetId && !GEAR_SETS_BY_ID.has(gearSetId)) fail(`${path}.gearSetId`, `unknown gear set "${gearSetId}"`);
    if (brandId && gearSetId) fail(path, "a piece belongs to a brand or a gear set, not both");

    const itemName = str(g, "name", path, false);
    if (!brandId && !gearSetId && !itemName) {
      fail(path, "needs a brandId, a gearSetId, or an item name");
    }

    const core = g.core === undefined ? undefined : attribute(g.core, `${path}.core`);
    const talent = str(g, "talent", path, false);
    const mod = str(g, "mod", path, false);
    if (g.countsForAllSets !== undefined && typeof g.countsForAllSets !== "boolean") {
      fail(`${path}.countsForAllSets`, "must be a boolean");
    }
    if (oneOf(RARITIES, g.rarity)) {
      namedItem(path, g.rarity, itemName, talent, (item) =>
        item.kind !== "gear"
          ? `"${item.name}" is a weapon`
          : item.slot !== g.slot
            ? `"${item.name}" is a ${item.slot} piece`
            : undefined,
      );
    }
    const alternates = alternatesOf(g.alternates, `${path}.alternates`, slot !== undefined, (a, p) =>
      gearPiece(a, p, g.slot as GearSlot),
    );

    if (!oneOf(RARITIES, g.rarity)) return undefined;
    return {
      slot: g.slot,
      rarity: g.rarity,
      ...(itemName ? { name: itemName } : {}),
      ...(brandId ? { brandId } : {}),
      ...(gearSetId ? { gearSetId } : {}),
      ...(core ? { core } : {}),
      ...(g.attributes !== undefined ? { attributes: attributes(g.attributes, `${path}.attributes`) } : {}),
      ...(talent ? { talent } : {}),
      ...(mod ? { mod } : {}),
      ...(g.countsForAllSets === true ? { countsForAllSets: true } : {}),
      ...(alternates ? { alternates } : {}),
    };
  };

  const weapon = (
    w: unknown,
    path: string,
    slot?: WeaponSlot,
  ): Weapon | undefined => {
    if (!isObject(w)) return void fail(path, "must be an object");
    if (!oneOf(WEAPON_SLOTS, w.slot)) return void fail(`${path}.slot`, `must be one of ${WEAPON_SLOTS.join(", ")}`);
    if (slot && w.slot !== slot) fail(`${path}.slot`, `an alternate must be for the same slot, "${slot}"`);
    const wName = str(w, "name", path);
    if (!oneOf(WEAPON_TYPES, w.type)) fail(`${path}.type`, `must be one of ${WEAPON_TYPES.join(", ")}`);
    if (!oneOf(RARITIES, w.rarity)) fail(`${path}.rarity`, `must be one of ${RARITIES.join(", ")}`);
    const damage = str(w, "damage", path, false);
    const talent = str(w, "talent", path, false);
    let mods: string[] | undefined;
    if (w.mods !== undefined) {
      if (!Array.isArray(w.mods) || !w.mods.every((m) => typeof m === "string")) {
        fail(`${path}.mods`, "must be an array of strings");
      } else mods = w.mods;
    }
    if (oneOf(RARITIES, w.rarity)) {
      namedItem(path, w.rarity, wName, talent, (item) =>
        item.kind !== "weapon"
          ? `"${item.name}" is a gear piece`
          : item.type !== w.type
            ? `"${item.name}" is a ${item.type}`
            : undefined,
      );
    }
    const alternates = alternatesOf(w.alternates, `${path}.alternates`, slot !== undefined, (a, p) =>
      weapon(a, p, w.slot as WeaponSlot),
    );

    if (!wName || !oneOf(WEAPON_TYPES, w.type) || !oneOf(RARITIES, w.rarity)) return undefined;
    return {
      slot: w.slot,
      name: wName,
      type: w.type,
      rarity: w.rarity,
      ...(damage ? { damage } : {}),
      ...(talent ? { talent } : {}),
      ...(w.attributes !== undefined ? { attributes: attributes(w.attributes, `${path}.attributes`) } : {}),
      ...(mods ? { mods } : {}),
      ...(alternates ? { alternates } : {}),
    };
  };

  const gear: GearPiece[] = [];
  if (!Array.isArray(l.gear)) fail("loadout.gear", "must be an array");
  else {
    const seen = new Set<string>();
    l.gear.forEach((g, i) => {
      const piece = gearPiece(g, `loadout.gear[${i}]`);
      if (!piece) return;
      if (seen.has(piece.slot)) fail(`loadout.gear[${i}].slot`, `"${piece.slot}" appears twice`);
      seen.add(piece.slot);
      gear.push(piece);
    });
  }

  const weapons: Weapon[] = [];
  if (!Array.isArray(l.weapons)) fail("loadout.weapons", "must be an array");
  else {
    const seen = new Set<string>();
    l.weapons.forEach((w, i) => {
      const parsed = weapon(w, `loadout.weapons[${i}]`);
      if (!parsed) return;
      if (seen.has(parsed.slot)) fail(`loadout.weapons[${i}].slot`, `"${parsed.slot}" appears twice`);
      seen.add(parsed.slot);
      weapons.push(parsed);
    });
  }

  const skills: EquippedSkill[] = [];
  if (!Array.isArray(l.skills)) fail("loadout.skills", "must be an array");
  else {
    if (l.skills.length > 2) fail("loadout.skills", "at most 2 skills can be equipped");
    l.skills.forEach((s, i) => {
      const path = `loadout.skills[${i}]`;
      if (!isObject(s)) return fail(path, "must be an object");
      const platformId = str(s, "platformId", path);
      const variant = str(s, "variant", path);
      const platform = platformId ? SKILL_PLATFORMS_BY_ID.get(platformId) : undefined;
      if (platformId && !platform) fail(`${path}.platformId`, `unknown skill platform "${platformId}"`);
      if (platform && variant && !platform.variants.includes(variant)) {
        fail(`${path}.variant`, `"${variant}" is not a ${platform.name} variant`);
      }
      if (platformId && variant) skills.push({ platformId, variant });
    });
  }

  const optionalNumber = (key: "watchLevel" | "skillTier") => {
    const v = l[key];
    if (v === undefined) return undefined;
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
      fail(`loadout.${key}`, "must be a non-negative integer");
      return undefined;
    }
    return v;
  };
  const watchLevel = optionalNumber("watchLevel");
  const skillTier = optionalNumber("skillTier");
  const agent = str(l, "agent", "loadout", false);
  const notes = str(l, "notes", "loadout", false);

  if (errors.length > 0 || !id || !name) {
    return { ok: false, errors: errors.length > 0 ? errors : ["build: incomplete"] };
  }

  return {
    ok: true,
    build: {
      version: BUILD_FORMAT_VERSION,
      id,
      ...(source ? { source } : {}),
      loadout: {
        name,
        ...(agent ? { agent } : {}),
        ...(watchLevel !== undefined ? { watchLevel } : {}),
        ...(specializationId ? { specializationId } : {}),
        ...(skillTier !== undefined ? { skillTier } : {}),
        gear,
        weapons,
        skills,
        ...(notes ? { notes } : {}),
      },
    },
  };
};

/** A build as it would be saved to `data/builds/<id>.json`. */
export const serializeBuild = (build: BuildFile): string =>
  `${JSON.stringify(build, null, 2)}\n`;

/** Turns a loadout name into a slug usable as a build id. */
export const slugify = (name: string): string =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "build";

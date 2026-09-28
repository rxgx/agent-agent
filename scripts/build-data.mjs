/**
 * Regenerates `data/brands.ts`, `data/gearSets.ts`, `data/skills.ts`,
 * `data/items.ts` and `data/weaponAttributes.ts` from
 * knowlesy/division-config, an MIT-licensed pipeline that extracts, patches and
 * validates the community build spreadsheet.
 *
 * Handoff step 3 calls for replacing hand-entered data with a generated
 * pipeline. This is the thin version of that: fetch upstream's emitted JSON and
 * narrow it to what the view actually renders. No values are typed by hand, so
 * a title update is a re-run rather than a re-read of a guide.
 *
 *   node scripts/build-data.mjs
 *
 * Upstream: https://github.com/knowlesy/division-config (MIT)
 * Spreadsheet authors: Azurmen, Bend3n, Gingerbeard_x, Maplestruck, Saint Landwalker
 */
import { writeFile } from "node:fs/promises";

const BASE =
  "https://raw.githubusercontent.com/knowlesy/division-config/main/data";

const get = async (name) => {
  const res = await fetch(`${BASE}/${name}.json`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res.json();
};

/** Upstream strings carry spreadsheet line breaks and doubled spaces. */
const clean = (s) =>
  typeof s === "string" ? s.replace(/\s+/g, " ").trim() : null;

/** Talent names only — see handoff: descriptions belong behind a data pipeline. */
const talentName = (s) => {
  const firstLine = clean((s ?? "").split("\n")[0]);
  const first = firstLine.split(":")[0].trim();
  return first || null;
};

const q = (s) => (s === null || s === undefined ? "null" : JSON.stringify(s));

const header = (meta, what) => `// GENERATED FILE — do not edit by hand.
// Run \`node scripts/build-data.mjs\` to regenerate.
//
// ${what}
// Source: knowlesy/division-config (MIT), patch ${meta.patch}
// Generated upstream at ${meta.generatedAt}
`;

const main = async () => {
  const [
    meta,
    brandSets,
    gearSets,
    skills,
    specs,
    gearNamed,
    weaponsBase,
    weaponsNamed,
    attributes,
  ] = await Promise.all([
    get("meta"),
    get("brand-sets"),
    get("gear-sets"),
    get("skills"),
    get("specializations"),
    get("gear-named"),
    get("weapons"),
    get("weapons-named"),
    get("attributes"),
  ]);

  // ---- brands ----------------------------------------------------------
  const brands = brandSets.map((b) => ({
    id: b.id,
    name: clean(b.name),
    coreAttribute: clean(b.coreAttribute),
    bonuses: [b.bonus1pcRaw, b.bonus2pcRaw, b.bonus3pcRaw].map(clean),
  }));

  await writeFile(
    "data/brands.ts",
    `${header(meta, `${brands.length} brand sets with their 1/2/3-piece bonuses.`)}
import type { Brand } from "@/lib/types";

export const BRANDS: readonly Brand[] = [
${brands
  .map(
    (b) => `  {
    id: ${q(b.id)},
    name: ${q(b.name)},
    coreAttribute: ${q(b.coreAttribute)},
    bonuses: [${b.bonuses.map(q).join(", ")}],
  },`,
  )
  .join("\n")}
];

export const BRANDS_BY_ID: ReadonlyMap<string, Brand> = new Map(
  BRANDS.map((b) => [b.id, b]),
);
`,
  );

  // ---- gear sets -------------------------------------------------------
  const sets = gearSets.map((g) => ({
    id: g.id,
    name: clean(g.name),
    coreAttribute: clean(g.coreAttribute),
    bonus2pc: (g.bonuses2pc ?? []).map((x) => clean(x.raw)).filter(Boolean),
    bonus3pc: (g.bonuses3pc ?? []).map((x) => clean(x.raw)).filter(Boolean),
    talent4pc: talentName(g.talent4pc),
    chestTalent: talentName(g.chestTalent),
    backpackTalent: talentName(g.backpackTalent),
  }));

  await writeFile(
    "data/gearSets.ts",
    `${header(meta, `${sets.length} gear sets: 2/3-piece bonuses plus 4-piece, chest and backpack talent names.`)}
import type { GearSet } from "@/lib/types";

export const GEAR_SETS: readonly GearSet[] = [
${sets
  .map(
    (g) => `  {
    id: ${q(g.id)},
    name: ${q(g.name)},
    coreAttribute: ${q(g.coreAttribute)},
    bonus2pc: [${g.bonus2pc.map(q).join(", ")}],
    bonus3pc: [${g.bonus3pc.map(q).join(", ")}],
    talent4pc: ${q(g.talent4pc)},
    chestTalent: ${q(g.chestTalent)},
    backpackTalent: ${q(g.backpackTalent)},
  },`,
  )
  .join("\n")}
];

export const GEAR_SETS_BY_ID: ReadonlyMap<string, GearSet> = new Map(
  GEAR_SETS.map((g) => [g.id, g]),
);
`,
  );

  // ---- skills + specializations ---------------------------------------
  // Upstream carries two junk rows: a bare "Skill" header and a duplicate
  // "Decoy". Drop anything without real variants, then de-duplicate by name.
  const seen = new Set();
  const platforms = [];
  for (const s of skills) {
    const name = clean(s.name);
    const variants = (s.variants ?? [])
      .map((v) => clean(v.name))
      .filter((v) => v && v !== name);
    if (!name || name === "Skill" || variants.length === 0) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    platforms.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, variants });
  }

  // Upstream uses two shapes: "Universal" carries a flat `passives` list, the
  // six real specializations carry a `nodes` tree. Names are all this view
  // needs, so flatten either into one list.
  const specializations = specs.map((s) => ({
    id: clean(s.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: clean(s.name),
    passives: [...(s.passives ?? []), ...(s.nodes ?? [])]
      .map((p) => clean(p.name))
      .filter(Boolean),
  }));

  await writeFile(
    "data/skills.ts",
    `${header(meta, `${platforms.length} skill platforms with variants, and ${specializations.length} specializations.`)}
import type { SkillPlatform, Specialization } from "@/lib/types";

export const SKILL_PLATFORMS: readonly SkillPlatform[] = [
${platforms
  .map(
    (p) => `  {
    id: ${q(p.id)},
    name: ${q(p.name)},
    variants: [${p.variants.map(q).join(", ")}],
  },`,
  )
  .join("\n")}
];

export const SKILL_PLATFORMS_BY_ID: ReadonlyMap<string, SkillPlatform> = new Map(
  SKILL_PLATFORMS.map((p) => [p.id, p]),
);

export const SPECIALIZATIONS: readonly Specialization[] = [
${specializations
  .map(
    (s) => `  {
    id: ${q(s.id)},
    name: ${q(s.name)},
    passives: [${s.passives.map(q).join(", ")}],
  },`,
  )
  .join("\n")}
];

export const SPECIALIZATIONS_BY_ID: ReadonlyMap<string, Specialization> = new Map(
  SPECIALIZATIONS.map((s) => [s.id, s]),
);
`,
  );


  // ---- items: weapons, and named and exotic gear -----------------------
  // Upstream spells weapon categories several ways ("ASSAULT RIFLES",
  // "Submachine Guns", "SMG"); fold them onto the view's WeaponType union.
  const WEAPON_TYPE = {
    "assault rifle": "Assault Rifle",
    "light machine gun": "LMG",
    lmg: "LMG",
    "submachine gun": "SMG",
    smg: "SMG",
    shotgun: "Shotgun",
    rifle: "Rifle",
    "marksman rifle": "Marksman Rifle",
    mmr: "Marksman Rifle",
    pistol: "Pistol",
  };
  const weaponType = (category) => {
    const key = clean(category)?.toLowerCase().replace(/s$/, "");
    const type = WEAPON_TYPE[key];
    if (!type) throw new Error(`unknown weapon category "${category}"`);
    return type;
  };

  const GEAR_SLOT = {
    mask: "mask",
    backpack: "backpack",
    chest: "chest",
    gloves: "gloves",
    holster: "holster",
    knees: "kneepads",
  };

  // Named pieces name their brand in prose, not by id, and not always as the
  // brand list spells it ("Golan Gear" for "Golan Gear Ltd"). Match on the
  // longest brand whose squashed name is a prefix of the other.
  // Accents are decomposed and dropped first, so "Česká" squashes to "ceska"
  // rather than losing the letter.
  const squash = (x) =>
    (clean(x) ?? "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const brandIdFor = (name) => {
    const n = squash(name);
    if (!n) return null;
    const hits = brands
      .map((b) => ({ id: b.id, key: squash(b.name) }))
      .filter((b) => b.key && (n.startsWith(b.key) || b.key.startsWith(n)))
      .sort((a, b) => b.key.length - a.key.length);
    return hits[0]?.id ?? null;
  };

  const titleCase = (x) =>
    x ? x.replace(/\b[a-z]/g, (c) => c.toUpperCase()) : null;

  const namedWeapons = weaponsNamed.map((w) => ({
    id: w.id,
    name: clean(w.name),
    type: weaponType(w.category),
    rarity: w.isExotic ? "exotic" : "named",
    talent: talentName(w.talentOrPerk),
  }));
  // weapons.json carries stats for named guns too; the named entry wins,
  // since it has the rarity and talent.
  const namedNames = new Set(namedWeapons.map((w) => w.name));
  const baseWeapons = weaponsBase
    .filter((w) => !namedNames.has(clean(w.name)))
    .map((w) => ({
      id: w.id,
      name: clean(w.name),
      type: weaponType(w.category),
      rarity: "highEnd",
      talent: null,
    }));
  const weapons = [...baseWeapons, ...namedWeapons].sort(
    (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
  );

  const unmatchedBrands = new Set();
  const gearItems = gearNamed.map((g) => {
    const slot = GEAR_SLOT[clean(g.slot)?.toLowerCase()];
    if (!slot) throw new Error(`unknown gear slot "${g.slot}" on ${g.id}`);
    const brandId = g.isExotic ? null : brandIdFor(g.brand);
    if (!g.isExotic && g.brand && !brandId) unmatchedBrands.add(clean(g.brand));
    const talent = talentName(g.talent);
    return {
      id: g.id,
      name: clean(g.name),
      slot,
      rarity: g.isExotic ? "exotic" : "named",
      brandId,
      core: titleCase(clean((g.coreAttribute ?? "").split("\n")[0])),
      talent,
      // NinjaBike's Resourceful counts toward every equipped set at once.
      countsForAllSets: talent === "Resourceful",
    };
  });

  for (const [label, list] of [["weapon", weapons], ["gear item", gearItems]]) {
    const seen = new Set();
    for (const x of list) {
      if (seen.has(x.id)) throw new Error(`duplicate ${label} id "${x.id}"`);
      seen.add(x.id);
    }
  }

  await writeFile(
    "data/items.ts",
    `${header(meta, `${weapons.length} weapons, and ${gearItems.length} named and exotic gear pieces.`)}
import type { GearItemDef, WeaponDef } from "@/lib/types";

export const WEAPONS: readonly WeaponDef[] = [
${weapons
  .map(
    (w) =>
      `  { id: ${q(w.id)}, name: ${q(w.name)}, type: ${q(w.type)}, rarity: ${q(w.rarity)}, talent: ${q(w.talent)} },`,
  )
  .join("\n")}
];

export const WEAPONS_BY_ID: ReadonlyMap<string, WeaponDef> = new Map(
  WEAPONS.map((w) => [w.id, w]),
);

export const GEAR_ITEMS: readonly GearItemDef[] = [
${gearItems
  .map(
    (g) =>
      `  { id: ${q(g.id)}, name: ${q(g.name)}, slot: ${q(g.slot)}, rarity: ${q(g.rarity)}, brandId: ${q(g.brandId)}, core: ${q(g.core)}, talent: ${q(g.talent)}, countsForAllSets: ${g.countsForAllSets} },`,
  )
  .join("\n")}
];

export const GEAR_ITEMS_BY_ID: ReadonlyMap<string, GearItemDef> = new Map(
  GEAR_ITEMS.map((g) => [g.id, g]),
);
`,
  );

  // ---- weapon attributes ------------------------------------------------
  // Every weapon rolls its type's damage, a second core fixed by its type
  // (pistols have none), and one attribute from a shared list. Upstream labels
  // cores "<type>:\n<attribute>" and abbreviates one attribute name.
  const ATTRIBUTE_NAME = {
    "dmg to target out of cover": "Damage to Target out of Cover",
  };
  const attributeName = (s) => ATTRIBUTE_NAME[clean(s).toLowerCase()] ?? clean(s);
  const attributeDef = (a, name) => ({ name, max: clean(a.rawMax) });

  let damageCore;
  const secondCores = new Map();
  for (const a of [...attributes.weaponCore, ...attributes.weaponSecondaryFixed]) {
    const [label, attr] = a.name.split("\n").map(clean);
    const scope = label.replace(/:$/, "");
    if (scope.toLowerCase() === "all weapons") damageCore = a;
    else secondCores.set(weaponType(scope), attr === "NA" ? null : attributeDef(a, attributeName(attr)));
  }
  if (!damageCore) throw new Error("no weapon damage core in attributes.json");
  const weaponCores = Object.fromEntries(
    [...new Set(Object.values(WEAPON_TYPE))].map((type) => {
      if (!secondCores.has(type)) throw new Error(`no second core for ${type}`);
      const second = secondCores.get(type);
      return [type, [attributeDef(damageCore, `${type} Damage`), ...(second ? [second] : [])]];
    }),
  );
  const weaponMinors = attributes.weaponMinors.map((a) => attributeDef(a, attributeName(a.name)));

  const attrLiteral = (a) => `{ name: ${q(a.name)}, max: ${q(a.max)} }`;
  await writeFile(
    "data/weaponAttributes.ts",
    `${header(meta, `Weapon cores by type, and the ${weaponMinors.length} attributes a weapon can roll.`)}
import type { WeaponAttributeDef, WeaponType } from "@/lib/types";

/** Fixed by weapon type: its damage, then a second core (none on pistols). */
export const WEAPON_CORES: Readonly<Record<WeaponType, readonly WeaponAttributeDef[]>> = {
${Object.entries(weaponCores)
  .map(([type, cores]) => `  ${q(type)}: [${cores.map(attrLiteral).join(", ")}],`)
  .join("\n")}
};

/** The third attribute: one roll from this list. */
export const WEAPON_ATTRIBUTES: readonly WeaponAttributeDef[] = [
${weaponMinors.map((a) => `  ${attrLiteral(a)},`).join("\n")}
];
`,
  );

  console.log(
    `patch ${meta.patch}: ${brands.length} brands, ${sets.length} gear sets, ` +
      `${platforms.length} skill platforms, ${specializations.length} specializations, ` +
      `${weapons.length} weapons, ${gearItems.length} named/exotic gear pieces, ` +
      `${weaponMinors.length} weapon attributes`,
  );
  if (unmatchedBrands.size > 0) {
    console.warn(`named gear with no matching brand: ${[...unmatchedBrands].join(", ")}`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Regenerates `data/brands.ts`, `data/gearSets.ts` and `data/skills.ts` from
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
  const first = clean((s ?? "").split("\n")[0]);
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
  const [meta, brandSets, gearSets, skills, specs] = await Promise.all([
    get("meta"),
    get("brand-sets"),
    get("gear-sets"),
    get("skills"),
    get("specializations"),
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

  console.log(
    `patch ${meta.patch}: ${brands.length} brands, ${sets.length} gear sets, ` +
      `${platforms.length} skill platforms, ${specializations.length} specializations`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

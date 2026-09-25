/**
 * The curated builds, in the order the picker lists them.
 *
 * To add one: build it in the editor, use "Copy JSON", save the result as
 * `data/builds/<id>.json`, and add it to the list below.
 *
 * Every build is parsed and checked against the equip rules when this module
 * loads, which happens during `next build`. A malformed file, a stale brand or
 * gear set id, or an illegal build (two exotic weapons, say) fails the build,
 * and so fails CI, instead of shipping.
 */

import { parseBuildFile, type BuildFile } from "@/lib/buildFormat";
import { findViolations } from "@/lib/equipRules";
import ninjabikeWildcardDemo from "./ninjabike-wildcard-demo.json";
import stElmosRedStriker from "./st-elmos-red-striker.json";

const FILES: ReadonlyArray<readonly [string, unknown]> = [
  ["st-elmos-red-striker.json", stElmosRedStriker],
  ["ninjabike-wildcard-demo.json", ninjabikeWildcardDemo],
];

const load = (): BuildFile[] => {
  const problems: string[] = [];
  const builds: BuildFile[] = [];
  const ids = new Set<string>();

  for (const [file, raw] of FILES) {
    const result = parseBuildFile(raw);
    if (!result.ok) {
      problems.push(...result.errors.map((e) => `${file}: ${e}`));
      continue;
    }
    const { build } = result;
    if (`${build.id}.json` !== file) {
      problems.push(`${file}: id "${build.id}" does not match its filename`);
    }
    if (ids.has(build.id)) problems.push(`${file}: duplicate id "${build.id}"`);
    ids.add(build.id);
    for (const v of findViolations(build.loadout)) {
      problems.push(
        `${file}: illegal build — only ${v.limit} ${v.subject} allowed, has ${v.equipped.length} (${v.equipped.join(", ")})`,
      );
    }
    builds.push(build);
  }

  if (problems.length > 0) {
    throw new Error(`Invalid curated builds:\n  ${problems.join("\n  ")}`);
  }
  return builds;
};

export const CURATED_BUILDS: readonly BuildFile[] = load();

/** Served at `/`. */
export const DEFAULT_BUILD: BuildFile = CURATED_BUILDS[0];

export const BUILDS_BY_ID: ReadonlyMap<string, BuildFile> = new Map(
  CURATED_BUILDS.map((b) => [b.id, b]),
);

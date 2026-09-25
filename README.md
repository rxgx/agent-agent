# Division 2 Character View

A read-only character screen for The Division 2 — equipped gear, weapons,
skills, specialization, and which set bonuses are live.

Next.js 15 App Router, React 19, TypeScript, plain CSS, no framework. Deploys
to Vercel with zero config.

```bash
npm install
npm run dev      # http://localhost:3000
```

## The constraint that shapes everything

**There is no Ubisoft inventory API.** Bungie exposes endpoints that let
Destiny Item Manager read your inventory and move items between characters and
vault; Ubisoft has no equivalent for Division 2. The only public API is
tracker.gg's, which serves career stats and player lookup — no items, no stash,
no transfers.

So the two features that define DIM are permanently off the table. Everything
here is hand-entered or, eventually, OCR'd from screenshots. Don't go looking
for an API; it does not exist. Reading game memory or injecting into the process
is a ToS and ban-risk problem — don't.

## Current state

Curated builds, editable, but nothing persists. Each build in `data/builds/`
has its own page at `/builds/<id>`, and `/` shows the first one. The toolbar's
**Edit** button switches the screen into edit mode: every gear, weapon and skill
card, the specialization panel and the build name show their controls at once,
on the cards themselves, and the set bonuses re-resolve live. **Done** switches
back. A reload restores the curated build.

```
app/layout.tsx                 fonts + html shell
app/page.tsx                   the default curated build
app/builds/[id]/page.tsx       one prerendered page per curated build
app/globals.css                all styling
components/LoadoutEditor.tsx   picker state, renders the screen below
components/LoadoutScreen.tsx   page composition
components/Slots.tsx           gear / weapon / skill cards
components/SlotControls.tsx    the selects shown inside a card while it is edited
data/brands.ts                 37 brand sets, 1/2/3-piece bonuses   (generated)
data/gearSets.ts               28 gear sets, 2/3-piece + talents    (generated)
data/skills.ts                 skill platforms, variants, specs     (generated)
data/items.ts                  390 weapons, 102 named/exotic gear   (generated)
data/builds/*.json             curated builds, one file each
data/builds/index.ts           build list; validates every build at build time
lib/types.ts                   loadout schema
lib/setBonuses.ts              piece counting and bonus unlocking
lib/loadoutEdits.ts            pure loadout transforms used by the pickers
lib/equipRules.ts              equip restrictions (one exotic weapon, one exotic armor)
lib/buildFormat.ts             build file format: parser, validator, serializer
lib/brandMarks.ts              generated monograms + tone classification
scripts/build-data.mjs         regenerates the three data files
```

## Data

The `data/*.ts` reference files are generated, not hand-entered:

```bash
node scripts/build-data.mjs
```

It pulls the emitted JSON from [knowlesy/division-config][kc] (MIT) — which does
extract → patch overlay → validate → emit from the community build spreadsheet —
and narrows it to the fields this view renders. Currently pinned to whatever
upstream's `main` holds; at time of writing that is patch **Y8S3 / TU30 / 2.34**.

A title update is therefore a re-run, not a re-read of a guide. Do not edit the
generated files by hand; change the script.

Upstream carries occasional spreadsheet typos in talent and passive names
(`Emegency Cleanse`, `Siganture`). These are reproduced faithfully rather than
silently patched — corrections belong upstream, or in a local overlay in the
script, so they survive the next regeneration.

[kc]: https://github.com/knowlesy/division-config

## Design decisions

- **Rarity is a 3px left-edge stripe**, not a border or background tint. It's
  the only place color carries meaning, so nothing competes with it. Named and
  exotic items also get the chevron watermark the game uses, drawn in CSS.
- **The angular corner cut** is a single `clip-path` on `.panel` and `.item` in
  `globals.css`. That's the whole visual signature; everything else stays flat.
  `--cut` controls it.
- **Talent names only, no talent text.** Full descriptions are long, change
  every title update, and belong behind a data pipeline rather than the view
  layer.
- **No icons.** There is no distributable icon set for this game. Extracted
  game textures are Ubisoft's IP and are not safe to ship in a public repo.
  Items are identified by rarity color, a core-attribute pip, and text. Tools
  that can extract assets exist (Hunter by dtzxporter, SnowplowCLI) but the
  output should not be committed.

## Identity marks

The real in-game brand logos are Ubisoft's, so `lib/brandMarks.ts` generates a
stand-in for each set: a monogram derived from the set's name, tinted by what
that set's own bonus lines actually do.

Each bonus line is scored against three vocabularies — offensive, defensive,
skill — and the set takes the majority. Skill phrases are matched first, so
`Skill Damage` and `Repair Skills` classify as skill rather than being caught by
the word "Damage". A line matching nothing abstains rather than voting, and a
tie breaks offensive.

Across all 65 sets (37 brands + 28 gear sets) this currently comes out
**33 offensive / 12 defensive / 20 skill**. `toneDistribution()` recomputes it,
which is the cheapest sanity check after a data regeneration.

Monograms are not unique — `Tip of the Spear` and `Tipping Scales` both give
`TS`. That is fine: a mark is always rendered next to the set's full name, so it
is decoration, never an identifier.

This lives in `lib/` rather than `data/` on purpose. `data/` is overwritten
wholesale by `scripts/build-data.mjs`, so anything stored alongside it would be
clobbered on the next run.

## Set bonus rules

`lib/setBonuses.ts` counts equipped pieces per brand and per gear set and marks
each tier active or locked. Two rules are worth knowing:

- The **NinjaBike Messenger Backpack**'s *Resourceful* talent fulfils a
  requirement toward every equipped gear **and** brand set simultaneously. A
  piece flagged `countsForAllSets` adds one to every set that already has a real
  piece equipped — it cannot start a set on its own, and it is never counted
  twice for a set it already belongs to. The view marks the contribution `+1`.
- **Chest and backpack gear set talents are item-bound, not count-bound.** They
  apply when that specific slot is a piece of the set, regardless of total
  pieces, so they are resolved per-slot rather than per-tier.

## Curated builds

A build is a JSON file in `data/builds/`, in the format defined by
`lib/buildFormat.ts`: a `version`, an `id` matching the filename, an optional
`source` it was transcribed from, and the loadout. Gear refers to brands and
gear sets by id, so a display-name change never breaks a build.

To add one:

1. Open any build, edit its slots in place, and give it a new name.
2. Use **Copy JSON**. A renamed build gets a new id and drops the original's
   source; an unrenamed one keeps both, so editing a curated build and copying
   it produces a replacement for that build's file.
3. Save the JSON as `data/builds/<id>.json`, add it to the list in
   `data/builds/index.ts`, and open a PR.

`data/builds/index.ts` parses every build and checks it against the equip rules
when it loads, which happens during `next build`. A malformed file, a brand or
gear set id that a data regeneration removed, a mismatched filename, or an
illegal build fails the build — and so CI — instead of shipping.

The same format is intended for builds saved in the browser and for JSON
import/export, so a build moves between all three without conversion.

## Equip rules

The game allows **one exotic weapon and one exotic armor piece** at a time —
not two of either, even across weapon classes, so an exotic pistol alongside an
exotic assault rifle is still illegal. `lib/equipRules.ts` reports violations
rather than throwing, and the screen shows an *Illegal loadout* banner, so a
bad import or hand-edited loadout is flagged instead of rendering as if valid.

The slot editors apply the same rule the way the game does: once an exotic
weapon or armor piece is equipped, the other exotics are disabled in the
remaining slots. The equipped exotic can still be swapped for another. The
sidearm slot offers only pistols, and the primary and secondary slots offer
everything else.

## Known gaps

- Attribute values (core magnitudes, secondary rolls) are hand-entered in the
  NinjaBike demo build. `lib/types.ts` has room for them; no source emits per-roll values.
- Expertise, Optimization, and Prototype state are absent entirely.
- Decoy, Trap, and Sticky Bomb variant names need verifying against the current
  title update — community sources disagree, and upstream lists only one Decoy
  variant. Everything above them in `data/skills.ts` is stable.
- Weapon damage figures in the NinjaBike demo build are illustrative, not rolled.
- Rolled attributes, mods and weapon talents on base (non-named) weapons are
  not editable; choosing an item sets its name, rarity, core and talent only.

- **St. Elmo's Red Striker is partly transcribed.** Its gear sources,
  weapons (including the Quickstep sidearm), exotics, skills (Crusader Shield
  and Decoy), Gunner specialization and playstyle notes are in; its rolled
  attributes, mods and chest talent are not yet. Those fields are left empty
  rather than guessed.
- Decoy has a single variant in the data, "Holographic Distraction". Its name
  is among the Decoy, Trap and Sticky Bomb variants still to verify.
- The NinjaBike Wildcard Demo is a demonstration of the wildcard rule, not a
  recommended build.

## Next steps, in order

1. Save personal builds to `localStorage`, plus JSON import/export, using the
   format in `lib/buildFormat.ts` — its parser already returns errors rather
   than throwing, for exactly this. Read
   `Division2-Loadout/ui` first — it solved exactly this and its README is
   honest about scope.
2. Cover `lib/setBonuses.ts`, `lib/loadoutEdits.ts` and `lib/brandMarks.ts` with
   tests and run them in CI. Now that pickers make every gear combination
   reachable, the bonus maths is exercised by inputs nobody hand-checked.
3. Pin `scripts/build-data.mjs` to an upstream commit or tag rather than `main`,
   and check the emitted files' diff on each bump.
4. Only then consider OCR of inventory screenshots. The item detail panel is
   high-contrast and structurally consistent, so it's tractable, and it's the
   genuinely novel contribution — nobody has built a Division 2 stash manager.

## Prior art worth reading

- `Division2-Loadout/ui` — closest to this project's scope
- `lesgloutonnes/TD2` — browser loadout planner, brands/sets/exotics/skills
- `knowlesy/division-config` — MIT, best data pipeline
- `faildruid/division-2-db` — item database
- `mxswat/mx-division-builds` — the flagship community builder, but CC BY-NC-SA
  4.0, so anything derived from it inherits non-commercial + share-alike. Avoid
  if you want a free hand.

## Legal

Not affiliated with, endorsed by, or sponsored by Ubisoft. Tom Clancy's The
Division 2 is a trademark of Ubisoft Entertainment. No game assets are
distributed in this repository.

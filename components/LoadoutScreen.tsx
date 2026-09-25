"use client";

import {
  GearSelect,
  SkillSelect,
  SpecializationSelect,
  WeaponAttributeSelect,
  WeaponSelect,
} from "@/components/SlotControls";
import { SPECIALIZATIONS_BY_ID } from "@/data/skills";
import { BRAND_MARKS, GEAR_SET_MARKS } from "@/lib/brandMarks";
import type { BuildSource } from "@/lib/buildFormat";
import { findViolations } from "@/lib/equipRules";
import { hasWildcard, resolveSets, type ActiveSet } from "@/lib/setBonuses";
import {
  SKILL_SLOTS,
  type GearSource,
  type WeaponSource,
} from "@/lib/loadoutEdits";
import type {
  EquippedSkill,
  GearSlot,
  Loadout,
  WeaponSlot,
} from "@/lib/types";
import {
  GearSlotCard,
  SkillSlotCard,
  WeaponSlotCard,
} from "@/components/Slots";

/**
 * What the screen calls when a slot is edited. Passed only in edit mode:
 * absent, the screen is read-only and shows no controls at all.
 */
export interface LoadoutEditHandlers {
  readonly name: (name: string) => void;
  readonly gear: (slot: GearSlot, source: GearSource) => void;
  readonly weapon: (slot: WeaponSlot, source: WeaponSource) => void;
  readonly weaponAttribute: (slot: WeaponSlot, name: string | null) => void;
  readonly skill: (index: number, skill: EquippedSkill | null) => void;
  readonly specialization: (id: string) => void;
}

/** Fixed slot order, so an incomplete loadout still renders the empty sockets. */
const GEAR_ORDER: readonly GearSlot[] = [
  "mask",
  "chest",
  "backpack",
  "gloves",
  "holster",
  "kneepads",
];

const WEAPON_ORDER: readonly WeaponSlot[] = ["primary", "secondary", "sidearm"];

const SetPanel = ({ set }: { set: ActiveSet }) => {
  const wildcards = set.counted - set.equipped;
  const mark =
    set.kind === "gearSet"
      ? GEAR_SET_MARKS.get(set.id)
      : BRAND_MARKS.get(set.id);

  return (
    <div className={`set is-${set.kind}`}>
      <div className="set-head">
        {mark ? (
          <span className={`mark tone-${mark.tone}`} aria-hidden="true">
            {mark.monogram}
          </span>
        ) : null}
        <span className="set-name">{set.name}</span>
        <span className="set-count">
          {set.equipped}
          {wildcards > 0 ? <span className="wild">+{wildcards}</span> : null}
        </span>
      </div>

      <ul className="tiers">
        {set.tiers
          .filter((tier) => tier.effects.length > 0)
          .map((tier) => (
            <li
              key={tier.piecesRequired}
              className={`tier${tier.active ? " is-active" : ""}`}
            >
              <span className="n">{tier.piecesRequired}</span>
              <span className="tier-effects">
                {tier.effects.map((effect) => (
                  <span key={effect}>{effect}</span>
                ))}
              </span>
            </li>
          ))}
      </ul>

      {set.talents.length > 0 ? (
        <div className="set-talents">{set.talents.join(" · ")}</div>
      ) : null}
    </div>
  );
};

/** The build name: a heading, or a text field in edit mode. */
const Title = ({
  name,
  onChange,
}: {
  name: string;
  onChange?: (name: string) => void;
}) => (
  <div className="title-row">
    {onChange ? (
      <input
        className="title-input"
        aria-label="Build name"
        value={name}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <h1>{name || "Untitled build"}</h1>
    )}
  </div>
);

export const LoadoutScreen = ({
  loadout,
  source,
  edit,
}: {
  loadout: Loadout;
  /** Where a curated build was transcribed from, when it has a source. */
  source?: BuildSource;
  edit?: LoadoutEditHandlers;
}) => {
  const sets = resolveSets(loadout);
  const violations = findViolations(loadout);
  const spec = loadout.specializationId
    ? SPECIALIZATIONS_BY_ID.get(loadout.specializationId)
    : undefined;
  const gearBySlot = new Map(loadout.gear.map((piece) => [piece.slot, piece]));
  const weaponsBySlot = new Map(loadout.weapons.map((w) => [w.slot, w]));

  return (
    <main className="screen">
      <header className="masthead panel">
        <div>
          <Title name={loadout.name} onChange={edit?.name} />
          {loadout.agent ? (
            <div className="agent">{loadout.agent}</div>
          ) : null}
        </div>

        <span className="spacer" />

        {loadout.watchLevel !== undefined ? (
          <span className="stat-chip">
            Watch <b>{loadout.watchLevel}</b>
          </span>
        ) : null}
        {loadout.skillTier !== undefined ? (
          <span className="stat-chip">
            Skill Tier <b>{loadout.skillTier}</b>
          </span>
        ) : null}
        {spec ? (
          <span className="stat-chip">
            Specialization <b>{spec.name}</b>
          </span>
        ) : null}
      </header>

      {loadout.notes || source ? (
        <section className="build-notes panel">
          {loadout.notes ? <p>{loadout.notes}</p> : null}
          {source ? (
            <p className="build-source">
              Source: <a href={source.url}>{source.label}</a>
            </p>
          ) : null}
        </section>
      ) : null}

      {violations.length > 0 ? (
        <section className="violations panel" role="alert">
          <h2>Illegal loadout</h2>
          <ul>
            {violations.map((v) => (
              <li key={v.rule}>
                Only {v.limit} {v.subject} may be equipped —{" "}
                {v.equipped.length} are: {v.equipped.join(", ")}.
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="columns">
        <section className="column">
          <h2 className="column-head">Gear</h2>
          {GEAR_ORDER.map((slot) => (
            <GearSlotCard
              key={slot}
              slot={slot}
              piece={gearBySlot.get(slot)}
              editor={
                edit ? (
                  <GearSelect
                    slot={slot}
                    loadout={loadout}
                    onChange={(next) => edit.gear(slot, next)}
                  />
                ) : undefined
              }
            />
          ))}
        </section>

        <section className="column">
          <h2 className="column-head">Weapons</h2>
          {WEAPON_ORDER.map((slot) => {
            const weapon = weaponsBySlot.get(slot);
            return (
              <WeaponSlotCard
                key={slot}
                slot={slot}
                weapon={weapon}
                editor={
                  edit ? (
                    <>
                      <WeaponSelect
                        slot={slot}
                        loadout={loadout}
                        onChange={(next) => edit.weapon(slot, next)}
                      />
                      {weapon ? (
                        <WeaponAttributeSelect
                          weapon={weapon}
                          onChange={(name) => edit.weaponAttribute(slot, name)}
                        />
                      ) : null}
                    </>
                  ) : undefined
                }
              />
            );
          })}

          <h2 className="column-head" style={{ marginTop: 10 }}>
            Skills
          </h2>
          {edit ? (
            // Every filled slot plus one empty one to add to, up to the limit.
            Array.from(
              { length: Math.min(loadout.skills.length + 1, SKILL_SLOTS) },
              (_, i) => (
                <SkillSlotCard
                  key={`skill-${i}`}
                  index={i}
                  skill={loadout.skills[i]}
                  editor={
                    <SkillSelect
                      skill={loadout.skills[i]}
                      onChange={(next) => edit.skill(i, next)}
                    />
                  }
                />
              ),
            )
          ) : loadout.skills.length === 0 ? (
            <p className="empty-note">No skills set.</p>
          ) : (
            loadout.skills.map((skill, i) => (
              <SkillSlotCard key={`skill-${i}`} index={i} skill={skill} />
            ))
          )}
        </section>
      </div>

      <section className="sets panel">
        <h2>Set Bonuses</h2>
        {sets.length > 0 ? (
          <div className="set-grid">
            {sets.map((set) => (
              <SetPanel key={`${set.kind}-${set.id}`} set={set} />
            ))}
          </div>
        ) : (
          <p className="footnote">No set pieces equipped.</p>
        )}

        {hasWildcard(loadout) ? (
          <p className="footnote">
            <span style={{ color: "var(--accent)" }}>+1</span> marks a piece
            counted by the NinjaBike Messenger Backpack&rsquo;s{" "}
            <em>Resourceful</em> talent, which fulfils a requirement toward every
            equipped gear and brand set at once.
          </p>
        ) : null}
      </section>

      {spec || edit ? (
        <section className="spec panel">
          <div className="panel-head">
            <h2>Specialization</h2>
          </div>
          {edit ? (
            <div className="slot-editor">
              <SpecializationSelect
                specializationId={loadout.specializationId}
                onChange={edit.specialization}
              />
            </div>
          ) : null}
          <div className={`spec-name${spec ? "" : " is-none"}`}>
            {spec ? spec.name : "None"}
          </div>
          {spec && spec.passives.length > 0 ? (
            <ul className="passives">
              {spec.passives.map((passive) => (
                <li key={passive}>{passive}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <footer className="colophon">
        <p>
          Curated builds live in <code>data/builds/</code>. Edits made here are
          not saved; a reload restores the build.
        </p>
        <p>
          Set and skill data generated from{" "}
          <a href="https://github.com/knowlesy/division-config">
            knowlesy/division-config
          </a>{" "}
          (MIT), patch Y8S3 / TU30. Not affiliated with or endorsed by Ubisoft.
        </p>
      </footer>
    </main>
  );
};

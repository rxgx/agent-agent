import { SPECIALIZATIONS_BY_ID } from "@/data/skills";
import { BRAND_MARKS, GEAR_SET_MARKS } from "@/lib/brandMarks";
import type { BuildSource } from "@/lib/buildFormat";
import { findViolations } from "@/lib/equipRules";
import { hasWildcard, resolveSets, type ActiveSet } from "@/lib/setBonuses";
import type { GearSlot, Loadout, WeaponSlot } from "@/lib/types";
import {
  EmptyGearCard,
  EmptyWeaponCard,
  GearCard,
  SkillCard,
  WeaponCard,
} from "@/components/Slots";

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

export const LoadoutScreen = ({
  loadout,
  source,
}: {
  loadout: Loadout;
  /** Where a curated build was transcribed from, when it has a source. */
  source?: BuildSource;
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
          <h1>{loadout.name}</h1>
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
          {GEAR_ORDER.map((slot) => {
            const piece = gearBySlot.get(slot);
            return piece ? (
              <GearCard key={slot} piece={piece} />
            ) : (
              <EmptyGearCard key={slot} slot={slot} />
            );
          })}
        </section>

        <section className="column">
          <h2 className="column-head">Weapons</h2>
          {WEAPON_ORDER.map((slot) => {
            const weapon = weaponsBySlot.get(slot);
            return weapon ? (
              <WeaponCard key={slot} weapon={weapon} />
            ) : (
              <EmptyWeaponCard key={slot} slot={slot} />
            );
          })}

          <h2 className="column-head" style={{ marginTop: 10 }}>
            Skills
          </h2>
          {loadout.skills.length === 0 ? (
            <p className="empty-note">No skills set.</p>
          ) : null}
          {loadout.skills.map((skill, i) => (
            <SkillCard key={`${skill.platformId}-${i}`} skill={skill} index={i} />
          ))}
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

      {spec ? (
        <section className="spec panel">
          <h2>Specialization</h2>
          <div className="spec-name">{spec.name}</div>
          {spec.passives.length > 0 ? (
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
          Curated builds live in <code>data/builds/</code>. Edits in the pickers
          above are not saved; a reload restores the build.
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

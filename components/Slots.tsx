import { BRANDS_BY_ID } from "@/data/brands";
import { BRAND_MARKS, GEAR_SET_MARKS } from "@/lib/brandMarks";
import { GEAR_SETS_BY_ID } from "@/data/gearSets";
import { SKILL_PLATFORMS_BY_ID } from "@/data/skills";
import type {
  Attribute,
  EquippedSkill,
  GearPiece,
  GearSlot,
  Weapon,
  WeaponSlot,
} from "@/lib/types";

const GEAR_SLOT_LABELS: Record<GearSlot, string> = {
  mask: "Mask",
  backpack: "Backpack",
  chest: "Body Armor",
  gloves: "Gloves",
  holster: "Holster",
  kneepads: "Kneepads",
};

const WEAPON_SLOT_LABELS: Record<WeaponSlot, string> = {
  primary: "Primary",
  secondary: "Secondary",
  sidearm: "Sidearm",
};

/** Named and exotic items print their own name in the rarity color; generic
 *  high-ends print the brand or set in plain text, as the game does. */
const AttributeList = ({ items }: { items?: readonly Attribute[] }) =>
  items && items.length > 0 ? (
    <ul className="attrs">
      {items.map((attr) => (
        <li key={attr.name}>
          <span>{attr.name}</span>
          {attr.value ? <span className="v">{attr.value}</span> : null}
        </li>
      ))}
    </ul>
  ) : null;

const Core = ({ core }: { core?: Attribute }) =>
  core ? (
    <div className="core">
      <span className="pip" aria-hidden="true" />
      <span className="core-name">{core.name}</span>
      {core.value ? <span className="core-value">{core.value}</span> : null}
    </div>
  ) : null;

const Mods = ({ mods }: { mods?: readonly string[] }) =>
  mods && mods.length > 0 ? (
    <ul className="mods">
      {mods.map((mod) => (
        <li key={mod}>{mod}</li>
      ))}
    </ul>
  ) : null;

export const GearCard = ({ piece }: { piece: GearPiece }) => {
  const set = piece.gearSetId ? GEAR_SETS_BY_ID.get(piece.gearSetId) : undefined;
  const brand = piece.brandId ? BRANDS_BY_ID.get(piece.brandId) : undefined;
  const source = set?.name ?? brand?.name;

  // An item with its own name shows it; otherwise the brand or set is the name.
  const title = piece.name ?? source ?? "Empty";
  const subtitle = piece.name ? source : undefined;
  const plain = !piece.name && piece.rarity !== "exotic";

  // Generated stand-in for the brand logo; see lib/brandMarks.ts.
  const mark = piece.gearSetId
    ? GEAR_SET_MARKS.get(piece.gearSetId)
    : piece.brandId
      ? BRAND_MARKS.get(piece.brandId)
      : undefined;

  return (
    <article className={`item rarity-${piece.rarity}`}>
      <div className="item-slot">{GEAR_SLOT_LABELS[piece.slot]}</div>
      <div className="item-head">
        {mark ? (
          <span className={`mark tone-${mark.tone}`} aria-hidden="true">
            {mark.monogram}
          </span>
        ) : null}
        <div>
          <h3 className={`item-name${plain ? " is-plain" : ""}`}>{title}</h3>
          {subtitle ? <div className="item-sub">{subtitle}</div> : null}
        </div>
      </div>
      <Core core={piece.core} />
      <AttributeList items={piece.attributes} />
      {piece.talent ? <div className="talent">{piece.talent}</div> : null}
      <Mods mods={piece.mod ? [piece.mod] : undefined} />
    </article>
  );
};

export const EmptyGearCard = ({ slot }: { slot: GearSlot }) => (
  <article className="item is-empty">
    <div className="item-slot">{GEAR_SLOT_LABELS[slot]}</div>
    <h3 className="item-name is-plain">Empty</h3>
  </article>
);

export const WeaponCard = ({ weapon }: { weapon: Weapon }) => (
  <article className={`item rarity-${weapon.rarity}`}>
    <div className="item-slot">{WEAPON_SLOT_LABELS[weapon.slot]}</div>
    <h3 className="item-name">{weapon.name}</h3>
    <div className="item-sub">{weapon.type}</div>
    <Core
      core={weapon.damage ? { name: "Damage", value: weapon.damage } : undefined}
    />
    <AttributeList items={weapon.attributes} />
    {weapon.talent ? <div className="talent">{weapon.talent}</div> : null}
    <Mods mods={weapon.mods} />
  </article>
);

export const EmptyWeaponCard = ({ slot }: { slot: WeaponSlot }) => (
  <article className="item is-empty">
    <div className="item-slot">{WEAPON_SLOT_LABELS[slot]}</div>
    <h3 className="item-name is-plain">Empty</h3>
  </article>
);

export const SkillCard = ({
  skill,
  index,
}: {
  skill: EquippedSkill;
  index: number;
}) => {
  const platform = SKILL_PLATFORMS_BY_ID.get(skill.platformId);

  return (
    <article className="item rarity-specialized">
      <div className="item-slot">Skill {index + 1}</div>
      <h3 className="item-name">{platform?.name ?? skill.platformId}</h3>
      <div className="item-sub">{skill.variant}</div>
    </article>
  );
};

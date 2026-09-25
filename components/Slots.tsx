"use client";

import type { ReactNode } from "react";
import { BRANDS_BY_ID } from "@/data/brands";
import { BRAND_MARKS, GEAR_SET_MARKS } from "@/lib/brandMarks";
import { GEAR_SETS_BY_ID } from "@/data/gearSets";
import { SKILL_PLATFORMS_BY_ID } from "@/data/skills";
import { WEAPON_CORES } from "@/data/weaponAttributes";
import type {
  Attribute,
  EquippedSkill,
  GearPiece,
  GearSlot,
  Weapon,
  WeaponSlot,
} from "@/lib/types";

export const GEAR_SLOT_LABELS: Record<GearSlot, string> = {
  mask: "Mask",
  backpack: "Backpack",
  chest: "Body Armor",
  gloves: "Gloves",
  holster: "Holster",
  kneepads: "Kneepads",
};

export const WEAPON_SLOT_LABELS: Record<WeaponSlot, string> = {
  primary: "Primary",
  secondary: "Secondary",
  sidearm: "Sidearm",
};

/**
 * Card chrome shared by every slot: the slot label, and the slot's controls
 * while the screen is in edit mode. Each slot renders one shell whether it is
 * filled or empty, so emptying a slot while editing keeps its controls in
 * place instead of swapping in a different component.
 */
const SlotShell = ({
  label,
  rarity,
  empty,
  editor,
  children,
}: {
  label: string;
  rarity?: string;
  empty: boolean;
  /** Present only in edit mode. */
  editor?: ReactNode;
  children: ReactNode;
}) => (
  <article
    className={`item ${empty ? "is-empty" : `rarity-${rarity}`}${editor ? " is-editing" : ""}`}
  >
    <div className="slot-head">
      <span className="item-slot">{label}</span>
    </div>
    {editor ? <div className="slot-editor">{editor}</div> : null}
    {children}
  </article>
);

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

/** `rolled` marks an attribute that varies from copy to copy: an outlined pip
 *  rather than the filled one of a fixed core. */
const Core = ({ core, rolled = false }: { core?: Attribute; rolled?: boolean }) =>
  core ? (
    <div className="core">
      <span className={`pip${rolled ? " is-rolled" : ""}`} aria-hidden="true" />
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

const EmptyBody = () => <h3 className="item-name is-plain">Empty</h3>;

/** Named and exotic items print their own name in the rarity color; generic
 *  high-ends print the brand or set in plain text, as the game does. */
const GearBody = ({ piece }: { piece: GearPiece }) => {
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
    <>
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
    </>
  );
};

export const GearSlotCard = ({
  slot,
  piece,
  editor,
}: {
  slot: GearSlot;
  piece: GearPiece | undefined;
  editor?: ReactNode;
}) => (
  <SlotShell
    label={GEAR_SLOT_LABELS[slot]}
    rarity={piece?.rarity}
    empty={!piece}
    editor={editor}
  >
    {piece ? <GearBody piece={piece} /> : <EmptyBody />}
  </SlotShell>
);

export const WeaponSlotCard = ({
  slot,
  weapon,
  editor,
}: {
  slot: WeaponSlot;
  weapon: Weapon | undefined;
  editor?: ReactNode;
}) => (
  <SlotShell
    label={WEAPON_SLOT_LABELS[slot]}
    rarity={weapon?.rarity}
    empty={!weapon}
    editor={editor}
  >
    {weapon ? (
      <>
        <h3 className="item-name">{weapon.name}</h3>
        <div className="item-sub">
          {weapon.type}
          {weapon.damage ? ` · ${weapon.damage} damage` : ""}
        </div>
        {/* The cores are fixed by weapon type, so every weapon shows them. */}
        {WEAPON_CORES[weapon.type].map((core) => (
          <Core key={core.name} core={{ name: core.name }} />
        ))}
        {weapon.attributes?.map((attr) => (
          <Core key={attr.name} core={attr} rolled />
        ))}
        {weapon.talent ? <div className="talent">{weapon.talent}</div> : null}
        <Mods mods={weapon.mods} />
      </>
    ) : (
      <EmptyBody />
    )}
  </SlotShell>
);

export const SkillSlotCard = ({
  index,
  skill,
  editor,
}: {
  index: number;
  skill: EquippedSkill | undefined;
  editor?: ReactNode;
}) => {
  const platform = skill ? SKILL_PLATFORMS_BY_ID.get(skill.platformId) : undefined;

  return (
    <SlotShell
      label={`Skill ${index + 1}`}
      rarity="specialized"
      empty={!skill}
      editor={editor}
    >
      {skill ? (
        <>
          <h3 className="item-name">{platform?.name ?? skill.platformId}</h3>
          <div className="item-sub">{skill.variant}</div>
        </>
      ) : (
        <EmptyBody />
      )}
    </SlotShell>
  );
};

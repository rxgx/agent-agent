import type { Loadout } from "@/lib/types";

/**
 * A hand-entered loadout, standing in for the import layer that does not exist
 * yet. Item and set names come from `data/`; attribute magnitudes are the one
 * thing typed by hand here, because no source emits per-roll values.
 *
 * It is deliberately built to exercise the wildcard rule in `lib/setBonuses.ts`:
 * three real Striker's pieces plus the NinjaBike Messenger Backpack reach the
 * 4-piece talent, and two Grupo Sombra pieces plus the same backpack reach the
 * 3-piece bonus — one item completing two sets at once.
 */
export const sampleLoadout: Loadout = {
  name: "Striker's Gamble",
  agent: "Agent",
  watchLevel: 40,
  specializationId: "gunner",
  skillTier: 1,

  gear: [
    {
      slot: "mask",
      rarity: "gearSet",
      gearSetId: "striker-s-battlegear",
      core: { name: "Weapon Damage", value: "15.0%" },
      attributes: [
        { name: "Critical Hit Chance", value: "6.0%" },
        { name: "Critical Hit Damage", value: "12.0%" },
      ],
      mod: "Critical Hit Damage +6.0%",
    },
    {
      slot: "backpack",
      name: "NinjaBike Messenger Backpack",
      rarity: "exotic",
      core: { name: "Weapon Damage", value: "15.0%" },
      attributes: [
        { name: "Armor", value: "170,000" },
        { name: "Skill Tier", value: "+1" },
      ],
      talent: "Resourceful",
      mod: "Critical Hit Chance +6.0%",
      countsForAllSets: true,
    },
    {
      slot: "chest",
      rarity: "gearSet",
      gearSetId: "striker-s-battlegear",
      core: { name: "Weapon Damage", value: "15.0%" },
      attributes: [
        { name: "Critical Hit Damage", value: "12.0%" },
        { name: "Weapon Handling", value: "10.0%" },
      ],
      talent: "Press the Advantage",
      mod: "Critical Hit Damage +6.0%",
    },
    {
      slot: "gloves",
      rarity: "gearSet",
      gearSetId: "striker-s-battlegear",
      core: { name: "Weapon Damage", value: "15.0%" },
      attributes: [
        { name: "Critical Hit Chance", value: "6.0%" },
        { name: "Assault Rifle Damage", value: "10.0%" },
      ],
    },
    {
      slot: "holster",
      name: "Fox's Prayer",
      rarity: "named",
      brandId: "grupo-sombra-s-a-",
      core: { name: "Weapon Damage", value: "15.0%" },
      attributes: [{ name: "Critical Hit Damage", value: "12.0%" }],
      talent: "Perfectly Opportunistic",
    },
    {
      slot: "kneepads",
      rarity: "highEnd",
      brandId: "grupo-sombra-s-a-",
      core: { name: "Weapon Damage", value: "15.0%" },
      attributes: [
        { name: "Critical Hit Chance", value: "6.0%" },
        { name: "Critical Hit Damage", value: "12.0%" },
      ],
      mod: "Critical Hit Chance +6.0%",
    },
  ],

  weapons: [
    {
      slot: "primary",
      name: "St. Elmo's Engine",
      type: "Assault Rifle",
      rarity: "exotic",
      damage: "1.2M",
      talent: "Actum Est",
      attributes: [{ name: "Rate of Fire", value: "700 RPM" }],
      mods: ["Compensator", "Vertical Grip", "Digital Scope 8x"],
    },
    {
      slot: "secondary",
      name: "The Grudge",
      type: "SMG",
      rarity: "named",
      damage: "910K",
      talent: "Perfectly Vindictive",
      attributes: [{ name: "Magazine", value: "50" }],
      mods: ["Muzzle Brake", "Laser Pointer", "Reflex Sight"],
    },
    {
      slot: "sidearm",
      name: "Mozambique Special",
      type: "Pistol",
      rarity: "named",
      damage: "640K",
      talent: "Perfect Breadbasket",
      mods: ["Extended Magazine"],
    },
  ],

  skills: [
    { platformId: "drone", variant: "Striker" },
    { platformId: "firefly", variant: "Blinder" },
  ],

  notes:
    "Attribute magnitudes are hand-entered — no source emits per-roll values yet.",
};

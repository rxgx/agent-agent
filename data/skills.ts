// GENERATED FILE — do not edit by hand.
// Run `node scripts/build-data.mjs` to regenerate.
//
// 12 skill platforms with variants, and 7 specializations.
// Source: knowlesy/division-config (MIT), patch Y8S3 / TU30 / 2.34
// Generated upstream at 2026-08-29T17:29:12.927Z

import type { SkillPlatform, Specialization } from "@/lib/types";

export const SKILL_PLATFORMS: readonly SkillPlatform[] = [
  {
    id: "smart-cover",
    name: "Smart Cover",
    variants: ["Precision", "Fortified"],
  },
  {
    id: "sticky-bomb",
    name: "Sticky Bomb",
    variants: ["Burn", "EMP", "Explosive"],
  },
  {
    id: "trap",
    name: "Trap",
    variants: ["Shock", "Healing", "Shrapnel"],
  },
  {
    id: "decoy",
    name: "Decoy",
    variants: ["Holographic Distraction"],
  },
  {
    id: "pulse",
    name: "Pulse",
    variants: ["Scanner", "Remote", "Jammer (EMP)", "Achilles", "Banshee"],
  },
  {
    id: "turret",
    name: "Turret",
    variants: ["Assault", "Incinerator", "Sniper", "Artillery"],
  },
  {
    id: "hive",
    name: "Hive",
    variants: ["Restorer", "Stinger", "Reviver", "Booster", "Artificer"],
  },
  {
    id: "chem-launcher",
    name: "Chem Launcher",
    variants: ["Reinforcer", "Firestarter", "Riot Foam", "Oxidizer"],
  },
  {
    id: "firefly",
    name: "Firefly",
    variants: ["Blinder", "Burster", "Demolisher"],
  },
  {
    id: "seeker",
    name: "Seeker",
    variants: ["Explosive", "Airburst", "Cluster", "Mender"],
  },
  {
    id: "drone",
    name: "Drone",
    variants: ["Striker", "Defender", "Bombardier", "Fixer", "Tactician"],
  },
  {
    id: "shield",
    name: "Shield",
    variants: ["Bulwark", "Crusader", "Deflector", "Striker"],
  },
];

export const SKILL_PLATFORMS_BY_ID: ReadonlyMap<string, SkillPlatform> = new Map(
  SKILL_PLATFORMS.map((p) => [p.id, p]),
);

export const SPECIALIZATIONS: readonly Specialization[] = [
  {
    id: "universal",
    name: "Universal",
    passives: ["Vital Protection", "Signature Weapon Damage", "E.M.I", "Onslaught", "Running the Gun", "Spray and Pray", "Gunslinger", "Depleted Rounds", "This is my Rifle"],
  },
  {
    id: "sharpshooter",
    name: "Sharpshooter",
    passives: ["Emegency Cleanse", "Sharpshooter Tactical Link", "Round After Round", "My Home is My Castle", "One in the Head", "Breath Control", ".50 Caliber Ammo Acquisition", "Group Siganture Ammo Supply", "Tactician", "Graphene Battery (Upgrade)", "Carbon Fiber Frame (Upgrade)", "Digital Scope (Mod)", "Flashbang Grenade", "Sharpshooter's 93R", "TAC-50 C Rifle"],
  },
  {
    id: "survivalist",
    name: "Survivalist",
    passives: ["Distributed Repair", "Survivalist Tactical Link", "Scraping By", "Crunch Time", "Triage Specialist", "Elite Defense", "Explosive Bolt Aqusition", "Group Siganture Ammo Supply", "Mender", "Magnetic Disc (Upgrade)", "Larrea tridentata Infusion (Upgrade)", "Infantry 5.56 Mag", "Incendiary Grenade", "Survivalist D50", "Crossbow"],
  },
  {
    id: "technician",
    name: "Technician",
    passives: ["Emergency Patch", "Faraday Field", "Technomancy", "Overclocked CPU", "Enhanced Diagnostics", "Amped", "Dismantling", "Micro-Missile Ammo Acquisition", "Group Signature Ammo Acquisition", "Artificer", "Upgraded Sensor Package (Upgrade)", "Liquid Cooling (Upgrade)", "Linked Laser Pointer", "EMP Grenade", "Maxim 9", "P-017 Launcher"],
  },
  {
    id: "gunner",
    name: "Gunner",
    passives: ["Hardened Armor Kits", "Supply Line", "Emplacement", "Barrage", "Incessant", "Coupler", "7.62 Minigun Ammo Acquisition", "Group Signature Ammo Acquisition", "Banshee", "Microwave Amplifier (Upgrade)", "Directional Transmitter (Upgrade)", "Large Pouch (LMGs)", "Riot Foam Grenade", "P320 XCompact", "Minigun"],
  },
  {
    id: "demolitionist",
    name: "Demolitionist",
    passives: ["Stimulant patch", "Demolitionist Tactical Link", "Braced for Impact", "Crisis Response", "Explosive Ordnance", "Incombustible", "40mm Ammo Acquisition", "Group Signature Ammo Supply", "Artillery Turret", "Cyclone Magazine (Upgrade)", "SHD CPU V.2 (Upgrade)", "Small Laser Pointer", "Fragmentation Grenade", "Diceros Special", "M32A1 Multi-shot Grenade Launcher"],
  },
  {
    id: "firewall",
    name: "Firewall",
    passives: ["Extracellular Matrix Mesh", "Firewall Tactical Link", "Fiery Response", "Bull Rush", "Enriched Magnesium Formula", "Frontline Recovery", "Firewall Ammo Acquisition", "Group Signature Ammo Acquisition", "Striker Shield", "Shock Hardened Frame (Upgrade)", "Macromolecular Coverings (Upgrade)", "Tactical Short Grip", "Cluster Grenade", "Firestarter Sawed-Off Shotgun", "K8-JetStream Flamethrower"],
  },
];

export const SPECIALIZATIONS_BY_ID: ReadonlyMap<string, Specialization> = new Map(
  SPECIALIZATIONS.map((s) => [s.id, s]),
);

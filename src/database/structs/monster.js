export function Monster(monsterName) {
  this.name = monsterName;
  this.primaryAttributes = new PrimaryAttributes();
  // this.abilities = {};
  // this.equipment = {};
  // this.items = {};
  // this.loot = {};
  // this.tags = {};
  // this.variants = new VariantMonsters();
}

export const VALID_MONSTER_KEYS = [
  'name', 'primaryAttributes', 'abilities', 'equipment', 'items', 'loot', 'tags', 'variants'
];

function PrimaryAttributes() {
  let baseStat = 1;

  this.strength = baseStat;
  this.agility = baseStat;
  this.constitution = baseStat;

  this.intellect = baseStat;
  this.willpower = baseStat;
  this.spirit = baseStat;

}

export const MONSTER_PRIMARY_ATTRIBUTE_KEYS = Object.keys(new PrimaryAttributes());

function VariantMonsters() {
  this.modifiers = {};
  this.tags = {};
}

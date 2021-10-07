export function Character(playerId,  playerAlias) {
  this.playerId = playerId;
  this.playerAlias = playerAlias;
  this.primaryAttributes = new PrimaryAttributes();
  this.attributePoints = 0;
  this.experiencePoints = 0;
  // this keeps track of the CURRENT health and CURRENT mana
  this.status = {
    currentHealth: 0,
    currentMana: 0,
    isEngagedInBattle: false
  };
  // this.abilities = {};
  // this.equipment = {};
  // this.inventory = {};
  this.location = 'Home';
  // this.partyMembers = {};
  // this.blessings = {};
  // this.blessingBlacklist = {};
}


function PrimaryAttributes() {
  let baseStat = 5;

  this.strength = baseStat;
  this.agility = baseStat;
  this.constitution = baseStat;

  this.intellect = baseStat;
  this.willpower = baseStat;
  this.spirit = baseStat;
}

/*
====Secondary Attributes====
Attack
Defense
Magic Attack
Magic Defense
Evade
Accuracy
Armor
Magic Armor
Health
Mana
Health Regen
Mana Regen
Resilience
*/
export function calculateSecondaryAttributes(character) {
  if (character?.primaryAttributes) {
    // Numerify stats
    Object.keys(character.primaryAttributes).forEach((stat) => {
      character.primaryAttributes[stat] = Number(character.primaryAttributes[stat]);
    });
    character.canReincarnate = Boolean(character.blessings === undefined || character.blessings.length === 1);
    character.level = 1;  //should be calculated with a function of experiencePoints, ratio of xp to levels
    character.secondaryAttributes = {};
    character.secondaryAttributes.attack = doTheMath(['strength', 'agility', 'intellect'], [2, 1, 1]);
    character.secondaryAttributes.defense = doTheMath(['strength', 'agility', 'constitution', 'willpower'], [1, 1, 2, 1]);
    character.secondaryAttributes.magicAttack = doTheMath(['intellect', 'spirit'], [2, 1]);
    character.secondaryAttributes.magicDefense = doTheMath(['agility', 'constitution', 'willpower', 'intellect', 'spirit'], [1, 1, 2, 1, 1]);
    character.secondaryAttributes.evade = doTheMath(['agility'], [2]);
    character.secondaryAttributes.accuracy = doTheMath(['agility', 'intellect'], [2, 1]);
    character.secondaryAttributes.armor = Math.round(doTheMath(['constitution'], [0.5]));
    character.secondaryAttributes.magicArmor = Math.round(doTheMath(['willpower', 'spirit'], [0.5, 1]));
    character.secondaryAttributes.health = doTheMath(['strength', 'constitution', 'spirit'], [1, 2, 1]);
    character.secondaryAttributes.mana = doTheMath(['willpower', 'intellect', 'spirit'], [2, 1, 1]);
    character.secondaryAttributes.healthRegen = doTheMath(['constitution', 'spirit'], [1, 1]);
    character.secondaryAttributes.manaRegen = doTheMath(['intellect', 'spirit'], [1, 1]);
    character.secondaryAttributes.resilience = doTheMath(['strength', 'constitution', 'willpower', 'spirit'], [1, 2, 1, 1]);

    function doTheMath(statArray, scalingArray) {
      // both arrays should always be of same length
      if (statArray.length === scalingArray.length) {
        let total = 0;
        statArray.forEach((stat, index) => {
          total += character.primaryAttributes[stat] * scalingArray[index];
        });
        return total;
      }
      return 0;
    }

  } else {
    console.log('Error! Character is missing primaryAttributes!');
  }

  // remove any undefined or NaN values
  // character =_.pickBy(character, (value) => (!_.isNil(value) && !_.isNaN(value)))

  return character;
}

export function determineLevel(experiencePoints) {
  //TODO: determine this maths
  let level = experiencePoints / 10;
  return level;
}

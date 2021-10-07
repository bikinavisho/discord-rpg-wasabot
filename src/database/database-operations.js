import {database} from './firebase.js';
import {Character, calculateSecondaryAttributes} from './structs/character.js';
import {Monster, VALID_MONSTER_KEYS, MONSTER_PRIMARY_ATTRIBUTE_KEYS} from './structs/monster.js';
import {Item, VALID_ITEM_KEYS} from './structs/item.js';
import {Location} from './structs/location.js';
import _ from 'lodash';
import {wordStartsWithVowel} from '../text-utility.js';
import { uniqueNamesGenerator, adjectives, colors } from 'unique-names-generator';
import locations from '../constants/locations.js';

const UNIQUE_NAMES_GENERATOR_CONFIG = {
  dictionaries: [adjectives, colors, locations]
};

// =============================================================================
//                        C H A R A C T E R
// =============================================================================
export function createNewCharacter(userId, userAlias, sendMessage) {
  let character = new Character(userId, userAlias);
  let saturatedCharacter = calculateSecondaryAttributes(_.cloneDeep(character));
  character.status.currentHealth = saturatedCharacter.secondaryAttributes.health;
  character.status.currentMana = saturatedCharacter.secondaryAttributes.mana;
  database.ref('live/characters').child(userId).set(character);
  sendMessage('Character Created.\n```' + JSON.stringify(_.pickBy(character, (value, key) => (key !== 'playerId'))) + '```');
  console.log('--------')
  console.log('new character created: ', character);
  console.log('--------')
}
export function getCharacterData(userId, sendMessage = () => {}) {
  return database.ref('live/characters').child(userId).once('value').then((snapshot) => {
    let character;

    if (snapshot.exists()) {
      let characterData = snapshot.exportVal();
      character = _.cloneDeep(characterData);
      character = calculateSecondaryAttributes(character);

      sendMessage('Character found.');
    } else {
      sendMessage('No characters found associated with your Discord account.');
    }

    return character;
  });
}
export function updatePrimaryAttribute(userId, attributeName, newValue) {
  database.ref(`live/characters/${userId}/primaryAttributes`).child(attributeName).set(newValue);
}
export function updateAttributePointTotal(userId, newValue) {
  database.ref(`live/characters/${userId}`).child('attributePoints').set(newValue);
}

// =============================================================================
//                         M O N S T E R
// =============================================================================
export function createNewMonster(monsterName) {
  database.ref('static/monsters').child(monsterName).set(new Monster(monsterName));
}

export function getMonsters() {
  return database.ref('static/monsters').once('value').then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.exportVal();
    }
  });
}

export function updatePropertyOfMonster(monsterName, property, newValue, sendMessage) {
  let changePerformed = false;

  database.ref(`static/monsters/${monsterName}`).once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        console.log(`${monsterName} exists in the database. Commensing with patch operation.`)
        if (_.includes(MONSTER_PRIMARY_ATTRIBUTE_KEYS, property)) {
          database.ref(`static/monsters/${monsterName}/primaryAttributes`).child(property).set(Number(newValue));
          console.log(property + ' has been modified')
          changePerformed = true;
        }
        if (_.includes(VALID_MONSTER_KEYS, property)) {
          console.log('is valid monster key')
          if (property === 'name') {
            console.log('cannot update property NAME of monster')
          } else {
            switch(property) {
              case 'primaryAttributes':
                console.log('cannot set primaryAttributes directly as it is a collection of objects')
                break;
              case 'tags':
              case 'tag':
                database.ref(`static/monsters/${monsterName}`).child('tags').update({[newValue]: newValue});
                console.log('tag updated')
                changePerformed = true;
                break;
            }
          }
        }
      } else {
        console.log(`${monsterName} does not exist in the database. Halting patch operation.`)
      }

      if (changePerformed) {
        sendMessage(`Monster \`${monsterName}\` property \`${property}\` has been changed to \`${newValue}\`.`)
      } else {
        sendMessage(`Monster \`${monsterName}\` property \`${property}\` has not been changed.`);
      }
    });

  return changePerformed;

}

// =============================================================================
//                              I T E M
// =============================================================================

export function createNewItem(itemName) {
  database.ref('static/items').child(itemName).set(new Item(itemName));
}

export function getItems() {
  return database.ref('static/items').once('value').then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.exportVal();
    }
  });
}

export function updatePropertyOfItem(itemName, property, newValue, sendMessage) {
  let changePerformed = false;

  database.ref(`static/items/${itemName}`).once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        console.log(`${itemName} exists in the database. Commensing with patch operation.`)

        if (_.includes(VALID_ITEM_KEYS, property)) {
          console.log('is valid item key')
          if (property === 'name') {
            console.log('cannot update property NAME of item')
          } else {
            switch(property) {
              case 'sellPrice':
                database.ref(`static/items/${itemName}`).child('sellPrice').set(Number(newValue));
                console.log('sellPrice updated')
                changePerformed = true;
                break;
              case 'buyPrice':
                database.ref(`static/items/${itemName}`).child('buyPrice').set(Number(newValue));
                console.log('buyPrice updated')
                changePerformed = true;
                break;
            }
          }
        }

      } else {
        console.log(`${itemName} does not exist in the database. Halting patch operation.`)
      }

      if (changePerformed) {
        sendMessage(`Item \`${itemName}\` property \`${property}\` has been changed to \`${newValue}\`.`)
      } else {
        sendMessage(`Item \`${itemName}\` property \`${property}\` has not been changed.`);
      }
    });

  return changePerformed;

}

// =============================================================================
//                         L O C A T I O N
// =============================================================================

export function createLocation(playerId, playerName) {
  let locationName = uniqueNamesGenerator(UNIQUE_NAMES_GENERATOR_CONFIG);
  database.ref('live/locations').child(locationName).set(new Location(locationName, playerId, playerName));
  return locationName;
}

export function moveToLocation(playerId, playerName, locationName, sendMessage) {
  // find and remove the last location they were at
  database.ref('live/locations').orderByChild('players/' + playerId).equalTo(playerName).once('value').then((snapshot) => {
    if (snapshot.exists()) {
      console.log('----------------------')
      snapshot.forEach((snap) => {
        // note:  snap.ref.key is equal to snap.val().name (because i set it  up that way)
        if (snap.val().name !== locationName) {
          let newPlayerObject = snap.val().players;
          delete newPlayerObject[playerId];
          if (_.isEmpty(newPlayerObject)) {
            console.log('nobody\'s left, tryna delete ' + snap.ref.key);
            database.ref('live/locations').child(snap.ref.key).set({});
          } else {
            console.log('tryna remove just one player')
            database.ref('live/locations').child(snap.ref.key).child('players').set(newPlayerObject);
          }
        }
      });
      console.log('------------------')
    } else {
      console.log('not found')
    }
  });

  // if home, then heal up
  if (locationName.toLowerCase() === 'home') {
    console.log('tryna go home')
    database.ref('live/characters').child(playerId).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        let character = snapshot.val();
        character = calculateSecondaryAttributes(character);
        snapshot.ref.child('status').update({
          currentHealth: character.secondaryAttributes.health,
          currentMana: character.secondaryAttributes.mana,
          isEngagedInBattle: false
        });
        sendMessage('You have gone home to rest. Health and Mana have been restored to full.')
      } else {
        console.log('player does not exist')
      }
    });
  } else {
    // check to see if the location they are moving to already exists
    database.ref('live/locations').child(locationName).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        // if exists, add player to existing location
        snapshot.ref.child('players').update({[playerId]: playerName})
        sendMessage(`You have moved to \`${locationName}\`.`);
      } else {
        sendMessage('The place you are trying to move to does not exist.')
      }
    });
  }

  // save player location in player db
  database.ref('live/characters').child(playerId).child('location').set(locationName);
  // disengage from combat
  database.ref('live/characters').child(playerId).child('status/isEngagedInBattle').set(false);

}

export function getLocation(locationName) {
  return database.ref('live/locations').child(locationName).once('value').then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.exportVal();
    }
  })
}

export function getMonstersInLocation(playerId) {
  return getCharacterData(playerId).then((character) => {
    if (character) {
      let currentLocationName = character.location;
      return getLocation(currentLocationName).then((location) => {
        if (location) {
          return {monsters: location.monsters, character};
        } else {
          console.log('getMonstersInLocation: no location matching ' + currentLocationName + ' found for ' + character.playerAlias)
          return Promise.reject(new Error('no location found'));
        }
      });
    } else {
      console.log('getMonstersInLocation: no character found for ' + playerId);
      return Promise.reject(new Error('no character found'))
    }
  });
}

// =============================================================================
//                             A T T A C K
// =============================================================================
export function initiateAttack(playerId, sendMessage) {
  return database.ref('live/characters').child(playerId).once('value').then((characterSnapshot) => {
    if (characterSnapshot.exists()) {
      let character = characterSnapshot.exportVal();
      character = calculateSecondaryAttributes(character);
      if (_.toLower(character?.location) === 'home') {
        sendMessage('There is nothing to fight at home! Try going somewhere else.');
      } else {
        let locationName = character?.location;
        let isEngagedInBattle = character?.status?.isEngagedInBattle;
        if (isEngagedInBattle) {
          console.log('is engaged in battle alreaady')
          return database.ref('live/locations').child(locationName).child('monsters').once('value').then((locationSnapshot) => {
            let monsterKeys = _.sortBy(_.keys(locationSnapshot.exportVal()));
            return {monsterKeys, monsters: locationSnapshot.exportVal(), character}
          });
        } else {
          console.log('generating a monster to fight');
          return generateMonsterToFight(locationName, sendMessage).then((chosenMonster) => {
            characterSnapshot.ref.child('status').update({isEngagedInBattle: true});
            sendMessage(`You engage in battle with the ${_.startCase(chosenMonster.name)}!`);
            return {chosenMonster, character};
          });
        }
      }

    } else {
      console.log('entry does not exist')
    }
  });
}

function generateMonsterToFight(locationName, sendMessage) {
  return database.ref('static/monsters/').orderByKey().once('value').then((monstersSnapshot) => {
    let monsters = _.keys(monstersSnapshot.exportVal())
    let chosenMonsterString = monsters[_.random(monsters.length - 1)];
    sendMessage(`A${wordStartsWithVowel(chosenMonsterString) ? 'n' : ''} ${_.startCase(chosenMonsterString)} appears!`);
    let chosenMonster = monstersSnapshot.exportVal()[chosenMonsterString];
    chosenMonster = calculateSecondaryAttributes(chosenMonster);
    chosenMonster.status = {};
    chosenMonster.status.currentHealth = chosenMonster.secondaryAttributes.health;
    chosenMonster.status.currentMana = chosenMonster.secondaryAttributes.mana;
    delete chosenMonster.canReincarnate;
    console.log('this is the chosen monster: ', chosenMonster)
    //add monster to location
    database.ref('live/locations').child(locationName).child('monsters').once('value').then((locationSnapshot) => {
      if (locationSnapshot.exists()) {
        let monsterKeys = _.sortBy(_.keys(locationSnapshot.exportVal()));
        let nextKey = Number(_.last(monsterKeys)) + 1;
        locationSnapshot.ref.update({[nextKey]: chosenMonster});
      } else {
        locationSnapshot.ref.update({1: chosenMonster});
      }
    });
    return chosenMonster;
  });
}

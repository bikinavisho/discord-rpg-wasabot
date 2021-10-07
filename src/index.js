import Discord, {MessageEmbed, MessageActionRow, MessageButton} from 'discord.js';
import {bold, italic, strikethrough, underscore, spoiler, quote, blockQuote} from '@discordjs/builders';
import RandomOrg from 'random-org';
import _ from 'lodash';
import {database} from './database/firebase.js';
import * as databaseOperations from './database/database-operations.js';
import {isAdmin} from './admins.js';
import {createStatIncreaseButtons, createStatDisplay, createSecondaryStatDisplay, createBattleActionButtons} from './discord-pretty-print.js';
import {wordStartsWithVowel, convertArrayIntoHumanList} from './text-utility.js';
import dotenv from 'dotenv';


// enable the use of environemnt files (.env)
dotenv.config();

const random = new RandomOrg({ apiKey: process.env.RANDOM_API_KEY });
const client = new Discord.Client(
  { intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
  ] }
);

const prefix = "rpg";

client.on("ready", () => {
  console.log("I am ready!");
});

client.on("messageCreate", function(message) {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith(prefix)) return;

  const userAlias = message.member && message.member.nickname ? message.member.nickname : message.author.username;
  const userId = message.author.id;

  // take off the prefix
  const commandBody = message.content.slice(prefix.length);
  const args = _.compact(commandBody.split(' '));
  // command name (the first arg!)
  const command = args?.shift()?.toLowerCase();
  console.log('--------\n');
  console.log('Time of Request: ', new Date(Date.now()).toLocaleString())
  console.log(`Request initiated by: ${userAlias}`)
  console.log(`Command received: ${command}`);
  console.log(`Arguments received: ${args}`);
  console.log();

  try {
    switch(command) {
      case 'hi':
        message.channel.send(`Hello, ${userAlias}!`);
        break;
      case 'help':
        let helpMessage = new MessageEmbed()
          .setColor('RANDOM')
          .setTitle('Wasabot\'s Commands')
          .setDescription(
            `\`${prefix} hi\` - say hello to Wasabot!\n` +
            `\`${prefix} start\` - create a new character\n` +
            `\`${prefix} status\` - display your character's stats\n` +
            `\`${prefix} explore/go ?nameOfExistingLocation\` - have your character travel to a different location. If no parameter is specified, a new location is generated. You can use this to join locations other players have generated already.\n` +
            `\`${prefix} go home\` - return home to rest and heal\n` +
            `\`${prefix} fight\` - initiate a fight or continue a fight you're already engaged in.\n` +
            `\`${prefix} look around\` - prints information about where you are and what is around you.\n` +
            '\n' +
            `\`${prefix} create [item/monster] nameOfThing\` - create a new item/monster\n` +
            `\`${prefix} patch [monster] nameOfMonster propertyToModify newValue\` - patch monster in db\n` +
            `\`${prefix} fetch [monsters]\` - prints a list of all monsters in the db \n`
          );
        sendMessage({embeds: [helpMessage]});
        break;
      case 'start':
      case 'createcharacter':
      case 'makechar':
        sendMessage('Initiating character creation process.');
        databaseOperations.createNewCharacter(userId, userAlias, sendMessage);
      case 'status':
      case 'getchar':
        sendMessage('Fetching character data.');
        databaseOperations.getCharacterData(userId, sendMessage).then((character) => {
          if (character) {
            let characterDisplayWithPrimaryAttributes = {embeds: [createStatDisplay(userAlias, character)]};

            // if there are attribute points to allocate, create buttons
            if (Number(character?.attributePoints) > 0) {
              characterDisplayWithPrimaryAttributes.components = createStatIncreaseButtons(userId);
            }

            sendMessage(characterDisplayWithPrimaryAttributes);
            sendMessage({embeds: [createSecondaryStatDisplay(userAlias, character)]});
          }
        });
        break;
      case 'explore':
      case 'go':
        let proposedLocation = args[0];
        if (proposedLocation) {
          databaseOperations.moveToLocation(userId, userAlias, proposedLocation, sendMessage);
        } else {
          let locationName = databaseOperations.createLocation(userId, userAlias);
          databaseOperations.moveToLocation(userId, userAlias, locationName, sendMessage);
        }
        break;
      case 'attack':
      case 'fight':
        databaseOperations.initiateAttack(userId, sendMessage).then((response) => {
          console.log('response: ', response);
          let character = response?.character;
          let message = `Player Health: ${character?.status?.currentHealth}/${character?.secondaryAttributes?.health}\n`;
          message += `Player Mana: ${character?.status?.currentMana}/${character?.secondaryAttributes?.mana}\n`
          if (response?.monsterKeys && response?.character) {
            // there may be more than one monster, returned key/object pair for navigation
            console.log('there already exists monster and it\'s in object form')
            let firstMonster = response.monsters[response.monsterKeys[0]];
            message += `${_.startCase(firstMonster.name)} Health: ${firstMonster?.status?.currentHealth}/${firstMonster?.secondaryAttributes?.health}\n`
            sendMessage({content: message, components: createBattleActionButtons(userId)});
          } else if (response?.chosenMonster && response?.character) {
            let {chosenMonster} = response;
            // only one monster which was just created was returned
            console.log('new monster returned')
            message += `Monster Health: ${chosenMonster?.status?.currentHealth}/${chosenMonster?.secondaryAttributes?.health}\n`
            sendMessage({content: message, components: createBattleActionButtons(userId)});
          }
        });
        break;
      case 'look':
        if (args[0] === 'around') {
          databaseOperations.getCharacterData(userId).then((character) => {
            if (character?.location) {
              if (_.toLower(character?.location) === 'home') {
                sendMessage('You are at home.');
              } else {
                databaseOperations.getLocation(character?.location).then((location) => {
                  if (location) {
                    console.log('location object found: ', location);
                    let infoMessage = `You are at \`${location.name}\`.\n`;
                    if (_.isEmpty(location?.monsters)) {
                      infoMessage += 'It is peaceful here.\n';
                    } else {
                      infoMessage += 'There is currently a battle happening here'
                      if (character.status?.isEngagedInBattle) {
                        infoMessage += ', which you are a part of! '
                      } else {
                        infoMessage += '. ';
                      }
                      infoMessage += 'There is a ';
                      let monsterList = _.keys(location.monsters).map((key) => {
                        return _.startCase(location.monsters[key].name);
                      });
                      infoMessage += convertArrayIntoHumanList(monsterList);
                      infoMessage += 'here! \n';
                    }
                    let playerList = _.values(location.players);
                    if (playerList.length > 1) {
                      infoMessage += convertArrayIntoHumanList(playerList);
                      infoMessage += 'are here.\n'
                    }
                    sendMessage(infoMessage);
                  } else {
                    console.log('location not found :(')
                  }

                });
              }
            } else {
              console.log('Error! The character currently isn\'t anywhere!')
            }
          });
        }
        break;
      // =======================================================================================================
      case 'create':
      case 'add':
        if (isAdmin(userId)) {
          let thingToCreate = args[0];
          if (_.includes(['monster', 'item'], thingToCreate)) {
            let name = args[1];
            if (name) {
              console.log(`creating ${thingToCreate} called [${name}]`);
              switch(thingToCreate) {
                case 'monster':
                  databaseOperations.createNewMonster(name);
                  break;
                case 'item':
                  databaseOperations.createNewItem(name);
                  break;
              }
              sendMessage(`A${wordStartsWithVowel(thingToCreate) ? 'n' : ''} ${thingToCreate} called \`${name}\` has been added to the database.`)
            } else {
              console.log(`${thingToCreate} name undefined`);
            }
          } else {
              sendMessage('Invalid create command passed.');
          }
        } else {
          sendMessage(`${userAlias} is not authorized to perform this action.`);
        }
        break;
      case 'patch':
        if (isAdmin(userId)) {
          let thingToAdd = args[0];
          if (_.includes(['monster', 'item'], thingToAdd)) {
            let identifier = args[1];
            let propertyToModify = args[2];
            let newValue = args[3];
            console.log('\nidentifier: ', identifier)
            console.log('propertyToModify: ', propertyToModify)
            console.log('newValue: ', newValue, '\n')
            if (identifier && propertyToModify && newValue) {
              let dataChanged = false;
              switch(thingToAdd) {
                case 'monster':
                  dataChanged = databaseOperations.updatePropertyOfMonster(identifier, propertyToModify, newValue, sendMessage);
                  break;
                case 'item':
                  dataChanged = databaseOperations.updatePropertyOfItem(identifier, propertyToModify, newValue, sendMessage);
                  break;
              }
            }
          } else {
            console.log('Invalid patch command passed.')
          }
        } else {
          sendMessage(`${userAlias} is not authorized to perform this action.`);
        }
        break;
      case 'fetch':
        if (isAdmin(userId)) {
          switch(args[0]) {
            case 'monsters':
            case 'monster':
              databaseOperations.getMonsters().then((allMonsters) => {
                sendMessage('Monster Names: ' + String(Object.keys(allMonsters)).replaceAll(',', ', '))
                sendMessage('```' + JSON.stringify(allMonsters, null, 3) + '```')
              });
              break;
            case 'item':
            case 'items':
              databaseOperations.getItems().then((allItems) => {
                sendMessage('Item Names: ' + String(Object.keys(allItems)).replaceAll(',', ', '));
                sendMessage('```' + JSON.stringify(allItems, null, 3) + '```')
              });
              break;
            default:
              sendMessage('Invalid request.')
          }
        } else {
          sendMessage(`${userAlias} is not authorized to perform this action.`);
        }
        break;
      // =======================================================================================================
    }
  } catch (e) {
    console.log('it bombed out', e);
  }


  function sendMessage(msg) {
    message.channel.send(msg);
  }

});

client.on('interactionCreate', (interaction) => {
	if (!interaction.isButton()) return;
  console.log('---------------------------------');
  console.log('initating button press reaction... \n\n');

  const userId = interaction.user.id;
  const userAlias = interaction.member && interaction.member.nickname ? interaction.member.nickname : interaction.user.username;
  const buttonId = interaction.customId;

  console.log('button customId: ', buttonId);
  console.log('\n')

  if (_.includes(buttonId, userId)) {
    console.log('user is authorized for this action')
    // expected button id format is attribute_ATTRIBUTE_USERID
    if(_.includes(buttonId, 'attribute_')) {
      console.log('primary attribute button')
      // get character data for this character
      databaseOperations.getCharacterData(userId).then((character) => {
        if (character) {
          if (character.attributePoints > 0) {
            // remove user id and underscore from the button id to get the selected primary attribute
            let selectedPrimaryAttribute = buttonId.replace('_' + userId, '');
            // remove prefix from button id to get the selected priary attribute
            selectedPrimaryAttribute = selectedPrimaryAttribute.replace('attribute_', '');
            if (!_.includes(PRIMARY_ATTRIBUTES, selectedPrimaryAttribute)) {
              console.log('invalid attribute selected : ', selectedPrimaryAttribute);
              return;
            }

            databaseOperations.updatePrimaryAttribute(userId, selectedPrimaryAttribute, Number(character.primaryAttributes[selectedPrimaryAttribute]) + 1)
            databaseOperations.updateAttributePointTotal(userId, Number(character.attributePoints) - 1);

            character.primaryAttributes[selectedPrimaryAttribute] = character.primaryAttributes[selectedPrimaryAttribute] + 1;
            character.attributePoints = character.attributePoints - 1;

            let embeddedMessage = createStatDisplay(userAlias, character);
            if (character.attributePoints <= 0) {
              interaction.update({embeds: [embeddedMessage], components: []})
            } else {
              interaction.update({embeds: [embeddedMessage]})
            }
          } else {
            console.log('no more attribute points, removing buttons')
            interaction.update({components: []})
          }
        } else {
          console.log('no character found when trying to update primary attribute')
        }
      });
    }
    // expected button format is battle_ACTIONTYPE_USERID
    // interaction.message <-- message the button was on, use this to string manipulate
    if (_.includes(buttonId, 'battle_')) {
      console.log('pushed a battle button!')
      // remove action prefix
      let actionType = buttonId.replace('battle_', '');
      // remove user id suffix
      actionType = actionType.replace('_' + userId, '');
      if (_.includes(BATTLE_ACTION_TYPES, actionType)) {
        console.log('good to go (fight!)')
        //TODO: make database calls to fetch character and monster
        databaseOperations.getMonstersInLocation(userId).then((response) => {
          if (response.character && response.monsters) {
            let {character, monsters} = response;
            // TODO: enable more than one monster :>
            switch(actionType) {
              case 'attack':
                let battleOver = false;
                // 0 is player health, 1 is player mana, 2 is monster health
                let messageLines = interaction.message.content.split('\n');
                console.log('playerrrr: ', character)
                console.log('monsterrr: ', monsters['1']);
                let monsterName = _.startCase(monsters['1'].name);
                // Player attacks!
                let playerDamageDealt = calculateDamage(character, monsters['1']);
                let damageMessage = italic(`You attack the ${monsterName} for ${playerDamageDealt} damage`)
                // if it's the first log message, start the blockquote formatting
                if (messageLines.length === 3) {
                  damageMessage = blockQuote(damageMessage);
                }
                messageLines.push(damageMessage);
                // Subtract monster health
                let monsterHealthString = messageLines[2];
                let monsterCurrentHealth = Number(monsterHealthString.substring(monsterHealthString.search(/\d/)).split('/')[0]);
                if (monsterCurrentHealth - playerDamageDealt <= 0) {
                  messageLines[2] = messageLines[2].replace(monsterCurrentHealth, 0);
                  messageLines.push(bold(`You killed the ${monsterName}!`));
                  battleOver = true;
                } else {
                  messageLines[2] = messageLines[2].replace(monsterCurrentHealth, monsterCurrentHealth - playerDamageDealt);
                }

                if (!battleOver) {
                  // Monster attacks!
                  let monsterDamageDealt = calculateDamage(monsters['1'], character);
                  messageLines.push(italic(`${monsterName} attacks you for ${monsterDamageDealt} damage`));
                  // subtract player health
                  let playerHealthString = messageLines[0];
                  let playerCurrentHealth = Number(playerHealthString.substring(playerHealthString.search(/\d/)).split('/')[0]);
                  if (playerCurrentHealth - monsterDamageDealt <= 0) {
                    messageLines.push(bold(`The ${monsterName} defeated you!`));
                    messageLines[0] = messageLines[0].replace(playerCurrentHealth, 0);
                    battleOver = true;
                  } else {
                    messageLines[0] = messageLines[0].replace(playerCurrentHealth, playerCurrentHealth - monsterDamageDealt);
                  }
                }
                // update the battle message
                let updatedMessage = {content: messageLines.join('\n')};
                // if the battle is over, remove the buttons
                if (battleOver) {
                  updatedMessage.components = [];
                }
                interaction.update(updatedMessage);
                break;
            }
            function calculateDamage(attacker, defender) {
              //TODO: implement weapons / equipment
              //(Attack * Weapon Modifier + Weapon Damage) * (1 + (Accuracy - Target Evade)/100)
              let damage = attacker.secondaryAttributes.attack * (1 + (attacker.secondaryAttributes.accuracy - defender.secondaryAttributes.evade) / 100);
              console.log('damage before damage reduction: ', damage);
              // Damage Reduction
              damage = ((damage * ((100/(100+defender.secondaryAttributes.defense))))*((100/(100+defender.secondaryAttributes.evade))))-(defender.secondaryAttributes.armor*(1+(defender.secondaryAttributes.defense/1000)));
              console.log('damage after damage reduction: ', damage);
              if (damage < 0) {
                return 0;
              }
              return Math.round(damage);
            }
          }
        }).catch((err) => {
          console.log(err);
          console.log('something went wrong :( cannot fight');
        });
      }
    }
  } else {
    console.log('user is not authorized for this action')
  }
  console.log('---------------------------------\n\n')
  // console.log('------------------------------------------------------')
	// console.log(interaction);
  // console.log('------------------------------------------------------')
});


const PRIMARY_ATTRIBUTES = ['strength', 'agility', 'constitution', 'intellect', 'willpower', 'spirit'];
const BATTLE_ACTION_TYPES = ['attack', 'defend'];


client.login(process.env.BOT_TOKEN);

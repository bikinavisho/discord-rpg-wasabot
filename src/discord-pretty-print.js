import Discord, {MessageEmbed, MessageActionRow, MessageButton} from 'discord.js';
import {bold, italic, strikethrough, underscore, spoiler, quote, blockQuote} from '@discordjs/builders';
import _ from 'lodash';
import {calculateSecondaryAttributes} from './database/structs/character.js';

export function createStatIncreaseButtons(userId) {
  const prefix = 'attribute_'
  const row1 = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId(prefix + 'strength_' + userId)
        .setLabel('Strength')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(prefix + 'agility_' + userId)
        .setLabel('Agility')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(prefix + 'constitution_' + userId)
        .setLabel('Constitution')
        .setStyle('SECONDARY'),
    );
    const row2 = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId(prefix + 'intellect_' + userId)
          .setLabel('Intellect')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId(prefix + 'willpower_' + userId)
          .setLabel('Willpower')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId(prefix + 'spirit_' + userId)
          .setLabel('Spirit')
          .setStyle('SECONDARY'),
      );
      return [row1, row2];
}

export function createStatDisplay(userAlias, character) {
  if (!character.secondaryAttributes) {
    character = calculateSecondaryAttributes(character);
  }
  let embeddedMessage = new MessageEmbed()
    .setColor('RANDOM')
    .setTitle(`${userAlias}'s Character`)
    .setDescription(
      bold('Location') + ': ' + character.location + '\n' +
      bold('Experience Points') + ': ' + character.experiencePoints + '\n'
    )
    .addFields(
      {name: `Health (${character?.status?.currentHealth}/${character?.secondaryAttributes?.health})`, value: '[' + printResource(':red_square:', character?.status?.currentHealth, character?.secondaryAttributes?.health) + ']', inline: false},
      {name: `Mana (${character?.status?.currentMana}/${character?.secondaryAttributes?.mana})`, value: '[' + printResource(':blue_square:', character?.status?.currentMana, character?.secondaryAttributes?.mana) + ']', inline: false},
      {name: 'Strength', value: String(character?.primaryAttributes?.strength), inline: true},
      {name: 'Agility', value: String(character?.primaryAttributes?.agility), inline: true},
      {name: 'Constitution', value: String(character?.primaryAttributes?.constitution), inline: true},
      {name: 'Intellect', value: String(character?.primaryAttributes?.intellect), inline: true},
      {name: 'Willpower', value: String(character?.primaryAttributes?.willpower), inline: true},
      {name: 'Spirit', value: String(character?.primaryAttributes?.spirit), inline: true}
    );
  if (character.attributePoints > 0) {
    embeddedMessage.setFooter(`You have ${character.attributePoints} attribute points to spend. Click the buttons below to allocate 1 point to increase the selected attribute. `);
  }
  return embeddedMessage;
}

export function createSecondaryStatDisplay(userAlias, character) {
  if (!character.secondaryAttributes) {
    character = calculateSecondaryAttributes(character);
  }
  let embeddedMessage = new MessageEmbed()
    .setColor('RANDOM')
    .setTitle(`${userAlias}'s Secondary Attributes`)
    .addFields(
      {name: 'Attack', value: String(character?.secondaryAttributes?.attack), inline: true},
      {name: 'Defense', value: String(character?.secondaryAttributes?.defense), inline: true},
      {name: 'Magic Attack', value: String(character?.secondaryAttributes?.magicAttack), inline: true},
      {name: 'Magic Defense', value: String(character?.secondaryAttributes?.magicDefense), inline: true},
      {name: 'Evade', value: String(character?.secondaryAttributes?.evade), inline: true},
      {name: 'Accuracy', value: String(character?.secondaryAttributes?.accuracy), inline: true},
      {name: 'Armor', value: String(character?.secondaryAttributes?.armor), inline: true},
      {name: 'Magic Armor', value: String(character?.secondaryAttributes?.magicArmor), inline: true},
      {name: 'Max Health', value: String(character?.secondaryAttributes?.health), inline: true},
      {name: 'Max Mana', value: String(character?.secondaryAttributes?.mana), inline: true},
      {name: 'Health Regen', value: String(character?.secondaryAttributes?.healthRegen), inline: true},
      {name: 'Mana Regen', value: String(character?.secondaryAttributes?.manaRegen), inline: true},
      {name: 'Resilience', value: String(character?.secondaryAttributes?.resilience), inline: true},
    );

  return embeddedMessage;
}

export function printResource(icon, currentResource, maxResource) {
  let totalSquares = Math.round(Number(maxResource) / 5)
  let emptySquares = Math.round((Number(maxResource) - Number(currentResource)) / 5)
  return String(icon).repeat(totalSquares - emptySquares) + '⬛'.repeat(emptySquares);
}

export function createBattleActionButtons(userId) {
  const buttonPrefix = 'battle_';
  const row1 = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId(buttonPrefix +'attack_' + userId)
        .setLabel('⚔ Attack')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(buttonPrefix +'defend_' + userId)
        .setLabel('🛡 Defend')
        .setStyle('SECONDARY'),
    );
      return [row1];
}

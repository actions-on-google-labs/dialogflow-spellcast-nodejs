// Copyright 2019 Google Inc. All Rights Reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License"),
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  DifficultySetting,
  GameData,
  GameStateId,
  PlayerBonus,
  PlayerMessage,
  PlayerPlayingData,
  PlayerReadyData,
  Spell,
  SpellAccuracy,
  SpellElement,
  SpellMessage,
  SpellType
} from './spellcast_messages.js';

/**
 * Static class to hold constants for game tuning and balance.
 * @constructor
 */
let GameConstants = {
  /**
   * Maximum number of players supported. Assumes game can support this many
   * player assets.
   * @const {number}
   */
  MAX_PLAYERS: 4, // default to single player; max 4

  /** @type {!Array.<string>} Wizard names. */
  WIZARD_NAMES: [
    'Grand Wizard',
    'Ancient Wizard',
    'Roman Wizard',
    'Alien Wizard'
  ],

  /**
   * Number of ms to show full screen displays when the players win or lose.
   * @const {number}
   */
  ENDGAME_DISPLAY_DELAY: 5000,

  /**
   * Number of ms to show full screen display showing the instructions.
   * @const {number}
   */
  INSTRUCTIONS_DELAY: 10000,

  /**
   * Number of ms to play sound fx to warn players that time is running out.
   * This should be before the actual time limit of player action phase.
   * @const {number}
   */
  TIME_RUNNING_OUT_DELAY: 12000,

  /**
   * Duration of enemy or party death animation effect in msec.
   * @const {number}
   */
  DEATH_FX_DURATION: 2500,

  /**
   * Duration of explosion animation in msec.
   * @const {number}
   */
  EXPLOSION_FX_DURATION: 750,

  /**
   * Duration of heal effect in msec.
   * @const {number}
   */
  HEAL_FX_DURATION: 500,

  /**
   * Duration of shield effect in msec.
   * @const {number}
   */
  SHIELD_FX_DURATION: 500,

  /**
   * @const {number} Tint for a normal shield spell effect.
   */
  SHIELD_NORMAL_TINT: 0xF56F08,

  /**
   * @const {number} Tint for a shield spell effect with a shield bonus.
   */
  SHIELD_BONUS_TINT: 0xAA3333,

  /**
   * Constants used for player action phase duration (in milliseconds) based on
   * the game difficulty.
   * @const {!Map.<!DifficultySetting, number>}
   */
  DIFFICULTY_ACTION_PHASE_DURATION_MAP: new Map([
    [DifficultySetting.EASY, 15000],
    [DifficultySetting.NORMAL, 12000],
    [DifficultySetting.HARD, 9000]
  ]),

  /**
   * Constants used to calculate player attack spell damage based on the accuracy
   * of the drawing.
   * @const {!Map.<!SpellAccuracy, number>}
   */
  PLAYER_ATTACK_SPELL_DAMAGE_MAP: new Map([
    [SpellAccuracy.GOOD, 1],
    [SpellAccuracy.GREAT, 2],
    [SpellAccuracy.PERFECT, 3]
  ]),

  /**
   * Constants used to calculate player heal spell value based on the accuracy
   * of the drawing.
   * @const {!Map.<!SpellAccuracy, number>}
   */
  PLAYER_HEAL_SPELL_VALUE_MAP: new Map([
    [SpellAccuracy.GOOD, 1],
    [SpellAccuracy.GREAT, 2],
    [SpellAccuracy.PERFECT, 3]
  ]),

  /**
   * Constants used to calculate player shield damage reductions based on the
   * accuracy of the drawing.
   * @const {!Map.<!SpellAccuracy, number>}
   */
  PLAYER_SHIELD_SPELL_VALUE_MAP: new Map([
    [SpellAccuracy.GOOD, 2],
    [SpellAccuracy.GREAT, 3],
    [SpellAccuracy.PERFECT, 4]
  ]),

  /**
   * Constants used for the players party initial health based on the number of
   * players in the game. Index is the number of players, values is party health.
   * @const {!Array.<number>}
   */
  PARTY_INITIAL_HEALTH_MAP: [0, 10, 20, 30, 40],

  /**
   * Constants used for the enemy initial health based on the number of players in
   * the party. Index is the number of players, values is enemy health.
   * @const {!Array.<number>}
   */
  ENEMY_INITIAL_HEALTH_MAP: [0, 20, 40, 60, 80],

  /**
   * Constants used to scale player heal sprites based on spell accuracy.
   * @const {!Map.<!SpellAccuracy, number>}
   */
  PLAYER_HEAL_SPRITE_SCALE_MAP: new Map([
    [SpellAccuracy.GOOD, 1.0],
    [SpellAccuracy.GREAT, 1.2],
    [SpellAccuracy.PERFECT, 1.5]
  ]),

  /**
   * Constants used to adjust scale of player attack sprites based on spell
   * accuracy.
   * @const {!Map.<!SpellAccuracy, number>}
   */
  PLAYER_ATTACK_SPRITE_SCALE_MAP: new Map([
    [SpellAccuracy.GOOD, 0.5],
    [SpellAccuracy.GREAT, 0.8],
    [SpellAccuracy.PERFECT, 1.25]
  ]),

  /**
   * Constants used to adjust player casting sprite alphas based on spell
   * accuracy.
   * @const {!Map.<!SpellAccuracy, number>}
   */
  PLAYER_CASTING_SPRITE_ALPHA_MAP: new Map([
    [SpellAccuracy.GOOD, 0.3],
    [SpellAccuracy.GREAT, 0.6],
    [SpellAccuracy.PERFECT, 1.0]
  ]),

  /**
   * List of elements to randomly pick from.
   * @const {!Array.<!SpellElement>}
   */
  RANDOM_ELEMENTS: [
    SpellElement.AIR,
    SpellElement.WATER,
    SpellElement.FIRE,
    SpellElement.EARTH
  ],

  /**
   * List of player bonuses to randomly pick from.
   * NONE is repeated so that is happens more often.
   * @const {!Array.<!PlayerBonus>}
   */
  RANDOM_PLAYER_BONUS: [
    PlayerBonus.NONE,
    PlayerBonus.NONE,
    PlayerBonus.ATTACK,
    PlayerBonus.SHIELD,
    PlayerBonus.HEAL

  ],

  /**
   * @const {number} Amount of damage the enemy will heal if the players attack
   *     with the same element the enemy has.
   */
  ENEMY_HEAL_VALUE: 3,

  /**
   * @const {number} Player attack bonus value
   */
  PLAYER_ATTACK_BONUS: 1,

  /**
   * @const {number} Player heal bonus value.
   */
  PLAYER_HEAL_BONUS: 1,

  /**
   * @const {number} Player shield bonus value.
   */
  PLAYER_SHIELD_BONUS: 1,

  /**
   * Constants used for enemy attack damage calculation.
   * @enum {number} The damage for the attack.
   */
  ENEMY_ATTACK_STRENGTH: {
    WEAK: 4,
    MEDIUM: 5,
    STRONG: 6
  },

  /**
   * Constants used to calculate enemy attack spell damage based on the number of
   * players in the party. Index is the number of players. Value is spell damage.
   * @const {!Array.<number>}
   */
  ENEMY_STRENGTH_BONUS_MAP: [0, 0, 3, 6, 9],

  /**
   * List of enemy attack strengths to pick from.
   * @const {!Array.<!ENEMY_ATTACK_STRENGTH>}
   */
  RANDOM_ENEMY_ATTACK_STRENGTHS: [
    4,
    5,
    6
  ],

  /** @type {number} Initial x position of a player. */
  PLAYER_X_POS: 0.1,

  /** @type {number} Initial y position of a player. */
  PLAYER_Y_POS: 0.8,

  /** @type {number} X position offset of a player casting a spell. */
  PLAYER_SPELL_X_OFFSET: 0.06,

  /** @type {string} Waiting for players message when the game starts. */
  WAITING_FOR_PLAYERS_TEXT: 'SPELLCAST\n\nWaiting for players to join game...\n',

  /** @type {string} Message when max players reached when the game starts. */
  MAX_PLAYERS_TEXT: 'SPELLCAST\n\nMaximum players reached...\n',


  /** @type {!Array.<string>} Player countdown messages (desconding order). */
  PLAYER_COUNTDOWN: [
    '3',
    '2',
    '1'
  ],

  /** @type {string} Waiting for player actions message. */
  WAITING_FOR_PLAYER_ACTIONS_TEXT: 'Waiting for players to draw spells...\n',
}
export {
  GameConstants
}
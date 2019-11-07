// Copyright 2019 Google Inc. All Rights Reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
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
/** @fileoverview JSON serializable custom messages used by spellcast. */

/**
 * @enum {number} Game difficulty settings.
 * @export
 */

let DifficultySetting = {
  UNKNOWN: 0,
  EASY: 1,
  NORMAL: 2,
  HARD: 3
};

/**
 * @enum {number} Player bonus.
 * @export
 */

let PlayerBonus = {
  UNKNOWN: 0,
  NONE: 1,
  ATTACK: 2,
  HEAL: 3,
  SHIELD: 4
};

/**
 * @enum {number} Type of spell cast.
 * @export
 */

let SpellType = {
  UNKNOWN: 0,
  BASIC_ATTACK: 1,
  HEAL: 2,
  SHIELD: 3
};

/**
 * @enum {number} Element used in spell.
 * @export
 */
let SpellElement = {
  UNKNOWN: 0,
  NONE: 1,
  AIR: 2,
  WATER: 3,
  FIRE: 4,
  EARTH: 5
};

/**
 * @enum {number} Spell accuracy.
 * @export
 */

let SpellAccuracy = {
  UNKNOWN: 0,
  PERFECT: 1,
  GREAT: 2,
  GOOD: 3
};

/**
 * @enum {number} The different spellcast game state identifiers.
 * @export
 */

let GameStateId = {
  UNKNOWN: 0,
  WAITING_FOR_PLAYERS: 1,
  INSTRUCTIONS: 2,
  PLAYER_ACTION: 3,
  PLAYER_RESOLUTION: 4,
  ENEMY_RESOLUTION: 5,
  PLAYER_VICTORY: 6,
  ENEMY_VICTORY: 7,
  PAUSED: 8
};

/**
 * JSON serializable game data that persists while the game is running. All
 * responses will include properties are exported to preserve their names during
 * compilation.
 * @struct
 * @constructor
 * @export
 */
class GameData {
  constructor() {
    /**
     * @type {GameStateId}
     */
    this.gameStateId = GameStateId.UNKNOWN;
  };
}



/**
 * JSON serializable extra message data added to a PLAYER_READY message from the
 * sender. The game will persist this as player data with a player stored in the
 * game manager. Properties are exported to preserve their names during
 * compilation.
 * @struct
 * @constructor
 * @export
 */
class PlayerReadyData {
  constructor() {
    /**
     * @type {string}
     */
    this.playerName = '';

    /**
     * @type {number}
     */
    this.avatarIndex = 0;
  };
}



/**
 * JSON serializable extra message data added to a PLAYER_PLAYING message from
 * the sender. Properties are exported to preserve their names during
 * compilation.
 * @struct
 * @constructor
 * @export
 */
class PlayerPlayingData {
  constructor() {
    /**
     * @type {DifficultySetting}
     */
    this.difficultySetting =
      DifficultySetting.EASY;
  };
}



/**
 * JSON serializable message sent to players. Properties are exported to
 * preserve their names during compilation.
 * @struct
 * @constructor
 * @export
 */
class PlayerMessage {
  constructor() {
    /**
     * @type {PlayerBonus}
     */
    this.playerBonus = PlayerBonus.NONE;

    /**
     * @type {number}
     */
    this.castSpellsDurationMillis = 0;
  };
}



/**
 * Describes one spell cast by a player. Used in #SpellMessage. Properties are
 * exported to preserve their names during compilation.
 * @struct
 * @constructor
 * @export
 */
class Spell {
  constructor() {
    /**
     * @type {SpellType}
     */
    this.spellType = SpellType.UNKNOWN;

    /**
     * @type {SpellElement}
     */
    this.spellElement = SpellElement.NONE;

    /**
     * @type {SpellAccuracy}
     */
    this.spellAccuracy = SpellAccuracy.GOOD;
  };
}



/**
 * JSON serializable message from the sender specifying spells cast by the
 * player. Properties are exported to preserve their names during compilation.
 * @struct
 * @constructor
 * @export
 */
class SpellMessage {
  constructor() {
    /**
     * @type {!Array.<!Spell>}
     */
    this.spells = [];
  };
}

/**
 * @enum {number} Game play state.
 * @export
 */
let GameplayState = {
  UNKNOWN: 0,
  PAUSED: 1,
  RUNNING: 2,
  SHOWING_INFO_SCREEN: 3
};

/**
 * @enum {number} Game play state.
 * @export
 */
let PlayerState = {
  UNKNOWN: 0,
  PLAYING: 1,
  AVAILABLE: 2,
  READY: 3,
  QUIT: 4,
  IDLE: 5
};

/**
 * @enum {number} Status code.
 * @export
 */
let StatusCode = {
  UNKNOWN: 0,
  SUCCESS: 1
};

/**
 * @enum {number} Event type.
 * @export
 */
let EventType = {
  UNKNOWN: 0,
  PLAYER_IDLE: 1,
  PLAYER_PLAYING: 2,
  PLAYER_QUIT: 3,
  PLAYER_DROPPED: 4,
  PLAYER_IDLE: 5,
  PLAYER_READY: 6,
  PLAYER_AVAILABLE: 7,
  GAME_MESSAGE_RECEIVED: 8,
  GAME_LOADING: 9,
  GAME_RUNNING: 10,
  GAME_PAUSED: 11,
  GAME_SHOWING_INFO_SCREEN: 12,
  LOBBY_OPEN: 13,
  LOBBY_CLOSED: 14,
  PLAYER_DATA_CHANGED: 15,
  GAME_DATA_CHANGED: 16,
  GAME_STATUS_TEXT_CHANGED: 17
};

/**
 * @enum {number} Lobby state.
 * @export
 */
let LobbyState = {
  UNKNOWN: 0,
  CLOSED: 1,
  OPEN: 2
};

export {
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
  SpellType,
  GameplayState,
  PlayerState,
  StatusCode,
  EventType,
  LobbyState
}
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
// limitations under the License

import {
  GameConstants
} from '../game_constants.js';
import {
  State
} from '../state.js';
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
  SpellType,
  GameplayState,
  PlayerState,
  StatusCode,
  EventType
} from '../spellcast_messages.js';

/**
 * Shows paused screen until a player sends a "playing" message.
 * @param {!SpellcastGame} game
 * @param {!StateMachine} stateMachine
 * @param {!ActionManager} actionManager
 * @constructor
 * @implements {State}
 */
class PausedState extends State {
  constructor(game, stateMachine,
    actionManager) {
    super();
    /** @private {!SpellcastGame} */
    this.game_ = game;

    /** @private {!GameManager} */
    this.gameManager_ = this.game_.getGameManager();

    /** @private {!ActionManager} */
    this.actionManager_ = actionManager;

    /** @private {!StateMachine} */
    this.stateMachine_ = stateMachine;

    /** @private {GameStateId} */
    this.previousStateId_ = GameStateId.UNKNOWN;

    /**
     * Reusable array of players to move to idle state or move out of idle state.
     * @private {!Array.<PlayerInfo>}
     */
    this.idlePlayers_ = [];

    /**
     * Pre-bound handler when a player sends a playing message.
     * @private {function(!Event)}
     */
    this.boundPlayerPlayingCallback_ = this.onPlayerPlaying_.bind(this);
  };


  /** @override */
  onEnter(previousStateId) {
    this.previousStateId_ = previousStateId;
    this.game_.getPausedDisplay().activate(this.game_.getTopLeftPosition());

    this.gameManager_.updateGameplayState(
      GameplayState.PAUSED, null);
    this.actionManager_.pause();

    // Move all players to IDLE state and change game state to PAUSED.
    this.gameManager_.getPlayersInState(PlayerState.PLAYING,
      this.idlePlayers_);
    for (let i = 0; i < this.idlePlayers_.length; i++) {
      this.gameManager_.updatePlayerState(this.idlePlayers_[i].playerId,
        PlayerState.IDLE, null);
    }

    // Listen to when a player tries to unpause the game.
    this.gameManager_.addEventListener(
      EventType.PLAYER_PLAYING,
      this.boundPlayerPlayingCallback_);

    interactiveCanvas.sendTextQuery('quit');
  };


  /** @override */
  onUpdate() {};


  /** @override */
  onExit(nextStateId) {
    // Stop listening to when a player tries to unpause the game.
    this.gameManager_.removeEventListener(
      EventType.PLAYER_PLAYING,
      this.boundPlayerPlayingCallback_);

    // Move all IDLE players to PLAYING and change game state to RUNNING.
    this.gameManager_.getPlayersInState(PlayerState.IDLE,
      this.idlePlayers_);
    for (let i = 0; i < this.idlePlayers_.length; i++) {
      this.gameManager_.updatePlayerState(this.idlePlayers_[i].playerId,
        PlayerState.PLAYING, null);
    }

    this.actionManager_.resume();
    this.gameManager_.updateGameplayState(
      GameplayState.RUNNING, null);

    this.game_.getPausedDisplay().deactivate();
  };


  /**
   * Handles when a player sends a playing message.
   * @param {!Event} event
   * @private
   */
  onPlayerPlaying_(event) {
    if (event.statusCode != StatusCode.SUCCESS) {
      console.log('Error: Event status code: ' + event.statusCode);
      console.log('Reason for error: ' + event.errorDescription);
      return;
    }
    this.stateMachine_.goToState(this.previousStateId_);
  };
}
export {
  PausedState
}
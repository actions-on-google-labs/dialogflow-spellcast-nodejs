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
 * @param {!SpellcastGame} game
 * @param {!StateMachine} stateMachine
 * @param {!ActionManager} actionManager
 * @constructor
 * @implements {State}
 */
class EnemyResolutionPhase extends State {
  constructor(game,
    stateMachine, actionManager) {
    super();
    /** @private {!SpellcastGame} */
    this.game_ = game;

    /** @private {!GameManager} */
    this.gameManager_ = this.game_.getGameManager();

    /** @private {!StateMachine} */
    this.stateMachine_ = stateMachine;

    /** @private {!ActionManager} */
    this.actionManager_ = actionManager;

    /** @private {boolean} */
    this.showedPartyDeath_ = false;

    /**
     * Pre-bound call to #onPlayerIdle which is used to pause the game.
     * @private {function(Event)}
     */
    this.boundPlayerIdleCallback_ = this.onPlayerIdle_.bind(this);
  };


  /** @override */
  onEnter(previousStateId) {
    // Do not initialize this state if the game was unpaused.
    if (previousStateId == GameStateId.PAUSED) {
      return;
    }

    if (this.game_.getEnemyElement() ==
      SpellElement.NONE) {
      throw Error('No enemy element selected.');
    }

    let connectedPlayers = this.gameManager_.getConnectedPlayers();
    let numberConnectedPlayers = connectedPlayers.length;
    if (numberConnectedPlayers == 0) {
      throw Error('No players for the enemy to attack.');
    }
    let victimIndex = Math.floor(Math.random() * numberConnectedPlayers);

    let attackStrengthIndex = Math.floor(Math.random() *
      GameConstants.RANDOM_ENEMY_ATTACK_STRENGTHS.length);
    let attackStrength = GameConstants.
    RANDOM_ENEMY_ATTACK_STRENGTHS[attackStrengthIndex];

    let enemy = this.game_.getEnemy();
    if (!enemy) {
      throw Error('No enemy found for enemy resolution phase.');
    }

    let victim = this.game_.getPlayer(connectedPlayers[victimIndex].playerId);
    let actions = this.actionManager_.getActionList();
    actions.push(this.actionManager_.getEnemyAttackAction(
      enemy,
      victim,
      this.game_.getEnemyElement(),
      attackStrength));
    this.actionManager_.startExecuting(actions);

    this.showedPartyDeath_ = false;

    this.gameManager_.addEventListener(
      EventType.PLAYER_IDLE,
      this.boundPlayerIdleCallback_);
  };


  /** @override */
  onUpdate() {
    if (this.actionManager_.isDone()) {
      if (this.game_.getPartyHealth() > 0) {
        this.stateMachine_.goToState(
          GameStateId.PLAYER_ACTION);
      } else if (!this.showedPartyDeath_) {
        // Before going to enemy victory state, execute party death action.
        let actions = this.actionManager_.getActionList();
        actions.push(this.actionManager_.getPartyDeathAction());
        this.actionManager_.reset();
        this.actionManager_.startExecuting(actions);
        this.showedPartyDeath_ = true;
      } else {
        // Party death action finished, so go to enemy victorys tate.
        this.stateMachine_.goToState(
          GameStateId.ENEMY_VICTORY);
      }
    }
  };


  /** @override */
  onExit(nextStateId) {
    this.gameManager_.removeEventListener(
      EventType.PLAYER_IDLE,
      this.boundPlayerIdleCallback_);
  };


  /**
   * Handles when a player pauses.
   * @param {Event} event
   * @private
   */
  onPlayerIdle_(event) {
    if (event.statusCode != StatusCode.SUCCESS) {
      console.log('Error: Event status code: ' + event.statusCode);
      console.log('Reason for error: ' + event.errorDescription);
      return;
    }
    // Check if the game is already paused.
    if (this.gameManager_.getGameplayState() ==
      GameplayState.PAUSED) {
      return;
    }

    this.stateMachine_.goToState(
      GameStateId.PAUSED);
  };
}
export {
  EnemyResolutionPhase
}
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
class PlayerResolutionPhase extends State {

  constructor(game, stateMachine, actionManager) {
    super();
    /** @private {!SpellcastGame} */
    this.game_ = game;

    /** @private {!GameManager} */
    this.gameManager_ = this.game_.getGameManager();

    /** @private {!StateMachine} */
    this.stateMachine_ = stateMachine;

    /** @private {!ActionManager} */
    this.actionManager_ = actionManager;

    /**
     * This will be provided by the previous state (PlayerActionPhase).
     * Keys are player ids, values are the actions that player took this round.
     * @private {Object.<string, !Array.<!Action>>}
     */
    this.playerActions_ = null;

    /** @private {gameobjects.Enemy} */
    this.enemy_ = null;

    /** @private {boolean} */
    this.showedEnemyDeath_ = false;

    /**
     * Pre-bound call to #onPlayerIdle which is used to pause the game.
     * @private {function(Event)}
     */
    this.boundPlayerIdleCallback_ = this.onPlayerIdle_.bind(this);

    /**
     * ID of player resolution phase state.
     * @const {string}
     */
    this.ID = 'PlayerResolutionPhase';
  };


  /** @override */
  onEnter(previousStateId) {
    // Do not initialize the state if unpausing the game.
    if (previousStateId == GameStateId.PAUSED) {
      return;
    }

    if (!this.playerActions_) {
      throw Error('No player actions provided for the PlayerResolutionPhase');
    }

    this.game_.resetNumberOfShieldSpellsCastThisRound();

    // Sort player actions so that we end up with array where player turns happen
    // one at a time instead of a player executing all their actions before moving
    // to the next player.
    let sortedActions = this.actionManager_.getActionList();
    let currentSpellIndex = 0;
    let keys = Object.keys(this.playerActions_);

    let allPlayersDone = false;
    while (!allPlayersDone) {
      allPlayersDone = true;
      for (let i = 0; i < keys.length; i++) {
        let currentPlayerActions = this.playerActions_[keys[i]];
        if (currentSpellIndex < currentPlayerActions.length) {
          allPlayersDone = false;
          sortedActions.push(currentPlayerActions[currentSpellIndex]);
        }
      }
      currentSpellIndex++;
    }
    this.actionManager_.startExecuting(sortedActions);

    this.enemy_ = this.game_.getEnemy();
    this.showedEnemyDeath_ = false;

    this.gameManager_.addEventListener(
      EventType.PLAYER_IDLE,
      this.boundPlayerIdleCallback_);
  };


  /** @override */
  onUpdate() {
    if (this.actionManager_.isDone()) {
      if (this.game_.getEnemyHealth() > 0) {
        this.stateMachine_.goToState(
          GameStateId.ENEMY_RESOLUTION);
      } else if (!this.showedEnemyDeath_ && this.enemy_) {
        // Before going to player victory state, execute enemy death action.
        let actions = this.actionManager_.getActionList();
        actions.push(this.actionManager_.getEnemyDeathAction(this.enemy_));
        this.actionManager_.reset();
        this.actionManager_.startExecuting(actions);
        this.showedEnemyDeath_ = true;
      } else {
        this.stateMachine_.goToState(
          GameStateId.PLAYER_VICTORY);
      }
    }
  };


  /** @override */
  onExit(nextStateId) {
    // Do not clean up player actions and shield accounting if pausing.
    if (nextStateId == GameStateId.PAUSED) {
      return;
    }

    this.gameManager_.removeEventListener(
      EventType.PLAYER_IDLE,
      this.boundPlayerIdleCallback_);

    if (this.playerActions_) {
      // Release just the action lists from all players - the actions themselves
      // were already released when they were passed to the sortedActions list.
      let keys = Object.keys(this.playerActions_);
      for (let i = 0; i < keys.length; i++) {
        this.actionManager_.releaseActionList(this.playerActions_[keys[i]],
          /* opt_releaseListOnly */
          true);
      }
    }

    this.playerActions_ = null;
    this.game_.resetNumberOfShieldSpellsCastThisRound();
  };


  /**
   * Provides the actions to be executed in this phase.
   * @param {!Object.<string,
   *     !Array.<!Action>>} playerActions Keys are player
   *     IDs, values are the actions that player took this round.
   */
  setPlayerActions(playerActions) {
    this.playerActions_ = playerActions;
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
  PlayerResolutionPhase
}
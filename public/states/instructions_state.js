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
 * Shows the game instructions for a limited period of time.
 * @param {!SpellcastGame} game
 * @param {!StateMachine} stateMachine
 * @param {!ActionManager} actionManager
 * @constructor
 * @implements {State}
 */
class InstructionsState extends State {
  constructor(game, stateMachine,
    actionManager) {
    super();
    /** @private {!SpellcastGame} */
    this.game_ = game;

    /** @private {!GameManager} */
    this.gameManager_ = game.getGameManager();

    /** @private {!StateMachine} */
    this.stateMachine_ = stateMachine;

    /** @private {!ActionManager} */
    this.actionManager_ = actionManager;
  };


  /** @override */
  onEnter(previousStateId) {
    let instructionsDisplay = this.game_.getInstructionsDisplay();
    if (!instructionsDisplay) {
      throw Error('No instructions display');
    }
    let actions = this.actionManager_.getActionList();
    actions.push(this.actionManager_.getFullScreenDisplayAction(
      instructionsDisplay,
      GameConstants.INSTRUCTIONS_DELAY));
    this.actionManager_.startExecuting(actions);

    this.gameManager_.updateGameplayState(
      GameplayState.SHOWING_INFO_SCREEN, null);
  };


  /** @override */
  onUpdate() {
    // Exit early if all players dropped out.
    if (this.gameManager_.getConnectedPlayers().length == 0) {
      this.stateMachine_.goToState(
        GameStateId.WAITING_FOR_PLAYERS);
      return;
    }

    if (!this.actionManager_.isDone()) {
      return;
    }

    this.stateMachine_.goToState(
      GameStateId.PLAYER_ACTION);
  };


  /** @override */
  onExit(nextStateId) {
    this.actionManager_.reset();

    if (nextStateId == GameStateId.PLAYER_ACTION) {
      this.gameManager_.updateGameplayState(
        GameplayState.RUNNING, null);
      this.game_.setupWorld();
    }
  };
}
export {
  InstructionsState
}
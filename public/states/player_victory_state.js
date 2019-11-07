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
class PlayerVictoryState extends State {

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
  };

  /** @override */
  onEnter(previousStateId) {
    this.game_.getEnemyHealthDisplay().deactivate();
    this.game_.getPartyHealthDisplay().deactivate();
    this.game_.getBattlefieldDisplay().deactivate();

    // Show the player victory display.
    let playerVictoryDisplay = this.game_.getPlayerVictoryDisplay();
    if (!playerVictoryDisplay) {
      throw Error('No player victory display');
    }
    let actions = this.actionManager_.getActionList();
    actions.push(this.actionManager_.getFullScreenDisplayAction(
      playerVictoryDisplay,
      GameConstants.ENDGAME_DISPLAY_DELAY));
    this.actionManager_.startExecuting(actions);

    this.gameManager_.updateGameplayState(
      GameplayState.SHOWING_INFO_SCREEN, null);

    // Transition all players to idle.
    let players = this.gameManager_.getPlayersInState(
      PlayerState.PLAYING);
    for (let i = 0; i < players.length; i++) {
      this.gameManager_.updatePlayerState(players[i].playerId,
        PlayerState.IDLE, null);
    }

    this.game_.removeAllPlayers();
    this.game_.removeEnemy();
  };


  /** @override */
  onUpdate() {
    if (this.actionManager_.isDone()) {
      this.stateMachine_.goToState(
        GameStateId.WAITING_FOR_PLAYERS);
    }
  };


  /** @override */
  onExit(nextStateId) {
    // Transition all players to available.
    let players = this.gameManager_.getPlayersInState(
      PlayerState.IDLE);
    for (let i = 0; i < players.length; i++) {
      this.gameManager_.updatePlayerState(players[i].playerId,
        PlayerState.AVAILABLE, null);
    }

    this.game_.getPlayerVictoryDisplay().deactivate();

    this.gameManager_.updateGameplayState(
      GameplayState.RUNNING, null);

    this.actionManager_.reset();
  };
}
export {
  PlayerVictoryState
}
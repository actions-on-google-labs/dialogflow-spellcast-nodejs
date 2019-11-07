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
  ActionParser
} from '../action_parser.js';
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
class PlayerActionPhase extends State {

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

    /** @private {number} */
    this.startTime_ = 0;

    /** @private {boolean} */
    this.waitingForInitialDelay_ = true;

    /** @private {boolean} */
    this.waitingForTurnEnding_ = true;

    /** @private {boolean} */
    this.waitingForRandomAi_ = true;

    /**
     * Keys are player IDs.
     * @private {!Object.<string, Array.<!Action>>}
     */
    this.actions_ = Object.create(null);

    /**
     * Set of player IDs that already sent their action.
     * @private {!Array.<string>}
     */
    this.receivedPlayerIds_ = [];

    /**
     * Pre-bound handler a player sends a game message.
     * @private {function(!Event)}
     */
    this.boundGameMessageCallback_ = this.onGameMessage_.bind(this);

    /**
     * Pre-bound handler when a player quits.
     * @private {function(!Event)}
     */
    this.boundPlayerQuitCallback_ = this.onPlayerQuit_.bind(this);

    /**
     * Pre-bound call to #onPlayerIdle which is used to pause the game.
     * @private {function(Event)}
     */
    this.boundPlayerIdleCallback_ = this.onPlayerIdle_.bind(this);
  };


  /** @override */
  onEnter(previousStateId) {
    if (this.gameManager_.getConnectedPlayers().length == 0) {
      this.stateMachine_.goToState(
        GameStateId.WAITING_FOR_PLAYERS);
      return;
    }

    // Regardless if the game was paused or not these listeners must be set
    // because either they were not set initially or removed by #onExit.
    this.gameManager_.addEventListener(
      EventType.GAME_MESSAGE_RECEIVED,
      this.boundGameMessageCallback_);
    this.gameManager_.addEventListener(
      EventType.PLAYER_QUIT,
      this.boundPlayerQuitCallback_);
    this.gameManager_.addEventListener(
      EventType.PLAYER_DROPPED,
      this.boundPlayerQuitCallback_);
    this.gameManager_.addEventListener(
      EventType.PLAYER_IDLE,
      this.boundPlayerIdleCallback_);

    // Do not initialize the state if the game was unpaused.
    if (previousStateId == GameStateId.PAUSED) {
      return;
    }

    // Clear any player actions.
    let actionKeys = Object.keys(this.actions_);
    for (let i = 0; i < actionKeys.length; i++) {
      delete this.actions_[actionKeys[i]];
    }

    // Drop shield.
    this.game_.disablePartyShield();

    // No player IDs sent any actions yet.
    this.receivedPlayerIds_.length = 0;

    // Make sure connected players are activated.
    let connectedPlayers = this.gameManager_.getConnectedPlayers();
    for (let i = 0; i < connectedPlayers.length; i++) {
      let player = this.game_.getPlayer(connectedPlayers[i].playerId);
      player.activate(player.battlePosition, /* showNameText */ false);
    }

    // Select the enemy's element and show it so the players can strategize.
    this.game_.selectEnemyElement();

    // Start countdown.
    let actions = this.actionManager_.getActionList();
    actions.push(this.actionManager_.getCountdownAction());
    this.actionManager_.startExecuting(actions);

    // Wait for initial delay for this round.
    this.waitingForInitialDelay_ = true;

    // Wait for the beginning of the end of turn.
    this.waitingForTurnEnding_ = true;

    // Wait for random AI.
    this.waitingForRandomAi_ = true;
  };


  /** @override */
  onUpdate(deltaTime) {
    let currentTime = Date.now();

    if (this.waitingForInitialDelay_ && this.actionManager_.isDone()) {
      // When the countdown finishes, notify players to start drawing.
      this.startTime_ = currentTime;
      this.game_.assignBonusesAndNotifyPlayers();
      this.waitingForInitialDelay_ = false;
    }

    if (!this.waitingForInitialDelay_ &&
      this.game_.randomAiEnabled && this.waitingForRandomAi_) {
      this.game_.testCreatePlayerActions();
      this.waitingForRandomAi_ = false;
    }

    if (!this.waitingForInitialDelay_ && this.waitingForTurnEnding_ &&
      currentTime - this.startTime_ >
      GameConstants.TIME_RUNNING_OUT_DELAY) {
      this.waitingForTurnEnding_ = false;
    }
  };


  /**
   * Handles when a player sends a game message.
   * @param {!Event} event
   * @private
   */
  onGameMessage_(event) {
    if (event.statusCode != StatusCode.SUCCESS) {
      console.log('Error: Event status code: ' + event.statusCode);
      console.log('Reason for error: ' + event.errorDescription);
      return;
    }
    if (!event.requestExtraMessageData) {
      return;
    }

    let playerId = event.playerInfo.playerId;
    let spellMessage =
      /** @type {!SpellMessage} */
      (
        event.requestExtraMessageData);
    let caster = this.game_.getPlayer(playerId);
    if (!caster) {
      throw Error('Got actions from an unknown player ID: ' +
        event.playerInfo.playerId);
    }
    let enemy = this.game_.getEnemy();
    if (!enemy) {
      throw Error('No enemy defined during player action phase.');
    }

    let actions = ActionParser.parse(
      this.actionManager_, caster, enemy, spellMessage.spells);
    this.actions_[playerId] = actions;
    if (this.receivedPlayerIds_.indexOf(playerId) == -1) {
      this.receivedPlayerIds_.push(playerId);
    }

    // Check if everyone sent in their actions (or someone dropped while we
    // received a message).
    if (this.receivedPlayerIds_.length >=
      this.gameManager_.getConnectedPlayers().length) {
      let playerResolution = this.stateMachine_.getState(
        GameStateId.PLAYER_RESOLUTION);
      playerResolution.setPlayerActions(this.actions_);
      this.stateMachine_.goToState(
        GameStateId.PLAYER_RESOLUTION);
    }
  };


  /**
   * Handles a player quits.
   * @param {!Event} event
   * @private
   */
  onPlayerQuit_(event) {
    if (event.statusCode != StatusCode.SUCCESS) {
      console.log('Error: Event status code: ' + event.statusCode);
      console.log('Reason for error: ' + event.errorDescription);
      return;
    }
    let playerId = event.playerInfo.playerId;
    delete this.actions_[playerId];

    if (this.gameManager_.getConnectedPlayers().length == 0) {
      this.stateMachine_.goToState(
        GameStateId.WAITING_FOR_PLAYERS);
    }
  };


  /** @override */
  onExit(nextStateId) {
    // Regardless if the game is paused or not, these listeners must be removed
    // since they use state-specific callbacks.
    this.gameManager_.removeEventListener(
      EventType.GAME_MESSAGE_RECEIVED,
      this.boundGameMessageCallback_);
    this.gameManager_.removeEventListener(
      EventType.PLAYER_QUIT,
      this.boundPlayerQuitCallback_);
    this.gameManager_.removeEventListener(
      EventType.PLAYER_DROPPED,
      this.boundPlayerQuitCallback_);
    this.gameManager_.removeEventListener(
      EventType.PLAYER_IDLE,
      this.boundPlayerIdleCallback_);

    // Do not clean up if the game is paused, but do not process game manager
    // messages (so this line should be after the removeEventListener calls).
    if (nextStateId == GameStateId.PAUSED) {
      return;
    }

    this.startTime_ = 0;
    this.game_.getWaitingPlayerActionDisplay().deactivate();
    this.actionManager_.reset();
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
  PlayerActionPhase
}
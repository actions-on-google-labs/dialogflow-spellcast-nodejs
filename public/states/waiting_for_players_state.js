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
  EventType,
  LobbyState
} from '../spellcast_messages.js';

/**
 * @param {!SpellcastGame} game
 * @param {!StateMachine} stateMachine
 * @constructor
 * @implements {State}
 */
class WaitingForPlayersState extends State {

  constructor(game,
    stateMachine) {
    super();
    /** @private {!SpellcastGame} */
    this.game_ = game;

    /** @private {!StateMachine} */
    this.stateMachine_ = stateMachine;

    /** @private {!GameManager} */
    this.gameManager_ = this.game_.getGameManager();

    /** @private {number} */
    this.waitingForRandomAiDelay_ = 0;

    /**
     * A reusable array of ready players that is updated in #onUpdate.
     * @private {!Array.<!PlayerInfo>}
     */
    this.readyPlayers_ = [];

    /**
     * The player ID of the host.
     * @private {?string}
     */
    this.hostPlayerId_ = null;

    /**
     * Pre-bound handler when a player becomes ready.
     * @private {function(!Event)}
     */
    this.boundPlayerReadyCallback_ = this.onPlayerReady_.bind(this);

    /**
     * Pre-bound handler when a player starts playing.
     * @private {function(!Event)}
     */
    this.boundPlayerPlayingCallback_ = this.onPlayerPlaying_.bind(this);
  };


  /** @override */
  onEnter(previousStateId) {
    // Do not show health displays and enemy in this state.
    this.game_.getEnemyHealthDisplay().deactivate();
    this.game_.getPartyHealthDisplay().deactivate();
    this.game_.getEnemy().deactivate();

    this.waitingForRandomAiDelay_ = Date.now() + 1000;
    this.game_.getLobbyDisplay().activate(this.game_.getTopLeftPosition());

    // Add any players that are ready.
    this.readyPlayers_ = this.gameManager_.getPlayersInState(
      PlayerState.READY, this.readyPlayers_);
    for (let i = 0; i < this.readyPlayers_.length; i++) {
      let player = this.readyPlayers_[i];
      this.addPlayer_(player.playerId, player.playerData, i == 0);
    }

    // Listen to when a player is ready or starts playing.
    this.gameManager_.addEventListener(
      EventType.PLAYER_READY,
      this.boundPlayerReadyCallback_);
    this.gameManager_.addEventListener(
      EventType.PLAYER_PLAYING,
      this.boundPlayerPlayingCallback_);

    // The game is showing lobby screen and the lobby is open for new players.
    this.gameManager_.updateGameplayState(
      GameplayState.SHOWING_INFO_SCREEN, null);
    this.gameManager_.updateLobbyState(LobbyState.OPEN,
      null);
  };


  /** @override */
  onUpdate() {
    let now = Date.now();
    this.readyPlayers_ = this.gameManager_.getPlayersInState(
      PlayerState.READY, this.readyPlayers_);
    let numberReadyPlayers = this.readyPlayers_.length;

    // Check if we need to update who is the game host.
    let hostPlayer = this.hostPlayerId_ ?
      this.gameManager_.getPlayer(this.hostPlayerId_) : null;
    if (hostPlayer && this.hostPlayerId_ && numberReadyPlayers > 0 &&
      hostPlayer.playerState != PlayerState.READY) {
      this.updateHost_(this.readyPlayers_[0].playerId);
    }

    if (this.game_.randomAiEnabled && now > this.waitingForRandomAiDelay_) {
      if (numberReadyPlayers <
        GameConstants.MAX_PLAYERS) {
        this.game_.testCreatePlayer();
      } else {
        this.game_.testStartGame();
      }
      this.waitingForRandomAiDelay_ += 1000;
    }
  };


  /**
   * Handles when a player becomes ready.
   * @param {!Event} event
   * @private
   */
  onPlayerReady_(event) {
    if (event.statusCode != StatusCode.SUCCESS) {
      console.log('Error: Event status code: ' + event.statusCode);
      console.log('Reason for error: ' + event.errorDescription);
      return;
    }
    if (this.readyPlayers_.length >
      GameConstants.MAX_PLAYERS) {
      return;
    }

    this.addPlayer_(event.playerInfo.playerId, event.requestExtraMessageData,
      this.readyPlayers_.length == 0);
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
    if (event.requestExtraMessageData) {
      let playerPlayingData =
        /** @type {!PlayerPlayingData} */
        (
          event.requestExtraMessageData);
      this.game_.setDifficultySetting(playerPlayingData.difficultySetting ||
        DifficultySetting.EASY);
    }

    this.stateMachine_.goToState(
      GameStateId.INSTRUCTIONS);
  };


  /**
   * Adds a player. Updates playerData with host flag.
   * @param {string} playerId
   * @param {Object} playerData
   * @param {boolean} isHost
   * @private
   */
  addPlayer_(playerId, playerData, isHost) {
    if (isHost) {
      this.updateHost_(playerId, playerData);
    } else {
      playerData = playerData || {};
      playerData['host'] = false;
      this.gameManager_.updatePlayerData(playerId, playerData);
    }

    let parsedPlayerData =
      /** @type {!PlayerReadyData} */
      (
        playerData);

    let player = this.game_.createPlayer(
      /* id */
      playerId,
      /* name */
      parsedPlayerData.playerName || '???',
      /* avatarindex */
      parsedPlayerData.avatarIndex);

    player.activate(player.lobbyPosition, /* showNameText */ true);
  };


  /**
   * Sets a player to become the host and updates the player data.
   * @param {string} newHostPlayerId
   * @param {Object=} opt_newHostPlayerData
   * @private
   */
  updateHost_(newHostPlayerId, opt_newHostPlayerData) {
    if (newHostPlayerId == this.hostPlayerId_) {
      return;
    }

    if (newHostPlayerId != this.hostPlayerId_ && this.hostPlayerId_ &&
      this.gameManager_.isPlayerConnected(this.hostPlayerId_)) {
      let oldHostPlayer = this.gameManager_.getPlayer(this.hostPlayerId_);
      let oldHostPlayerData = oldHostPlayer.playerData || {};
      oldHostPlayerData['host'] = false;
      this.gameManager_.updatePlayerData(this.hostPlayerId_, oldHostPlayerData,
        /* opt_noBroadcastUpdate*/
        false);
    }

    let newHostPlayerData = null;
    if (opt_newHostPlayerData) {
      newHostPlayerData = opt_newHostPlayerData;
    } else {
      let newHostPlayer = this.gameManager_.getPlayer(newHostPlayerId);
      newHostPlayerData = newHostPlayer.playerData || {};
    }
    newHostPlayerData['host'] = true;
    this.hostPlayerId_ = newHostPlayerId;
    this.gameManager_.updatePlayerData(this.hostPlayerId_, newHostPlayerData);
  };


  /** @override */
  onExit(nextStateId) {
    // Stop listening to player events in this state.
    this.gameManager_.removeEventListener(
      EventType.PLAYER_READY,
      this.boundPlayerReadyCallback_);
    this.gameManager_.removeEventListener(
      EventType.PLAYER_PLAYING,
      this.boundPlayerPlayingCallback_);

    // Update all ready players to playing state. Hide ready and playing players.
    let players = this.gameManager_.getPlayers();
    for (let i = 0; i < players.length; i++) {
      let playerState = players[i].playerState;
      if (playerState == PlayerState.READY) {
        this.gameManager_.updatePlayerState(players[i].playerId,
          PlayerState.PLAYING, null);
      }
      if (playerState == PlayerState.READY ||
        playerState == PlayerState.PLAYING) {
        this.game_.getPlayer(players[i].playerId).deactivate();
      }
    }

    // The lobby is now closed for new players.
    this.gameManager_.updateLobbyState(LobbyState.CLOSED,
      null);
    this.game_.getLobbyDisplay().deactivate();
  };
}
export {
  WaitingForPlayersState
}
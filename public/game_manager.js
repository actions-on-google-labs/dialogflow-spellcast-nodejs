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
  GameplayState,
  PlayerState,
  LobbyState,
  StatusCode,
  EventType
} from './spellcast_messages.js';

/**
 * Manages game for spellcast. (Mostly mocked for now to emulate deprecated Cast Games SDK API)
 */

class GameManager {

  constructor(name) {
    this.name_ = name;
    this.players_ = [];
    this.gameData_ = {};
    this.gameplayState_ = GameplayState.SHOWING_INFO_SCREEN;
    this.lobbyState_ = LobbyState.OPEN;
    this.eventListeners_ = [];
  };

  createPlayer() {
    let player = {};
    player.playerId = this.players_.length + 100;
    player.playerState = PlayerState.AVAILABLE;
    player.playerData = {};
    player.playerName = 'player';
    player.avatarIndex = 0;
    return player;
  }

  /** addEventListener. */
  addEventListener(eventType, callback) {
    this.eventListeners_.push({
      eventType: eventType,
      callback: callback
    });
  };

  /** removeEventListener. */
  removeEventListener(eventType, callback) {
    this.eventListeners_ = this.eventListeners_.filter((listener, index, arr) => {
      if (listener.eventType != eventType) {
        if (listener.callback != callback) {
          return false;
        }
      }
      return true;
    });
  };

  informEventListener(eventType, player, message) {
    console.log('informEventListener: ' + eventType);
    for (let listener of this.eventListeners_) {
      if (listener.eventType === eventType) {
        listener.callback({
          statusCode: StatusCode.SUCCESS,
          errorDescription: '',
          playerInfo: player,
          requestExtraMessageData: message ? message : player.playerData
        });
      }
    }
  }

  /** updateGameplayState. */
  updateGameplayState(state, arg) {
    this.gameplayState_ = state;
  };

  /** getGameplayState. */
  getGameplayState() {
    return this.gameplayState_;
  };

  /** getPlayersInState. */
  getPlayersInState(state, players) {
    if (!players) {
      players = [];
    } else {
      players.length = 0;
    }
    for (let player of this.players_) {
      if (player.playerState === state) {
        players.push(player);
      }
    }
    return players;
  };

  /** sendGameMessageToPlayer. */
  sendGameMessageToPlayer(playerId, message) {};

  /** updateGameData. */
  updateGameData(gameData) {
    this.gameData_ = gameData;
  };

  /** getGameData. */
  getGameData() {
    return this.gameData_;
  };

  /** broadcastGameManagerStatus. */
  broadcastGameManagerStatus(status) {};

  /** getConnectedPlayers. */
  getConnectedPlayers() {
    return this.players_;
  };

  /** getSenderIdWithPlayerId. */
  getSenderIdWithPlayerId(playerId) {
    return playerId;
  };

  /** updatePlayerState. */
  updatePlayerState(playerId, state, playerData) {
    let foundPlayer = null;
    if (playerId) {
      for (let player of this.players_) {
        if (player.playerId === playerId) {
          player.playerState = state;
          if (playerData) {
            player.playerData = playerData;
          }
          foundPlayer = player;
          break;
        }
      }
    } else {
      let player = this.createPlayer();
      player.playerState = state;
      if (playerData) {
        player.playerData = playerData;
      }
      this.players_.push(player);
      foundPlayer = player;
    }
    if (foundPlayer) {
      switch (state) {
        case PlayerState.PLAYING:
          this.informEventListener(EventType.PLAYER_PLAYING, foundPlayer);
          break;
        case PlayerState.AVAILABLE:
          this.informEventListener(EventType.PLAYER_AVAILABLE, foundPlayer);
          break;
        case PlayerState.READY:
          this.informEventListener(EventType.PLAYER_READY, foundPlayer);
          break;
        case PlayerState.QUIT:
          this.informEventListener(EventType.PLAYER_QUIT, foundPlayer);
          break;
        case PlayerState.IDLE:
          this.informEventListener(EventType.PLAYER_IDLE, foundPlayer);
          break;
        case PlayerState.DROPPED:
          this.informEventListener(EventType.PLAYER_DROPPED, foundPlayer);
          break;
        default:
          break;
      }
    }
    return foundPlayer;
  };

  /** updatePlayerData. */
  updatePlayerData(playerId, playerData, noBroadCastUpdate) {
    for (let player of this.players_) {
      if (player.playerId === playerId) {
        player.playerData = playerData;
        return player;
      }
    }
    return null;
  };

  /** getPlayers. */
  getPlayers() {
    return this.players_;
  };

  /** getPlayer. */
  getPlayer(playerId) {
    for (let player of this.players_) {
      if (player.playerId === playerId) {
        return player;
      }
    }
    return null;
  };

  /** updatePlayerData. */
  updateLobbyState(lobbyState) {
    this.lobbyState_ = lobbyState;
  };

  /** getLobbyState. */
  getLobbyState() {
    return this.lobbyState_;
  };

  /** simulateGameMessageFromPlayer. */
  simulateGameMessageFromPlayer(playerId, message, noBroadCastUpdate) {
    for (let player of this.players_) {
      if (player.playerId === playerId) {
        this.informEventListener(EventType.GAME_MESSAGE_RECEIVED, player, message);
        return;
      }
    }
  }
}
export {
  GameManager
}
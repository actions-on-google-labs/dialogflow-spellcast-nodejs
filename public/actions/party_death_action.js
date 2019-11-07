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
  Action
} from '../action.js';
import {
  GameConstants
} from '../game_constants.js';

/**
 * Party death effect.  Constructor has no parameters to make this easy to
 * allocate from a pool.
 * @constructor
 * @extends {Action}
 */
class PartyDeathAction extends Action {
  constructor() {
    super();
    /** @private {SpellcastGame} */
    this.game_ = null;

    /** @private {cast.receiver.games.GameManager} */
    this.gameManager_ = null;

    /** @private {number} */
    this.alpha_ = 1.0;

    /** @private {number} */
    this.whenToChangeAlpha_ = 250;
  };

  /**
   * Initializes this party death action.
   * @param {!SpellcastGame} game
   */
  init(game) {
    this.game_ = game;
    this.gameManager_ = this.game_.getGameManager();
  };

  /** @override */
  onStart() {
    this.updateAlphas_();
    this.whenToChangeAlpha_ = 250;
  };

  /** @override */
  onUpdate(elapsedTime) {
    if (elapsedTime < this.whenToChangeAlpha_) {
      return;
    }

    this.alpha_ = (GameConstants.DEATH_FX_DURATION -
      elapsedTime) / GameConstants.DEATH_FX_DURATION;
    this.whenToChangeAlpha_ += 250;
    this.updateAlphas_();
  };

  /** @override */
  onFinish() {
    // Remove the enemy.
    this.game_.getEnemy().deactivate();
  };

  /**
   * Update the alpha of all players on the screen.
   * @private
   */
  updateAlphas_() {
    let connectedPlayers = this.gameManager_.getConnectedPlayers();
    for (let i = 0; i < connectedPlayers.length; i++) {
      let player = this.game_.getPlayer(connectedPlayers[i].playerId);
      player.sprite.alpha = this.alpha_;
    }
  };

  /** @override */
  getExecutionTime() {
    return GameConstants.DEATH_FX_DURATION;
  };

  /** @override */

  getShouldFinishOnNextUpdate() {
    return false;
  };
}
export {
  PartyDeathAction
}
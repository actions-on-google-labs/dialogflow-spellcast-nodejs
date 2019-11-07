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
 * Shows enemy death followed by player victory message.  Constructor has no
 * parameters to make this easy to allocate from a pool.
 * @constructor
 * @extends {Action}
 */
class EnemyDeathAction extends Action {
  constructor() {
    super();
    /** @private {gameobjects.Enemy} */
    this.enemy_ = null;

    /** @private {number} */
    this.alpha_ = 1.0;

    /** @private {number} */
    this.whenToChangeAlpha_ = 250;
  };

  /**
   * Initializes this enemy death action.
   * @param {!gameobjects.Enemy} enemy
   */
  init(enemy) {
    this.enemy_ = enemy;
    this.gameManager_ = this.game_.getGameManager();
  };

  /** @override */
  onStart() {
    this.whenToChangeAlpha_ = 250;
    this.enemy_.getSprite().alpha = this.alpha_;
  };

  /** @override */
  onUpdate(elapsedTime) {
    // Return if not time yet to update alpha.
    if (elapsedTime < this.whenToChangeAlpha_) {
      return;
    }

    this.alpha_ = (GameConstants.DEATH_FX_DURATION -
      elapsedTime) / GameConstants.DEATH_FX_DURATION;
    this.whenToChangeAlpha_ += 250;
    this.enemy_.getSprite().alpha = this.alpha_;
  };

  /** @override */
  onFinish() {};

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
  EnemyDeathAction
}
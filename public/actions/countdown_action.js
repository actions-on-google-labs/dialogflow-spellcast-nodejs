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
 * Shows a 3 second countdown followed by a message indicating the game is
 * waiting for player actions.  Constructor has no parameters to make this easy
 * to allocate from a pool.
 * @constructor
 * @extends {Action}
 */
class CountdownAction extends Action {
  constructor() {
    super();
    /** @private {SpellcastGame} */
    this.game_ = null;

    /** @private {number} */
    this.countdownIndex_ = 0;

    /** @private {!PIXI.Point} Positions displayed text at the center. */
    this.displayPosition_ = new PIXI.Point(0.5, 0.5);
  };

  /**
   * Initializes the countdown action.
   * @param {!SpellcastGame} game
   */
  init(game) {
    this.game_ = game;
  };

  /** @override */
  onStart() {
    this.game_.getCountdownPlayerActionDisplay().activate(this.displayPosition_);
    this.game_.getCountdownPlayerActionDisplay().setText(
      GameConstants.PLAYER_COUNTDOWN[0]);
    this.countdownIndex_ = 1;
  };

  /** @override */
  onUpdate(elapsedTime) {
    if (this.countdownIndex_ < GameConstants.PLAYER_COUNTDOWN.length &&
      elapsedTime >= (this.countdownIndex_ * 1000)) {
      // Update the number shown on the countdown.
      this.game_.getCountdownPlayerActionDisplay().setText(
        GameConstants.PLAYER_COUNTDOWN[this.countdownIndex_]);
      this.countdownIndex_ = this.countdownIndex_ + 1;
    }
  };

  /** @override */
  onFinish() {
    this.game_.getCountdownPlayerActionDisplay().deactivate();
    if (!this.game_.randomAiEnabled) {
      this.game_.getWaitingPlayerActionDisplay().activate(this.displayPosition_);
      this.game_.getWaitingPlayerActionDisplay().setText(
        GameConstants.WAITING_FOR_PLAYER_ACTIONS_TEXT);
    }
  };


  /** @override */
  getExecutionTime() {
    return 3000;
  };

  /** @override */

  getShouldFinishOnNextUpdate() {
    return false;
  };
}
export {
  CountdownAction
}
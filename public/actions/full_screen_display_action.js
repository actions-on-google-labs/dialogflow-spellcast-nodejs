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
 * Shows a full screen display for a duration. Constructor has no parameters to
 * make this easy to allocate from a pool.
 * @constructor
 * @extends {Action}
 */
class FullScreenDisplayAction extends Action {
  constructor() {
    super();
    /** @private {SpellcastGame} */
    this.game_ = null;

    /** @private {gameobjects.FullScreenDisplay} */
    this.fullScreenDisplay_ = null;

    /** @private {number} */
    this.displayDuration_ = 0;
  };

  /**
   * Initializes this show display action.
   * @param {!SpellcastGame} game
   * @param {!gameobjects.FullScreenDisplay}
   *     fullScreenDisplay
   * @param {number} displayDuration
   */
  init(game, fullScreenDisplay, displayDuration) {
    this.game_ = game;
    this.fullScreenDisplay_ = fullScreenDisplay;
    this.displayDuration_ = displayDuration;
  };

  /** @override */
  onStart() {
    this.fullScreenDisplay_.activate(this.game_.getTopLeftPosition());
  };

  /** @override */
  onUpdate(elapsedTime) {};

  /** @override */
  onFinish() {
    this.fullScreenDisplay_.deactivate();
  };

  /** @override */

  getExecutionTime() {
    return this.displayDuration_;
  };

  /** @override */

  getShouldFinishOnNextUpdate() {
    return false;
  };
}
export {
  FullScreenDisplayAction
}
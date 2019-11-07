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
  GameObject
} from './game_object.js';
import {
  ThreeSlice
} from './three_slice.js';

/**
 * Represents a health display. Call #configure to set maxehealth displayed.
 * Assumes required assets are already loaded by PIXI asset loader (the frames
 * for the background, red, and green health meter bars).
 *
 * @param {!PIXI.Container} container
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @constructor
 * @struct
 * @extends {GameObject}
 */
class HealthDisplay extends GameObject {
  constructor(container,
    canvasWidth, canvasHeight) {
    super();
    /** @private {!ThreeSlice} */
    this.backgroundMeterBar_ = new ThreeSlice(
      'bg_meter_bar', canvasWidth / 4, container, canvasWidth, canvasHeight);

    /** @private {!ThreeSlice} */
    this.redMeterBar_ = new ThreeSlice(
      'red_meter_bar', canvasWidth / 4 - 8, container, canvasWidth,
      canvasHeight);

    /** @private {!ThreeSlice} */
    this.greenMeterBar_ = new ThreeSlice(
      'green_meter_bar', canvasWidth / 4 - 8, container, canvasWidth,
      canvasHeight);

    /** @private {!PIXI.Point} */
    this.foregroundMeterPosition_ = new PIXI.Point(0, 0);

    /** @public {boolean} */
    this.active = false;

    /** @public {number} */
    this.posX = 0;

    /** @public {number} */
    this.posY = 0;

    /** @public {!PIXI.Container} */
    this.container = container;

    /** @public {number} */
    this.canvasWidth = canvasWidth;

    /** @public {number} */
    this.canvasHeight = canvasHeight;

    /** @private {number} Max health value. */
    this.maxHealth_ = -1;

    /** @private {number} Current health value. */
    this.health_ = -1;
  };


  /**
   * Sets the max health used by the health bar.
   * @param {number} maxHealth
   */
  configure(maxHealth) {
    if (maxHealth <= 0) {
      throw Error('maxHealth cannot be 0 or lower');
    }
    this.maxHealth_ = maxHealth;
  };


  /**
   * Updates the health bar.
   * @param {number} health
   */
  updateHealth(health) {
    if (health < 0) {
      health = 0;
    } else if (health > this.maxHealth_) {
      health = this.maxHealth_;
    }

    // Only update if there is something to update.
    if (this.health_ === health) {
      return;
    }
    this.health_ = health;

    // Activate the red or green bar depending on health and deactivate the other.
    let barToDeactivate = null;
    let barToActivate = null;

    if (this.health_ * 4 < this.maxHealth_) {
      barToDeactivate = this.greenMeterBar_;
      barToActivate = this.redMeterBar_;
    } else {
      barToDeactivate = this.redMeterBar_;
      barToActivate = this.greenMeterBar_;
    }

    barToDeactivate.deactivate();
    barToActivate.activate(this.foregroundMeterPosition_);
    barToActivate.sprite.width = barToActivate.maxWidth * this.health_ /
      this.maxHealth_;

    // Manually update the heath bar. See comment in #update.
    barToActivate.update(0);
  };


  /** @override */
  activate(position) {
    this.active = true;
    this.posX = position.x;
    this.posY = position.y;

    this.backgroundMeterBar_.activate(position);

    this.foregroundMeterPosition_.x = position.x + (8 / this.canvasWidth);
    this.foregroundMeterPosition_.y = position.y + (4 / this.canvasHeight);
    this.redMeterBar_.activate(this.foregroundMeterPosition_);
    this.greenMeterBar_.activate(this.foregroundMeterPosition_);
  };


  /** @override */
  deactivate() {
    this.active = false;
    this.backgroundMeterBar_.deactivate();
    this.redMeterBar_.deactivate();
    this.greenMeterBar_.deactivate();
  };


  /** @override */
  update(deltaTime) {
    // Note: To reduce update rendering time, we only update the health display
    // if #updateHealth is called (e.g. when the enemy is actually hit).
  };
}
export {
  HealthDisplay
}
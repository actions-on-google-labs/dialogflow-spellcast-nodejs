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

/**
 * Represents a 3-sliced horizontal bar. Assumes required assets specified by
 * the frameName parameter are already loaded by PIXI asset loader.
 *
 * Slices should created from a series of frames loaded earlier by the PIXI
 * asset loader. Frame names should be prefixed by the frameName parameter
 * followed by the number, starting from 1 (e.g. if the frameName is "air",
 * the frames should be "air1" for the left, "air2" for the middle, and "air3"
 * for the right).
 *
 * @param {string} frameName
 * @param {number} maxWidth
 * @param {!PIXI.Container} container
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @constructor
 * @struct
 * @extends {GameObject}
 */
class ThreeSlice extends GameObject {
  constructor(frameName, maxWidth,
    container, canvasWidth, canvasHeight) {
    super();
    /** @private {!PIXI.Sprite} */
    this.leftSlice_ = PIXI.Sprite.fromImage(frameName + '1');

    /** @private {!PIXI.Sprite} */
    this.middleSlice_ = PIXI.Sprite.fromImage(frameName + '2');
    this.middleSlice_.width = maxWidth;

    /** @private {!PIXI.Sprite} */
    this.rightSlice_ = PIXI.Sprite.fromImage(frameName + '3');

    /** @public {number} */
    this.maxWidth = maxWidth;

    /** @public {boolean} */
    this.active = false;

    /** @public {number} */
    this.posX = 0;

    /** @public {number} */
    this.posY = 0;

    /** @public {number} */
    this.canvasWidth = canvasWidth;

    /** @public {number} */
    this.canvasHeight = canvasHeight;

    /** @public {!PIXI.Sprite} */
    this.sprite = this.middleSlice_;

    this.leftSlice_.visible = false;
    this.middleSlice_.visible = false;
    this.rightSlice_.visible = false;

    container.addChild(this.leftSlice_);
    container.addChild(this.middleSlice_);
    container.addChild(this.rightSlice_);
  };


  /** @override */
  update(deltaTime) {
    this.leftSlice_.position.x = this.canvasWidth * this.posX;
    this.leftSlice_.position.y = this.canvasWidth * this.posY;
    this.middleSlice_.position.x = this.leftSlice_.position.x +
      this.leftSlice_.width;
    this.middleSlice_.position.y = this.leftSlice_.position.y;
    this.rightSlice_.position.x = this.middleSlice_.position.x +
      this.middleSlice_.width;
    this.rightSlice_.position.y = this.leftSlice_.position.y;
  };


  /** @override */
  activate(position) {
    this.posX = position.x;
    this.posY = position.y;
    this.leftSlice_.position.x = this.canvasWidth * position.x;
    this.leftSlice_.position.y = this.canvasWidth * position.y;
    this.middleSlice_.position.x = this.leftSlice_.position.x +
      this.leftSlice_.width;
    this.middleSlice_.position.y = this.leftSlice_.position.y;
    this.rightSlice_.position.x = this.middleSlice_.position.x +
      this.middleSlice_.width;
    this.rightSlice_.position.y = this.leftSlice_.position.y;

    this.active = true;
    this.leftSlice_.visible = true;
    this.middleSlice_.visible = true;
    this.rightSlice_.visible = true;
  };


  /** @override */
  deactivate() {
    this.active = false;
    this.leftSlice_.visible = false;
    this.middleSlice_.visible = false;
    this.rightSlice_.visible = false;
  };
}
export {
  ThreeSlice
}
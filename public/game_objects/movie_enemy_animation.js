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
  EnemyAnimation
} from './enemy_animation.js';

/**
 * Represents an enemy animation using a movie clip.
 *
 * The movie clip is created from a series of frames loaded earlier by the PIXI
 * asset loader. Frame names should be prefixed by the frameName parameter
 * followed by the number, starting from 1 (e.g. if the frameName is "air", the
 * frames should be "air1", "air2", "air3"...).
 *
 * @param {string} frameName
 * @param {number} numberFrames
 * @param {!PIXI.Point} normalizedPosition
 * @param {!PIXI.Point} scale
 * @param {!PIXI.Container} container
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @param {Function} animationFinishedCallback Called when animation finishes.
 * @constructor
 * @struct
 * @extends {EnemyAnimation}
 */
class MovieEnemyAnimation extends EnemyAnimation {
  constructor(frameName,
    numberFrames, normalizedPosition, scale, container, canvasWidth,
    canvasHeight, animationFinishedCallback) {
    super();
    let enemyTextures = [];
    for (let i = 1; i <= numberFrames; i++) {
      enemyTextures.push(PIXI.Texture.fromFrame(frameName + i));
    }

    /** @public {!PIXI.extras.AnimatedSprite} */
    this.sprite = new PIXI.extras.AnimatedSprite(enemyTextures);

    /** @public {boolean} */
    this.active = false;

    /** @public {!PIXI.Container} */
    this.container = container;

    /** @public {number} */
    this.posX = normalizedPosition.x;

    /** @public {number} */
    this.posY = normalizedPosition.y;

    /** @public {number} */
    this.canvasWidth = canvasWidth;

    /** @public {number} */
    this.canvasHeight = canvasHeight;

    /** @private {Function} */
    this.animationFinishedCallback_ = animationFinishedCallback;
    if (this.animationFinishedCallback_) {
      this.sprite.onComplete = this.animationFinishedCallback_;
    }

    this.sprite.visible = false;
    this.sprite.loop = !this.animationFinishedCallback_;
    this.sprite.scale.x = scale.x;
    this.sprite.scale.y = scale.y;
    this.container.addChild(this.sprite);
  };


  /** @override */
  activate() {
    this.active = true;
    this.sprite.alpha = 1.0;
    this.sprite.position.x = this.canvasWidth * this.posX;
    this.sprite.position.y = this.canvasHeight * this.posY;
    this.sprite.visible = true;
    this.sprite.gotoAndPlay(0);
  };


  /** @override */
  deactivate() {
    this.active = false;
    this.sprite.visible = false;
    this.sprite.stop();
  };


  /** @override */
  update(deltaTime) {
    this.sprite.position.x = this.posX * this.canvasWidth;
    this.sprite.position.y = this.posY * this.canvasHeight;

    // Note: The enemy movie clip animationSpeed is an frame counter increment
    // that is added per animation tick.  e.g. animationSpeed = 1.0 means show the
    // next frame in the next frame of animation. If the receiver is running at
    // 30 fps consistently, then update() will be called with deltaTime of 33ms
    // and the movie clip will play at 30 fps. If the receiver frame rate speeds
    // up to deltaTime = 16 ms (60 fps), then animationSpeed will slow down to 0.5
    // (it will take 2 animation ticks to advance a frame).
    this.sprite.animationSpeed = deltaTime / 500;
  };
}
export {
  MovieEnemyAnimation
}
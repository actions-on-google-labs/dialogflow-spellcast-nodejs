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
 * Moves a movie clip sprite from activated position and activates spell effect
 * (e.g. an explosion) when the sprite reaches targeted position.
 *
 * The movie clip is created from a series of frames loaded earlier by the PIXI
 * asset loader. Frame names should be prefixed by the frameName parameter
 * followed by the number, starting from 1 (e.g. if the frameName is "air", the
 * frames should be "air1", "air2", "air3"...).
 *
 * @param {string} frameName
 * @param {number} numberFrames
 * @param {!PIXI.Container} container
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @constructor
 * @struct
 * @extends {GameObject}
 */
class AttackSpell extends GameObject {
  constructor(frameName, numberFrames,
    container, canvasWidth, canvasHeight) {
    super();
    let spellTextures = [];
    for (let i = 1; i <= numberFrames; i++) {
      spellTextures.push(PIXI.Texture.fromFrame(frameName + i));
    }

    /** @public {boolean} */
    this.active = false;

    /** @public {!PIXI.extras.AnimatedSprite} */
    this.sprite = new PIXI.extras.AnimatedSprite(spellTextures);

    /** @public {!PIXI.Container} */
    this.container = container;

    /** @public {number} */
    this.canvasWidth = canvasWidth;

    /** @public {number} */
    this.canvasHeight = canvasHeight;

    /** @private {!PIXI.Point} Used to set the spell effect position. */
    this.spellEffectPosition_ = new PIXI.Point(0, 0);

    /** @public {number} */
    this.targetX = 0;

    /** @public {number} */
    this.targetY = 0;

    /** @public {number} */
    this.startX = 0;

    /** @public {number} */
    this.startY = 0;

    /** @public {number} */
    this.posX = 0;

    /** @public {number} */
    this.posY = 0;

    /** @public {number} */
    this.dx = 0;

    /** @public {number} */
    this.dy = 0;

    /** @public {number} */
    this.elapsedTime = 0;

    /** @public {number} */
    this.duration = 0;

    /** @public {GameObject} */
    this.spellEffect = null;

    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.visible = false;
    this.container.addChild(this.sprite);
  };

  /** @override */
  update(deltaTime) {
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= this.duration) {
      if (this.spellEffect) {
        this.spellEffectPosition_.x = this.posX;
        this.spellEffectPosition_.y = this.posY;
        this.spellEffect.activate(this.spellEffectPosition_);
      }

      this.deactivate();
    }

    this.posX += this.dx * deltaTime;
    this.posY += this.dy * deltaTime;

    this.sprite.position.x = this.posX * this.canvasWidth;
    this.sprite.position.y = this.posY * this.canvasHeight;

    // Targeting animation around 100 msec per frame (10 fps).
    // Note: The movie clip animationSpeed is an frame counter increment that is
    // added per animation tick.  e.g. animationSpeed = 1.0 means show the next
    // frame in the next frame of animation. If the receiver is running at 30
    // fps consistently, then update() will be called with deltaTime of 33ms
    // and the movie clip will play at 30 fps. If the receiver frame rate speeds
    // up to deltaTime = 16 ms (60 fps), then animationSpeed will slow down to
    // 0.5 (it will take 2 animation ticks to advance a frame).
    this.sprite.animationSpeed = deltaTime / 100;
  };

  /** @override */
  activate(position, target, duration, spellEffect) {
    this.active = true;
    this.posX = position.x;
    this.posY = position.y;
    this.sprite.position.x = this.canvasWidth * position.x;
    this.sprite.position.y = this.canvasHeight * position.y;
    this.sprite.visible = true;
    this.sprite.loop = true;
    this.sprite.gotoAndPlay(0);

    this.targetX = target.x;
    this.targetY = target.y;
    this.duration = duration;
    this.startX = position.x;
    this.startY = position.y;
    this.dx = (this.targetX - this.posX) / duration;
    this.dy = (this.targetY - this.posY) / duration;
    this.elapsedTime = 0;
    this.spellEffect = spellEffect;

    this.sprite.rotation = this.dx > 0 ? 0 : Math.PI;
  };

  /** @override */
  deactivate() {
    this.active = false;
    this.sprite.stop();
    this.sprite.visible = false;
    this.sprite.scale.x = 1.0;
    this.sprite.scale.y = 1.0;
  };
}

export {
  AttackSpell
}
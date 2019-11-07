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
  SpellElement
} from '../spellcast_messages.js';

/**
 * Explosion movie clip created from a series of frames loaded earlier by the
 * PIXI asset loader via a json sprite sheet. Frame names should be prefixed by
 * the frameName parameter followed by the number, starting from 1 (e.g. if the
 * frameName is "air", the frames should be "air1", "air2", "air3"...).
 *
 * @param {string} frameName
 * @param {number} numberFrames
 * @param {!PIXI.Container} container
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @param {!AudioManager} audioManager
 * @constructor
 * @struct
 * @extends {GameObject}
 */
class Explosion extends GameObject {
  constructor(frameName, numberFrames,
    container, canvasWidth, canvasHeight, audioManager) {
    super();
    let explosionTextures = [];
    for (let i = 1; i <= numberFrames; i++) {
      explosionTextures.push(PIXI.Texture.fromFrame(frameName + i));
    }

    /** @public {boolean} */
    this.active = false;

    /** @public {!PIXI.extras.AnimatedSprite} */
    this.sprite = new PIXI.extras.AnimatedSprite(explosionTextures);

    /** @public {!PIXI.Container} */
    this.container = container;

    /** @public {number} */
    this.canvasWidth = canvasWidth;

    /** @public {number} */
    this.canvasHeight = canvasHeight;

    /** @private {!AudioManager} */
    this.audioManager_ = audioManager;

    this.container.addChild(this.sprite);

    /** @public {number} */
    this.posX = 0;

    /** @public {number} */
    this.posY = 0;

    /** @private {!Function} */
    this.deactivateFunction_ = this.deactivate.bind(this);

    /** @private {Enemy} */
    this.hitEnemy_ = null;

    /** @private {SpellElement} */
    this.hitSpellElement_ = SpellElement.NONE;

    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.visible = false;
  };


  /** @override */
  activate(position) {
    this.active = true;
    this.posX = position.x;
    this.posY = position.y;
    this.sprite.position.x = this.canvasWidth * position.x;
    this.sprite.position.y = this.canvasHeight * position.y;
    this.sprite.visible = true;

    this.audioManager_.playExplosionSound();
    this.sprite.loop = false;
    this.sprite.gotoAndPlay(0);

    if (this.hitEnemy_) {
      this.hitEnemy_.activate(
        this.hitEnemy_.getHitAnimation(this.hitSpellElement_));
    }

    setTimeout(this.deactivateFunction_, 500);
  };


  /** @override */
  deactivate() {
    this.active = false;
    this.sprite.stop();
    this.sprite.visible = false;
    this.hitEnemy_ = null;
  };


  /** @override */
  update(deltaTime) {
    this.sprite.position.x = this.posX * this.canvasWidth;
    this.sprite.position.y = this.posY * this.canvasHeight;

    // Targeting animation around 100 msec per frame (10 fps).
    // Note: The movie clip animationSpeed is an frame counter increment that is
    // added per animation tick.  e.g. animationSpeed = 1.0 means show the next
    // frame in the next frame of animation. If the receiver is running at 30
    // fps consistently, then update() will be called with deltaTime of 33ms
    // and the movie clip will play at 30 fps. If the receiver frame rate speeds
    // up to deltaTime = 16 ms (60 fps), then animationSpeed will slow down to 0.5
    // (it will take 2 animation ticks to advance a frame).
    this.sprite.animationSpeed = deltaTime / 100;
  };


  /**
   * Sets an enemy that will play a hit animation with the spell element when the
   * explosion is activated.
   * The enemy will be cleared after the explosion is played.
   * @param {!Enemy} enemy
   * @param {!SpellElement} spellElement
   */

  setHitEnemyAndSpellElement(enemy, spellElement) {
    this.hitEnemy_ = enemy;
    this.hitSpellElement_ = spellElement;
  };
}
export {
  Explosion
}
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
  Enemy
} from './enemy.js';
import {
  MovieEnemyAnimation
} from './movie_enemy_animation.js';
import {
  SpellElement
} from '../spellcast_messages.js';

/**
 * The elemental enemy, composed of different animations. Assumes PIXI asset
 * loader already loaded the required assets (frame names for fire, water,
 * earth, air elementals and their idle, attack, and hit animation states).
 *
 * @param {!PIXI.Container} container
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @extends {Enemy}
 * @struct
 * @constructor
 */
class ElementalEnemy extends Enemy {

  constructor(container,
    canvasWidth, canvasHeight) {
    super();
    /**
     * Map of spell elements to idle animations.
     * @private {!Object.<SpellElement,
     *     !MovieEnemyAnimation>}
     */
    this.idleAnimations_ = Object.create(null);

    /**
     * Map of spell elements to attack animations.
     * @private {!Object.<SpellElement,
     *     !MovieEnemyAnimation>}
     */
    this.attackAnimations_ = Object.create(null);

    /**
     * Map of spell elements to hit (by player) animations.
     * @private {!Object.<SpellElement,
     *     !MovieEnemyAnimation>}
     */
    this.hitAnimations_ = Object.create(null);

    /** @private {!PIXI.Point} Normalized position for attack spells. */
    this.attackSpellPosition_ = new PIXI.Point(0.7575, 0.63611);

    /** @private {!PIXI.Point} Normalized position for explosions. */
    this.explosionPosition_ = new PIXI.Point(0.7575, 0.63611);

    /** @private {!PIXI.Point} Idle animation normalized position. */
    this.idlePosition_ = new PIXI.Point(0.60359375, 0.4305556);

    /** @private {!PIXI.Point} Attack animation normalized position. */
    this.attackPosition_ = new PIXI.Point(0.399375, 0.2086111);

    /** @private {!PIXI.Point} Hit animation normalized position. */
    this.hitPosition_ = new PIXI.Point(0.5408124, 0.3241667);

    /** @private {!PIXI.Point} Scale of all animations. */
    this.scale_ = new PIXI.Point(1.25, 1.25);

    /** @private {EnemyAnimation} */
    this.currentAnimation_ = null;

    this.idleAnimations_[SpellElement.AIR] =
      new MovieEnemyAnimation(
        'air_elemental_idle', 12, this.idlePosition_, this.scale_,
        container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        null);
    this.idleAnimations_[SpellElement.EARTH] =
      new MovieEnemyAnimation(
        'earth_elemental_idle', 12, this.idlePosition_, this.scale_,
        container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        null);
    this.idleAnimations_[SpellElement.FIRE] =
      new MovieEnemyAnimation(
        'fire_elemental_idle', 12, this.idlePosition_, this.scale_,
        container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        null);
    this.idleAnimations_[SpellElement.WATER] =
      new MovieEnemyAnimation(
        'water_elemental_idle', 12, this.idlePosition_, this.scale_,
        container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        null);

    this.attackAnimations_[SpellElement.AIR] =
      new MovieEnemyAnimation(
        'air_elemental_attack', 10, this.attackPosition_, this.scale_,
        container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        this.onAnimationFinished_.bind(this,
          SpellElement.AIR));
    this.attackAnimations_[SpellElement.EARTH] =
      new MovieEnemyAnimation(
        'earth_elemental_attack', 10, this.attackPosition_,
        this.scale_, container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        this.onAnimationFinished_.bind(this,
          SpellElement.EARTH));
    this.attackAnimations_[SpellElement.FIRE] =
      new MovieEnemyAnimation(
        'fire_elemental_attack', 10, this.attackPosition_,
        this.scale_, container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        this.onAnimationFinished_.bind(this,
          SpellElement.FIRE));
    this.attackAnimations_[SpellElement.WATER] =
      new MovieEnemyAnimation(
        'water_elemental_attack', 10, this.attackPosition_,
        this.scale_, container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        this.onAnimationFinished_.bind(this,
          SpellElement.WATER));

    this.hitAnimations_[SpellElement.AIR] =
      new MovieEnemyAnimation(
        'air_elemental_hit', 3, this.hitPosition_, this.scale_,
        container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        this.onAnimationFinished_.bind(this,
          SpellElement.AIR));
    this.hitAnimations_[SpellElement.EARTH] =
      new MovieEnemyAnimation(
        'earth_elemental_hit', 3, this.hitPosition_, this.scale_,
        container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        this.onAnimationFinished_.bind(this,
          SpellElement.EARTH));
    this.hitAnimations_[SpellElement.FIRE] =
      new MovieEnemyAnimation(
        'fire_elemental_hit', 3, this.hitPosition_, this.scale_,
        container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        this.onAnimationFinished_.bind(this,
          SpellElement.FIRE));
    this.hitAnimations_[SpellElement.WATER] =
      new MovieEnemyAnimation(
        'water_elemental_hit', 3, this.hitPosition_, this.scale_,
        container, canvasWidth, canvasHeight,
        /* animationFinishedCallback */
        this.onAnimationFinished_.bind(this,
          SpellElement.WATER));
  };

  /** @override */
  update(deltaTime) {
    if (this.currentAnimation_ && this.currentAnimation_.active) {
      this.currentAnimation_.update(deltaTime);
    }
  };

  /** @override */
  activate(animation) {
    if (this.currentAnimation_) {
      this.currentAnimation_.deactivate();
    }

    this.currentAnimation_ = animation;
    this.currentAnimation_.activate();
  };

  /** @override */
  deactivate() {
    if (this.currentAnimation_) {
      this.currentAnimation_.deactivate();
    }

    this.currentAnimation_ = null;
  };

  /** @override */
  getIdleAnimation(spellElement) {
    return this.idleAnimations_[spellElement];
  };


  /** @override */
  getAttackAnimation(spellElement) {
    return this.attackAnimations_[spellElement];
  };


  /** @override */
  getHitAnimation(spellElement) {
    return this.hitAnimations_[spellElement];
  };


  /** @override */
  getAttackPosition() {
    return this.attackSpellPosition_;
  };


  /** @override */
  getExplosionPosition() {
    return this.explosionPosition_;
  };


  /** @override */
  getSprite() {
    if (!this.currentAnimation_) {
      throw Error('Cannot get sprite - no current animation active');
    }

    return this.currentAnimation_.sprite;
  };


  /**
   * Called when non-looping animation finishes (e.g. attack or hit). If there
   * is still a current animation, deactivate it and play the idle animation for
   * the current spell element.
   * @param {SpellElement} currentSpellElement
   * @private
   */
  onAnimationFinished_(currentSpellElement) {
    if (!this.currentAnimation_) {
      return;
    }

    this.currentAnimation_.deactivate();
    this.activate(this.getIdleAnimation(currentSpellElement));
  };

}

export {
  ElementalEnemy
}
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

/**
 * All enemies in the game extends this class.
 * @class
 */
class Enemy {
  constructor() {};

  /**
   * Implement this to update position and animation state.
   * @param {number} deltaTime Time in msec between current and previous animation
   *     frame. Useful for adjusting speeds depending on frame rate.
   */
  update() {};


  /**
   * Activates this enemy with a specific element and animation.
   * @param {!EnemyAnimation} animation
   */
  activate() {};


  /**
   * Deactivates this enemy with its current animation.
   */
  deactivate() {};


  /**
   * Returns the idle animation for a specific spell element.
   * @param {SpellElement} spellElement
   * @return {!EnemyAnimation} Idle animation.
   */
  getIdleAnimation() {};


  /**
   * Returns the attack animation for a specific spell element.
   * @param {SpellElement} spellElement
   * @return {!EnemyAnimation} Attack animation.
   */
  getAttackAnimation() {};

  /**
   * Returns the hit (by player spell) animation for a specific spell element.
   * @param {SpellElement} spellElement
   * @return {!EnemyAnimation} Hit animation.
   */
  getHitAnimation() {};


  /** @return {!PIXI.Point} Starting position for attack spells. */
  getAttackPosition() {};


  /** @return {!PIXI.Point} Position for explosions hitting enemy. */
  getExplosionPosition() {};


  /** @return {!PIXI.Sprite} Sprite from current animation. */
  getSprite() {};

}

export {
  Enemy
}
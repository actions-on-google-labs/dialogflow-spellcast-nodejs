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
import {
  SpellElement
} from '../spellcast_messages.js';

/**
 * Attack spell cast by an enemy.  Constructor has no parameters to make this
 * easy to allocate from a pool.
 * @constructor
 * @extends {Action}
 */
class EnemyAttackSpell extends Action {
  constructor() {
    super();
    /** @private {SpellcastGame} */
    this.game_ = null;

    /** @private {cast.receiver.games.GameManager} */
    this.gameManager_ = null;

    /** @private {gameobjects.Enemy} */
    this.caster_ = null;

    /** @private {gameobjects.Player} */
    this.target_ = null;

    /** @private {SpellElement} */
    this.attackElement_ = SpellElement.NONE;

    /** @private {gameobjects.AttackSpell} */
    this.attackSpell_ = null;

    /** @private {number} */
    this.strength_ = 0;

    /** @private {!PIXI.Point} Used to position enemy attack explosions. */
    this.targetPosition_ = new PIXI.Point(0, 0);

    /** @private {gameobjects.Explosion} */
    this.explosion_ = null;
  };

  /**
   * Initializes this enemy attack spell
   * @param {!SpellcastGame} game
   * @param {!gameobjects.Enemy} caster
   * @param {!gameobjects.Player} target
   * @param {SpellElement} element
   * @param {number} strength One of the constants defined in
   *     {@link GameConstants.ENEMY_ATTACK_STRENGTH}
   */
  init(game, caster, target, element, strength) {
    this.game_ = game;
    this.gameManager_ = this.game_.getGameManager();
    this.caster_ = caster;
    this.target_ = target;
    this.strength_ = strength;
    this.attackElement_ = element;
    this.attackAnimation_ = this.caster_.getAttackAnimation(this.attackElement_);
    this.attackSpell_ = this.game_.setCurrentAttackSpellElement(
      this.attackElement_);
  };

  /** @override */
  onStart() {
    // Animate the caster using the attack animation and play attack sound.
    this.caster_.activate(this.attackAnimation_);
  };

  /** @override */
  onFinish() {
    this.explosion_ = null;
    this.attackSpell_.deactivate();

    let damage = this.strength_;
    let numberConnectedPlayers = this.gameManager_.getConnectedPlayers().length;

    // Apply bonus damage based on the number of players in the party.
    damage += GameConstants.ENEMY_STRENGTH_BONUS_MAP[
      numberConnectedPlayers];

    // Reduce damage if the party has shields.
    damage -= this.game_.getPartyShieldValue();

    if (damage < 0) {
      damage = 0;
    }

    this.game_.updatePartyHealth(-damage);
  };

  /** @override */
  onUpdate(timeElapsed) {
    if (!this.attackAnimation_.active && !this.attackSpell_.active &&
      !this.explosion_) {
      this.startAttackSpell_(timeElapsed);
    }
  };

  /** @override */
  getExecutionTime() {
    return 6000;
  };

  /** @override */

  getShouldFinishOnNextUpdate() {
    return false;
  };

  /**
   * Start moving attack spell across the screen.
   * @param {number} timeElapsed
   * @private
   */
  startAttackSpell_(timeElapsed) {
    this.game_.getAudioManager().playAttackSound();

    this.targetPosition_.x = this.target_.posX;
    this.targetPosition_.y = this.target_.posY;
    this.explosion_ = this.game_.setCurrentExplosionSpellElement(
      this.attackElement_);
    this.attackSpell_.activate(
      this.caster_.getAttackPosition(),
      this.targetPosition_,
      this.getExecutionTime() - timeElapsed -
      GameConstants.EXPLOSION_FX_DURATION,
      this.explosion_);

    switch (this.strength_) {
      case GameConstants.ENEMY_ATTACK_STRENGTH.WEAK:
        this.attackSpell_.sprite.scale.x = 0.5;
        this.attackSpell_.sprite.scale.y = 0.5;
        break;
      case GameConstants.ENEMY_ATTACK_STRENGTH.MEDIUM:
        this.attackSpell_.sprite.scale.x = 0.8;
        this.attackSpell_.sprite.scale.y = 0.8;
        break;
      case GameConstants.ENEMY_ATTACK_STRENGTH.STRONG:
        this.attackSpell_.sprite.scale.x = 1.25;
        this.attackSpell_.sprite.scale.y = 1.25;
        break;
    }
  };
}
export {
  EnemyAttackSpell
}
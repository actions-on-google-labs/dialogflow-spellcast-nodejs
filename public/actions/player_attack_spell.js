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
  PlayerBonus
} from '../spellcast_messages.js';
import {
  SpellAccuracy
} from '../spellcast_messages.js';
import {
  SpellElement
} from '../spellcast_messages.js';

/**
 * Attack spell cast by players. Constructor has no parameters to make this easy
 * to allocate from a pool.
 * @constructor
 * @extends {Action}
 */
class PlayerAttackSpell extends Action {
  constructor() {
    super();
    /** @private {SpellcastGame} */
    this.game_ = null;

    /** @private {gameobjects.Player} */
    this.caster_ = null;

    /** @private {gameobjects.Enemy} */
    this.target_ = null;

    /** @private {SpellElement} */
    this.attackElement_ = SpellElement.NONE;

    /** @private {SpellAccuracy} */
    this.accuracy_ = SpellAccuracy.GOOD;

    /** @private {!PlayerBonus} */
    this.casterBonus_ =
      PlayerBonus.NONE;

    /** @private {!PIXI.Point} Used to position caster effects and spells. */
    this.casterEffectAndSpellPosition_ = new PIXI.Point(0, 0);

    /** @private {number} */
    this.damage_ = 0;
  };

  /**
   * Initializes the attack spell.
   * @param {!SpellcastGame} game
   * @param {!gameobjects.Player} caster
   * @param {!gameobjects.Enemy} target
   * @param {!SpellElement} attackElement
   * @param {!SpellAccuracy} accuracy
   */
  init(game, caster, target, attackElement, accuracy) {
    this.game_ = game;
    this.caster_ = caster;
    this.target_ = target;
    this.attackElement_ = attackElement;
    this.accuracy_ = accuracy;
  };

  /** @override */
  onStart() {
    if (!this.caster_.playerId) {
      throw Error('Missing caster player ID');
    }
    this.casterBonus_ = this.game_.getPlayerBonus(this.caster_.playerId);

    this.damage_ = this.getDamageForSpell(
      this.attackElement_,
      this.game_.getEnemyElement(),
      this.accuracy_);

    // Only show an explosion if damage will be dealt.
    let explosion = null;
    if (this.damage_ > 0 && this.target_) {
      explosion = this.game_.setCurrentExplosionSpellElement(this.attackElement_);
      explosion.setHitEnemyAndSpellElement(this.target_,
        this.game_.getEnemyElement());
    }

    // Shift the player forward when casting the spell.
    // Shift enemy target Y position higher to correctly position explosion.
    this.caster_.moveForward();

    this.casterEffectAndSpellPosition_.x = this.caster_.posX;
    this.casterEffectAndSpellPosition_.y = this.caster_.posY;

    let attackSpell = this.game_.setCurrentAttackSpellElement(
      this.attackElement_);
    attackSpell.activate(
      this.casterEffectAndSpellPosition_,
      this.target_.getExplosionPosition(),
      this.getExecutionTime() -
      GameConstants.EXPLOSION_FX_DURATION,
      explosion);

    let scale = GameConstants.PLAYER_ATTACK_SPRITE_SCALE_MAP.get(this.accuracy_);
    if (this.casterBonus_ ==
      PlayerBonus.ATTACK) {
      scale += 0.25;
    }
    attackSpell.sprite.scale.x = scale;
    attackSpell.sprite.scale.y = scale;

    this.game_.getAudioManager().playAttackSound();
  };

  /** @override */
  onFinish() {
    this.caster_.moveBackward();
    this.game_.getCurrentAttackSpell().deactivate();

    // If the element of this attack matches the enemy, the enemy will heal due
    // to player error.
    if (this.attackElement_ === this.game_.getEnemyElement()) {
      this.game_.updateEnemyHealth(
        GameConstants.ENEMY_HEAL_VALUE);
      this.game_.getAudioManager().playHeal();
    } else {
      this.game_.updateEnemyHealth(-this.damage_);
    }
  };

  /**
   * Returns the amount of damage to be dealt based on the element types.
   * @param  {!SpellElement} attackElement The
   *     element of the attack.
   * @param  {!SpellElement} enemyElement The
   *     element of the enemy.
   * @param  {!SpellAccuracy} accuracy The accuracy
   *     of this spell, based on how well it was drawn by the player.
   * @return {number} The amount of damage
   */
  getDamageForSpell(attackElement, enemyElement, accuracy) {
    let Elements = SpellElement;

    if (enemyElement == Elements.FIRE && attackElement != Elements.WATER) {
      return 0;
    }

    if (enemyElement == Elements.WATER && attackElement != Elements.FIRE) {
      return 0;
    }

    if (enemyElement == Elements.AIR && attackElement != Elements.EARTH) {
      return 0;
    }

    if (enemyElement == Elements.EARTH && attackElement != Elements.AIR) {
      return 0;
    }

    let damage = GameConstants.
    PLAYER_ATTACK_SPELL_DAMAGE_MAP.get(accuracy);

    if (this.casterBonus_ ==
      PlayerBonus.ATTACK) {
      damage += GameConstants.PLAYER_ATTACK_BONUS;
    }

    return damage;
  };

  /** @override */
  onUpdate(timeElapsed) {};

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
  PlayerAttackSpell
}
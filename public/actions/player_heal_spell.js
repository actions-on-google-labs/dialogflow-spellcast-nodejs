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

/**
 * Attack spell cast by players. Constructor has no parameters to make this easy
 * to allocate from a pool.
 * @constructor
 * @extends {Action}
 */
class PlayerHealSpell extends Action {
  constructor() {
    super();
    /** @private {SpellcastGame} */
    this.game_ = null;

    /** @private {gameobjects.Player} */
    this.caster_ = null;

    /** @private {SpellAccuracy} */
    this.accuracy_ = SpellAccuracy.GOOD;

    /** @private {!PlayerBonus} */
    this.casterBonus_ = PlayerBonus.NONE;

    /** @private {boolean} */
    this.healUpdated_ = false;
  };

  /**
   * Initializes the heal spell.
   * @param {!SpellcastGame} game
   * @param {!gameobjects.Player} caster
   * @param {!SpellAccuracy} accuracy
   */
  init(game, caster, accuracy) {
    this.game_ = game;
    this.caster_ = caster;
    this.accuracy_ = accuracy;
  };

  /** @override */
  onStart() {
    if (!this.caster_.playerId) {
      throw Error('Missing caster player ID');
    }
    this.casterBonus_ = this.game_.getPlayerBonus(this.caster_.playerId);
    this.caster_.moveForward();

    this.game_.getAudioManager().playHeal();
  };


  /** @override */
  onUpdate(timeElapsed) {
    if (timeElapsed > GameConstants.HEAL_FX_DURATION &&
      !this.healUpdated_) {
      this.game_.enableHeal(GameConstants.PLAYER_HEAL_SPRITE_SCALE_MAP.get(this.accuracy_));
      this.healUpdated_ = true;
    }
  };


  /** @override */
  onFinish() {
    this.caster_.moveBackward();
    this.game_.disableHeal();

    let healthValue = GameConstants.
    PLAYER_HEAL_SPELL_VALUE_MAP.get(this.accuracy_);

    if (this.casterBonus_ == PlayerBonus.HEAL) {
      healthValue += GameConstants.PLAYER_HEAL_BONUS;
    }

    this.game_.updatePartyHealth(healthValue);
  };


  /** @override */
  getExecutionTime() {
    return 2000;
  };

  /** @override */

  getShouldFinishOnNextUpdate() {
    return false;
  };
}
export {
  PlayerHealSpell
}
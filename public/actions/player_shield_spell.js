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
 * A spell that enables the shield for the player's party. Constructor has no
 * parameters to make this easy to allocate from a pool.
 * @constructor
 * @extends {Action}
 */
class PlayerShieldSpell extends Action {
  constructor() {
    super();
    /** @private {SpellcastGame} */
    this.game_ = null;

    /** @private {gameobjects.Player} */
    this.caster_ = null;

    /** @private {boolean} True if we moved the caster forward. */
    this.casterMoved_ = false;

    /** @private {!PlayerBonus} */
    this.casterBonus_ = PlayerBonus.NONE;

    /**
     * Set to true when we actually update the party shield after a short delay.
     * @private {boolean}
     */
    this.partyShieldUpdated_ = false;

    /**
     * The new value of the party shields after this spell is cast.
     * @private {number}
     */
    this.partyShieldNewValue_ = 0;

    /** @private {SpellAccuracy} */
    this.accuracy_ = SpellAccuracy.GOOD;
  };

  /**
   * Initializes the shield spell.
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
      throw Error('No caster player ID');
    }
    this.casterBonus_ = this.game_.getPlayerBonus(this.caster_.playerId);

    switch (this.game_.getNumberOfShieldSpellsCastThisRound()) {
      // This is the first shield spell. Activate shields and set the proper
      // effects.
      case 0:
        this.casterMoved_ = true;
        this.caster_.moveForward();

        let shieldValue = GameConstants
          .PLAYER_SHIELD_SPELL_VALUE_MAP.get(this.accuracy_);

        if (this.casterBonus_ ==
          PlayerBonus.SHIELD) {
          shieldValue += GameConstants.PLAYER_SHIELD_BONUS;
        }

        this.partyShieldNewValue_ = shieldValue;
        this.game_.getAudioManager().playShield();
        break;
        // This is the second spell. This will disrupt the previous shield.
      case 1:
        this.casterMoved_ = true;
        this.caster_.moveForward();
        this.partyShieldNewValue_ = 0;
        this.game_.getAudioManager().playShieldDisrupt();
        break;
        // Do nothing for repeated shields after the second one.
      default:
        this.game_.disablePartyShield();
        this.executionTime = 100;
        break;
    }

    this.game_.addNumberOfShieldSpellsCastThisRound();
  };


  /** @override */
  onUpdate(elapsedTime) {
    if (elapsedTime > GameConstants.SHIELD_FX_DURATION &&
      !this.partyShieldUpdated_) {

      // Apply a tint if the caster has a shield bonus.
      let tint = GameConstants.SHIELD_NORMAL_TINT;
      if (this.casterBonus_ == PlayerBonus.SHIELD) {
        tint = GameConstants.SHIELD_BONUS_TINT;
      }

      let alpha = GameConstants.
      PLAYER_CASTING_SPRITE_ALPHA_MAP.get(this.accuracy_);

      if (this.partyShieldNewValue_ > 0) {
        this.game_.enablePartyShield(this.partyShieldNewValue_, alpha, tint);
      } else {
        this.game_.disablePartyShield();
      }
      this.partyShieldUpdated_ = true;
    }
  };


  /** @override */
  onFinish() {
    if (this.casterMoved_) {
      this.caster_.moveBackward();
    }
    // Note that the shield will be disabled when PlayerActionPhase begins.
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
  PlayerShieldSpell
}
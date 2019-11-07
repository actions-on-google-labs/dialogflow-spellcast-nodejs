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
  ObjectPool
} from './common/object_pool.js';
import {
  CountdownAction
} from './actions/countdown_action.js';
import {
  EnemyAttackSpell
} from './actions/enemy_attack_spell.js';
import {
  EnemyDeathAction
} from './actions/enemy_death_action.js';
import {
  FullScreenDisplayAction
} from './actions/full_screen_display_action.js';
import {
  PartyDeathAction
} from './actions/party_death_action.js';
import {
  PlayerAttackSpell
} from './actions/player_attack_spell.js';
import {
  PlayerHealSpell
} from './actions/player_heal_spell.js';
import {
  PlayerShieldSpell
} from './actions/player_shield_spell.js';

/**
 * Used to execute a sequence of {@link Action}
 * objects such as a list of game actions (attacks, spells, etc).
 * @param {!SpellcastGame} game
 * @constructor
 */
class ActionManager {

  constructor(game) {
    /** @private {!SpellcastGame} */
    this.game_ = game;

    /** @private {Array.<!Action>} */
    this.actions_ = null;

    /**
     * True if actions are currently being executed.
     * @private {boolean}
     */
    this.executing_ = false;

    /**
     * The action we are currently executing.
     * @private {Action}
     */
    this.currentAction_ = null;

    /**
     * Time we started executing the current action.
     * @private {number}
     */
    this.currentActionStartTime_ = -1;

    /** @private {boolean} */
    this.isPaused_ = false;

    /** @private {number} Timestamp when game was paused. */
    this.pausedTime_ = 0;

    /**
     * @private {!ObjectPool.<
     *     !PlayerAttackSpell>}
     */
    this.playerAttackSpellPool_ = new ObjectPool(
      'PlayerAttackSpell', 100,
      () => {
        return new PlayerAttackSpell();
      });

    /**
     * @private {!ObjectPool.<
     *     !PlayerHealSpell>}
     */
    this.playerHealSpellPool_ = new ObjectPool(
      'PlayerHealSpell', 100,
      () => {
        return new PlayerHealSpell();
      });

    /**
     * @private {!ObjectPool.<
     *     !PlayerShieldSpell>}
     */
    this.playerShieldSpellPool_ = new ObjectPool(
      'PlayerShieldSpell', 100,
      () => {
        return new PlayerShieldSpell();
      });

    /**
     * @private {!ObjectPool.<
     *     !CountdownAction>}
     */
    this.countdownPool_ = new ObjectPool(
      'CountdownAction', 10,
      () => {
        return new CountdownAction();
      });

    /**
     * @private {!ObjectPool.<
     *     !EnemyAttackSpell>}
     */
    this.enemyAttackSpellPool_ = new ObjectPool(
      'EnemyAttackSpell', 10,
      () => {
        return new EnemyAttackSpell();
      });

    /**
     * @private {!ObjectPool.<
     *     !EnemyDeathAction>}
     */
    this.enemyDeathPool_ = new ObjectPool(
      'EnemyDeathAction', 10,
      () => {
        return new EnemyDeathAction();
      });

    /**
     * @private {!ObjectPool.<
     *     !PartyDeathAction>}
     */
    this.partyDeathPool_ = new ObjectPool(
      'PartyDeathAction', 10,
      () => {
        return new PartyDeathAction();
      });

    /**
     * @private {!ObjectPool.<
     *     !Array.<!Action>>}
     */
    this.actionListPool_ = new ObjectPool(
      'Array.<Action>', 10,
      () => {
        return [];
      });

    /**
     * @private {!ObjectPool.<
     *     !FullScreenDisplayAction>}
     */
    this.fullScreenDisplayPool_ = new ObjectPool(
      'FullScreenDisplayAction', 10,
      () => {
        return new FullScreenDisplayAction();
      });
  };


  /**
   * Starts executing actions. There cannot be any actions left to execute from
   * by a previous call to #startExecuting.
   * @param {!Array.<!Action>} actions The list of
   *     action objects to execute obtained from #getActionList.
   */
  startExecuting(actions) {
    if (this.actions_ && this.actions_.length) {
      console.log('ActionManager was started before reset() was called.');
      this.releaseActionList(this.actions_);
    }
    this.actions_ = actions;
    this.executing_ = true;
  };


  /**
   * Returns wheather there are actions left to execute (i.e. #reset was called).
   * @return {boolean}
   */
  isDone() {
    return !this.actions_ || (!this.actions_.length && !this.executing_);
  };


  /**
   * Releases all actions passed in from #startExecuting using #releaseActionList,
   * without executing them.  Must be called before #startExecuting is called
   * again.
   */
  reset() {
    if (this.actions_) {
      this.releaseActionList(this.actions_);
    }
    this.actions_ = null;
    this.executing_ = false;
  };


  /** Updates actions, if applicable. Should be called in game animation loop. */
  update() {
    if (!this.executing_ || !this.actions_ || this.isPaused_) {
      return;
    }

    let currentTime = Date.now();
    if (this.currentAction_) {
      let elapsedTime = currentTime - this.currentActionStartTime_;

      // If we have an action, update and check if it's done.
      this.currentAction_.onUpdate(elapsedTime);
      if (this.currentAction_.getShouldFinishOnNextUpdate() ||
        elapsedTime > this.currentAction_.getExecutionTime()) {
        this.currentAction_.onFinish();
        this.releaseAction_(this.currentAction_);
        this.currentAction_ = null;
      }
    } else {
      // Otherwise, try to get one.
      if (this.actions_.length > 0) {
        this.currentAction_ = this.actions_.shift();
        this.currentAction_.onStart();
        this.currentActionStartTime_ = currentTime;
      } else {
        // We are done with all actions.
        this.reset();
      }
    }
  };


  /** Pauses actions. #update will not do anything until #resume is called. */
  pause() {
    this.isPaused_ = true;
    this.pausedTime_ = Date.now();
  };


  /** Resumes actions that were paused by calling #pause. */
  resume() {
    this.isPaused_ = false;

    // Shift the time used to check elapsed time of actions by the pause duration
    // to make sure action timing ignores the paused time.
    this.currentActionStartTime_ += Date.now() - this.pausedTime_;
  };


  /**
   * Creates an empty array that actions can be added to.
   * @return {!Array.<!Action>}
   */
  getActionList() {
    let actionList = this.actionListPool_.getObject();
    actionList.length = 0;
    return actionList;
  };


  /**
   * Releases a list of actions created by #getEmptyActionList.
   * @param {!Array.<!Action>} actions
   * @param {boolean=} opt_releaseListOnly If true, only release the list and
   *     not the contents.
   */
  releaseActionList(actions, opt_releaseListOnly) {
    // Release the actions in the list.
    for (let i = 0; i < actions.length && !opt_releaseListOnly; i++) {
      let action = actions[i];
      this.releaseAction_(action);
    }

    // Release the list itself.
    this.actionListPool_.releaseObject(actions);

    // Reset the array.
    actions.length = 0;
  };


  /**
   * Releases an action back to its pool.
   * @param {!Action} action
   * @private
   */
  releaseAction_(action) {
    if (action instanceof PlayerAttackSpell) {
      this.playerAttackSpellPool_.releaseObject(action);
    } else if (action instanceof PlayerHealSpell) {
      this.playerHealSpellPool_.releaseObject(action);
    } else if (action instanceof PlayerShieldSpell) {
      this.playerShieldSpellPool_.releaseObject(action);
    } else if (action instanceof CountdownAction) {
      this.countdownPool_.releaseObject(action);
    } else if (action instanceof EnemyAttackSpell) {
      this.enemyAttackSpellPool_.releaseObject(action);
    } else if (action instanceof EnemyDeathAction) {
      this.enemyDeathPool_.releaseObject(action);
    } else if (action instanceof PartyDeathAction) {
      this.partyDeathPool_.releaseObject(action);
    } else if (action instanceof FullScreenDisplayAction) {
      this.fullScreenDisplayPool_.releaseObject(action);
    } else {
      throw Error('Unsupported player action found in action list : ' + action);
    }
  };


  /**
   * Creates a player basic attack action.
   * @param {!gameobjects.Player} caster The player who
   *     casted this.
   * @param {!gameobjects.Enemy} enemy The enemy of this
   *     encounter.
   * @param {!Spell} spell
   * @return {!Action}
   */
  getPlayerBasicAttackAction(caster, enemy, spell) {
    let element = spell.spellElement;
    let accuracy = spell.spellAccuracy;
    let action = this.playerAttackSpellPool_.getObject();
    action.init(this.game_, caster, enemy, element, accuracy);
    return action;
  };


  /**
   * Creates a player heal action.
   * @param {!gameobjects.Player} caster The player who
   *     casted this.
   * @param {!Spell} spell
   * @return {!Action}
   */
  getPlayerHealAction(caster, spell) {
    let accuracy = spell.spellAccuracy;
    let action = this.playerHealSpellPool_.getObject();
    action.init(this.game_, caster, accuracy);
    return action;
  };


  /**
   * Creates a player shield action.
   * @param {!gameobjects.Player} caster The player who
   *     who casted this.
   * @param {!Spell} spell
   * @return {!Action}
   */
  getPlayerShieldAction(caster, spell) {
    let accuracy = spell.spellAccuracy;
    let action = this.playerShieldSpellPool_.getObject();
    action.init(this.game_, caster, accuracy);
    return action;
  };


  /**
   * Creates a countdown action.
   * @return {!Action}
   */
  getCountdownAction() {
    let action = this.countdownPool_.getObject();
    action.init(this.game_);
    return action;
  };


  /**
   * Creates an enemy attack spell action.
   * @param {!gameobjects.Enemy} caster
   * @param {!gameobjects.Player} target
   * @param {!SpellElement} element
   * @param {number} strength One of the constants defined in
   *     {@link GameConstants.ENEMY_ATTACK_STRENGTH}
   * @return {!Action}
   */
  getEnemyAttackAction(caster, target, element, strength) {
    let action = this.enemyAttackSpellPool_.getObject();
    action.init(this.game_, caster, target, element, strength);
    return action;
  };


  /**
   * Creates an enemy death action.
   * @param {!gameobjects.Enemy} enemy
   * @return {!Action}
   */
  getEnemyDeathAction(enemy) {
    let action = this.enemyDeathPool_.getObject();
    action.init(enemy);
    return action;
  };


  /**
   * Creates a party death action.
   * @return {!Action}
   */
  getPartyDeathAction() {
    let action = this.partyDeathPool_.getObject();
    action.init(this.game_);
    return action;
  };


  /**
   * Creates a full screen display action.
   * @param {!gameobjects.FullScreenDisplay}
   *     fullScreenDisplay
   * @param {number} displayDuration
   * @return {!Action}
   */
  getFullScreenDisplayAction(fullScreenDisplay, displayDuration) {
    let action = this.fullScreenDisplayPool_.getObject();
    action.init(this.game_, fullScreenDisplay, displayDuration);
    return action;
  };
};

export {
  ActionManager
}
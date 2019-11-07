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
  GameStateId
} from './spellcast_messages.js';

/**
 * Manages a set of {@link State} objects.
 * @param {!SpellcastGame} game
 * @constructor
 */
class StateMachine {
  constructor(game) {
    /** @private {!SpellcastGame} */
    this.game_ = game;

    /**
     * @private {!Object.<GameStateId,
     *     !State>}
     */
    this.states_ = Object.create(null);

    /** @private {GameStateId} */
    this.currentStateId_ = GameStateId.UNKNOWN;

    /** @private {State} */
    this.currentState_ = null;
  };


  /**
   * Adds a state.
   * @param {GameStateId} id
   * @param {!State} state
   */
  addState(id, state) {
    this.states_[id] = state;
  };


  /**
   * Removes a state.
   * @param {GameStateId} id
   */
  removeState(id) {
    delete this.states_[id];
  };


  /**
   * Go to state and broadcast current game status to all players.
   * @param {GameStateId} id
   */
  goToState(id) {
    if (this.currentState_) {
      this.currentState_.onExit(id);
    }
    let previousStateId = this.currentStateId_;
    this.currentStateId_ = id;
    this.currentState_ = this.states_[id];
    if (!this.currentState_) {
      throw Error('No state found for ' + id);
    }
    this.currentState_.onEnter(previousStateId);
    this.game_.broadcastGameStatus(this.currentStateId_);
  };


  /**
   * Returns the state object with the provided id, if it exists.
   * @param {GameStateId} id
   * @return {State} The state associated with the
   *     provided id, or null if not found.
   */
  getState(id) {
    return this.states_[id];
  };


  /** @return {State} Returns the current state if any. */
  getCurrentState() {
    return this.currentState_;
  };


  /** Updates the current state. Should be called in game animation loop. */
  update() {
    if (this.currentState_) {
      this.currentState_.onUpdate();
    }
  };
}
export {
  StateMachine
}
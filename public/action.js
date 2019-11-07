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
 * Represents a action being taken by a character in the game, such as an
 * attack, a heal spell, etc.
 */
class Action {
  constructor() {};

  /**
   * The number of milliseconds this action should be executing for.
   * @return {number}
   */
  getExecutionTime() {};


  /**
   * Called by {@link ActionManager} when an action
   * starts execution.
   */
  onStart() {};


  /**
   * Called by {@link ActionManager} every game
   * update while this action is executing.
   * @param {number} timeElapsed
   */
  onUpdate() {};


  /**
   * Called by {@link ActionManager} when this
   * action's execution time has exceeded.
   * {@link Action.executionTime}.
   */
  onFinish() {};


  /**
   * @return {boolean} True if this action should complete the next time the
   *     action manager calls onUpdate().
   */
  getShouldFinishOnNextUpdate() {};
}
export {
  Action
}
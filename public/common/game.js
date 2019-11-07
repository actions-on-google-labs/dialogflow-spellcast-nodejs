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
 * Specifies a common class for all game demos.
 * @class
 */
class Game {
  constructor() {};

  /**
   * Runs the game. Game should load if not loaded yet.
   * @param {function()} loadedCallback This function will be called when the game
   *     finishes loading or is already loaded and about to actually run.
   */
  run() {};


  /** Stops the game. */
  stop() {};
}
export {
  Game
}
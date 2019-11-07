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
 * All objects except enemies in the game extends this class.
 * @class
 */
class GameObject {
  constructor() {};

  /**
   * Implement this to update position and animation state.
   * @param {number} deltaTime Time in msec between current and previous animation
   *     frame. Useful for adjusting speeds depending on frame rate.
   */
  update() {};


  /**
   * Activates this object at the specified location.
   * @param {!PIXI.Point} position Normalized x and y position. This avoids
   *    allocating two doubles during parameter passing.
   * @param {...} var_args Classes implementing this method can add more
   *    arguments.
   */
  activate() {};


  /**
   * Deactivates this object.
   */
  deactivate() {};
}
export {
  GameObject
}
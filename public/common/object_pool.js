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
} from '../spellcast_messages.js';

/**
 * A generic object pool. Uses a single array and avoids resizing it, 
 * making it efficient.
 *
 * @param {string} name The name for this pool.
 * @param {number} initialSize The initial size of the pool.
 * @param {Function} factory A function used to construct new objects.
 * @constructor
 * @template T
 */
class ObjectPool {
  constructor(name, initialSize, factory) {

    /** @private {string} */
    this.name_ = name;

    /** @private {Function} */
    this.factory_ = factory;

    /** @private {!Array.<!T>} */
    this.pool_ = [];

    /** @private {number} Index of the first free element in the pool. */
    this.currentIndex_ = 0;

    for (let i = 0; i < initialSize; i++) {
      let object = this.factory_();
      this.pool_.push(object);
    }
  };

  /**
   * Gets an object from the pool. If no more objects are available, a new one
   * will be created, and a warning will be raised.
   * @return {!T} An object from the pool.
   */
  getObject() {
    let object = this.pool_[this.currentIndex_];
    this.currentIndex_++;

    // If that was the last one, create a new one. The pool should always have at
    // least one free object.
    if (this.currentIndex_ == this.pool_.length) {
      let newObject = this.factory_();
      this.pool_[this.currentIndex_] = newObject;
      console.log('Constructing new object on pool: ' + this.name_ +
        '. This should not happen. Increase initial pool size.');
    }

    return object;
  };


  /**
   * Returns an object to the pool. Make sure the object is of the correct type
   * and is no longer in use before releasing it.
   * @param {!T} object An object to be released to the pool.
   */
  releaseObject(object) {
    // Safety check, this should never happen.
    if (this.currentIndex_ == 0) {
      console.log('Error releasing object on pool: ' + this.name_ +
        '. The pool had no borrowed objects.');
    }

    // The idea here is to swap the object being released with the last used
    // object in the array and then just decrement the currentIndex, effectively
    // marking the released object as free.

    // We are going to swap the objects in these 2 indexes, so that all the used
    // objects are next to each other.
    let objectIndex = -1;
    for (let i = 0; i < this.currentIndex_; i++) {
      if (this.pool_[i] == object) {
        objectIndex = i;
        break;
      }
    }
    if (objectIndex == -1) {
      console.log('Error releasing object on pool: ' + this.name_ +
        '. The released object was not provided by this pool.');
    }
    let newObjectIndex = this.currentIndex_ - 1;

    // Unless it was already on the right location.
    if (objectIndex != newObjectIndex) {
      let another = this.pool_[newObjectIndex];
      this.pool_[objectIndex] = another;

      // Configure the released object in its new home.
      this.pool_[newObjectIndex] = object;
    }

    // Mark it as a free object.
    this.currentIndex_--;
  };
}

export {
  ObjectPool
}
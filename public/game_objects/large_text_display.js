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
  GameObject
} from './game_object.js';

/**
 * Represents a large text message with no background color. Useful for making
 * big countdowns. Call #setText to set actual text displayed. Uses HTML instead
 * of PIXI because rendering text is slow.
 * @constructor
 * @struct
 * @extends {GameObject}
 */
class LargeTextDisplay extends GameObject {
  constructor() {
    super();
    /** @public {!PIXI.Text} */
    this.text = new PIXI.Text('???', {
      fontFamily: 'Arial',
      fontSize: '128px',
      fill: 'black',
      align: 'center'
    });

    /** @public {boolean} */
    this.active = false;

    /** @private {!Element} */
    this.textElement_ = document.createElement('div');
    this.textElement_.style.color = 'black';
    this.textElement_.style.fontFamily = 'Arial';
    this.textElement_.style.fontSize = '128px';
    this.textElement_.style.height = '100%';
    this.textElement_.style.textAlign = 'center';
    this.textElement_.style.verticalAlign = 'middle';
    this.textElement_.style.visibility = 'hidden';
    this.textElement_.style.width = '100%';
    this.textElement_.style.zIndex = '1000';
    document.body.appendChild(this.textElement_);
  };


  /**
   * Sets the text displayed.
   * @param {string} text
   */
  setText(text) {
    this.textElement_.innerText = text;
  };


  /** @override */
  activate(position) {
    this.active = true;
    this.textElement_.style.visibility = 'visibile';
  };


  /** @override */
  deactivate() {
    this.active = false;
    this.textElement_.style.visibility = 'hidden';
  };


  /** @override */
  update(deltaTime) {};
}
export {
  LargeTextDisplay
}
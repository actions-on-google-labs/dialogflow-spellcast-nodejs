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
  GameConstants
} from '../game_constants.js';
import {
  GameObject
} from './game_object.js';

/**
 * A reusable player in the game.
 * @param {!PIXI.Point} lobbyPosition Normalized lobby position.
 * @param {!PIXI.Point} battlePosition Normalized battle position.
 * @param {!PIXI.Sprite} sprite
 * @param {!PIXI.Container} container
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @constructor
 * @struct
 * @extends {GameObject}
 */
class Player extends GameObject {
  constructor(lobbyPosition,
    battlePosition, sprite, container, canvasWidth, canvasHeight) {
    super();

    /** @public {boolean} */
    this.active = false;

    /** @public {!PIXI.Sprite} */
    this.sprite = sprite;

    /** @public {!PIXI.Container} */
    this.container = container;

    /** @public {number} */
    this.canvasWidth = canvasWidth;

    /** @public {number} */
    this.canvasHeight = canvasHeight;

    /** @public {?string} */
    this.playerId = null;

    /** @public {?string} */
    this.name = null;

    /** @public {!PIXI.Point} */
    this.lobbyPosition = lobbyPosition;

    /** @public {!PIXI.Point} */
    this.battlePosition = battlePosition;

    /** @public {number} */
    this.posX = lobbyPosition.x;

    /** @public {number} */
    this.posY = lobbyPosition.y;

    /** @public {!PIXI.Sprite} */
    this.shieldSprite = PIXI.Sprite.fromImage('assets/shield.png');

    /** @public {!PIXI.Sprite} */
    this.healSprite = PIXI.Sprite.fromImage('assets/heal.png');

    /** @public {!PIXI.Texture} */
    this.tilingTexture = PIXI.Texture.fromImage('assets/blank_tile.png');

    /** @public {!PIXI.extras.TilingSprite} */
    this.nameBackground = new PIXI.extras.TilingSprite(this.tilingTexture,
      canvasWidth * 0.1, 24);

    /** @public {!PIXI.Text} */
    this.nameText = new PIXI.Text('???', {
      fontFamily: 'Arial',
      fontSize: '16px',
      fill: 'white'
    });

    /** @private {boolean} */
    this.nameUpdated_ = false;

    /** @private {!Function} */
    this.updateTextFn_ = this.updateText_.bind(this);

    this.shieldSprite.anchor.x = 0.7;
    this.shieldSprite.anchor.y = 1.1;
    this.shieldSprite.tint = 0xFFFF00;
    this.shieldSprite.position.x = 0;
    this.shieldSprite.position.y = 0;

    this.healSprite.alpha = 0.75;
    this.healSprite.anchor.x = 0.7;
    this.healSprite.anchor.y = 1.1;
    this.healSprite.position.x = 0;
    this.healSprite.position.y = 0;
    this.healSprite.scale.x = 0.5;
    this.healSprite.scale.y = 0.5;

    this.nameBackground.anchor.x = 0.5;
    this.nameBackground.anchor.y = 0;
    this.nameBackground.position.x = 0;
    this.nameBackground.position.y = 65;
    this.nameBackground.tint = 0x000000;
    this.nameBackground.alpha = 0.5;
    this.sprite.addChild(this.nameBackground);

    this.nameText.anchor.x = 0.5;
    this.nameText.anchor.y = 0;
    this.nameText.position.x = 0;
    this.nameText.position.y = 65;
    this.sprite.addChild(this.nameText);

    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.visible = false;
    this.container.addChild(this.sprite);
  };


  /**
   * Sets the player ID and the name.
   * @param {string} playerId Unique player ID.
   * @param {string} name Name to identify the player on the screen.
   */
  setPlayerIdAndName(playerId, name) {
    this.playerId = playerId;
    this.name = name;
    this.nameText.text = name;
    this.nameUpdated_ = true;
  };


  /**
   * Updates the width of the background text. Only called once.
   * @private
   */
  updateText_() {
    this.nameBackground.width = this.nameText.width + 4;
    this.nameUpdated_ = false;
  };


  /** @override */
  activate(position, showNameText) {
    this.active = true;
    this.posX = position.x;
    this.posY = position.y;
    this.sprite.position.x = this.canvasWidth * position.x;
    this.sprite.position.y = this.canvasHeight * position.y;
    this.sprite.visible = true;
    this.nameText.visible = showNameText;
    this.nameBackground.visible = showNameText;
  };


  /** @override */
  deactivate() {
    this.active = false;
    this.sprite.visible = false;
    this.disableShield();
    this.disableHeal();
  };


  /** @override */
  update(deltaTime) {
    this.sprite.position.x = this.canvasWidth * this.posX;
    this.sprite.position.y = this.canvasHeight * this.posY;

    if (this.nameUpdated_) {
      requestAnimationFrame(this.updateTextFn_);
    }
  };


  /**
   * Enables shield for this player.
   * @param {number} alpha Alpha applied to player shield sprite.
   * @param {number} tint Tint applied to player shield sprite.
   */
  enableShield(alpha, tint) {
    console.log('enableShield: ' + alpha + ', ' + tint)
    if (this.shieldSprite.parent) {
      return;
    }

    this.shieldSprite.alpha = alpha;
    this.shieldSprite.tint = tint;
    this.sprite.addChild(this.shieldSprite);
  };


  /**
   * Disables shield for this player.
   */
  disableShield() {
    if (this.shieldSprite.parent != this.sprite) {
      return;
    }

    this.sprite.removeChild(this.shieldSprite);
  };


  /**
   * Enables heal effect on this player.
   * @param {number} scale X and Y scale applied on player heal sprite.
   */
  enableHeal(scale) {
    console.log('enableHeal: ' + scale)
    this.healSprite.scale.x = scale;
    this.healSprite.scale.y = scale;
    if (this.healSprite.parent) {
      return;
    }

    this.sprite.addChild(this.healSprite);
  };


  /**
   * Disables heal effect on this player.
   */
  disableHeal() {
    if (this.healSprite.parent != this.sprite) {
      return;
    }

    this.sprite.removeChild(this.healSprite);
  };


  /** Moves player forward. */
  moveForward() {
    this.posX += GameConstants.PLAYER_SPELL_X_OFFSET;
  };


  /** Moves player backward. */
  moveBackward() {
    this.posX -= GameConstants.PLAYER_SPELL_X_OFFSET;
  };
}
export {
  Player
}
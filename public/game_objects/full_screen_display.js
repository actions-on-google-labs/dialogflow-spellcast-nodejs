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
 * Maps image asset URLs to images to prevent repeated image elements.
 * @private {!Object.<string, !Element>}
 */
const Images_ = {};

/**
 * Represents a full screen background image with an optional text image in the
 * center (e.g. showing instructions over a background).
 * @param {string} backgroundImageUrl
 * @param {number} backgroundBrightness
 * @param {string=} opt_textImageUrl Can be set to null for no text.
 * @param {PIXI.Rectangle=} opt_textSize Size of text asset in pixels or null
 *     to use full screen. Only the width and height information will be used.
 * @constructor
 * @struct
 * @extends {GameObject}
 */
class FullScreenDisplay extends GameObject {
  constructor(backgroundImageUrl, backgroundBrightness, opt_textImageUrl, opt_textSize) {
    super();
    /** @public {boolean} */
    this.active = false;

    const view = document.getElementById('view');

    let backgroundImage =
      Images_[
        backgroundImageUrl];
    if (!backgroundImage) {
      throw new Error('backgroundImageUrl not loaded : ' + backgroundImageUrl);
    } else if (!backgroundImage.parentNode) {
      backgroundImage.style.height = '100%';
      backgroundImage.style.position = 'absolute';
      backgroundImage.style.visibility = 'hidden';
      backgroundImage.style.width = '100%';
      backgroundImage.style.top = view.style.paddingTop;
      document.body.appendChild(backgroundImage);
    }

    /** @private {!Element} */
    this.backgroundImage_ = backgroundImage;

    /** @private {string} */
    this.backgroundBrightness_ = 'brightness(' + backgroundBrightness + ')';

    /** @private {Element} */
    this.textImage_ = null;

    let textImage = opt_textImageUrl ?
      Images_[
        opt_textImageUrl] : null;
    if (opt_textImageUrl && !textImage) {
      throw new Error('opt_textImageUrl not loaded : ' + opt_textImageUrl);
    }
    if (opt_textImageUrl && textImage && !textImage.parentNode) {
      if (opt_textSize) {
        textImage.style.left = '50%';
        textImage.style.height = opt_textSize.height + 'px';
        textImage.style.margin = '-' + (opt_textSize.height / 2) + 'px 0 0 -' +
          (opt_textSize.width / 2) + 'px';
        textImage.style.width = opt_textSize.width + 'px';
        textImage.style.top = '50%';
      } else {
        textImage.style.bottom = '0';
        textImage.style.left = '0';
        textImage.style.margin = 'auto';
        textImage.style.position = 'absolute';
        textImage.style.right = '0';
        textImage.style.top = view.style.paddingTop;
      }
      textImage.style.position = 'absolute';
      textImage.style.visibility = 'hidden';
      document.body.appendChild(textImage);
    }
    this.textImage_ = textImage;
  };

  /** @override */
  activate(position) {
    this.active = true;
    this.backgroundImage_.style.visibility = 'visible';
    this.backgroundImage_.style['-webkit-filter'] = this.backgroundBrightness_;
    if (this.textImage_) {
      this.textImage_.style.visibility = 'visible';
    }
  };


  /** @override */
  deactivate() {
    this.active = false;
    this.backgroundImage_.style.visibility = 'hidden';
    if (this.textImage_) {
      this.textImage_.style.visibility = 'hidden';
    }
  };


  /** @override */
  update(deltaTime) {};

  /**
   * Loads image assets for use with this class.
   * @param {!Array.<string>} imageUrls
   * @return {Promise} A promise when all images are loaded.
   */
  static loadImages(imageUrls) {
    let numberImagesLoaded = 0;

    return new Promise((resolve, reject) => {
      imageUrls.forEach((imageUrl) => {
        let image = new Image();
        image.src = imageUrl;
        image.addEventListener('load', () => {
          Images_[imageUrl] =
            image;
          numberImagesLoaded++;
          if (numberImagesLoaded == imageUrls.length) {
            resolve();
          }
        });
      });
    });
  };
}
export {
  FullScreenDisplay
}
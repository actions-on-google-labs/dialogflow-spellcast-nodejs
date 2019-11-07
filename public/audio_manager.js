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
 * Manages audio for spellcast.
 */
class AudioManager {

  constructor() {
    /** @private {Howl} */
    this.backgroundMusic_ = null;

    /** @private {Howl} */
    this.explosionSound_ = null;

    /** @private {Howl} */
    this.healSound_ = null;

    /** @private {Howl} */
    this.shieldSound_ = null;

    /** @private {Howl} */
    this.shieldDisruptSound_ = null;

    /** @private {Howl} */
    this.attackSound_ = null;
  };


  /** Loads all audio assets. */
  loadAllAudio() {
    this.healSound_ = new Howl({
      src: ['assets/heal.ogg']
    }).load();
    this.shieldSound_ = new Howl({
      src: ['assets/shield.ogg']
    }).load();
    this.shieldDisruptSound_ = new Howl({
      src: ['assets/shield_disrupt.ogg']
    }).load();
    this.attackSound_ = new Howl({
      src: ['assets/attack.ogg']
    }).load();
    this.explosionSound_ = new Howl({
      src: ['assets/explosion.ogg']
    }).load();
    this.backgroundMusic_ = new Howl({
      loop: true,
      volume: 0.1,
      src: ['assets/music.ogg'],
    }).load();
  };


  /** Plays heal sound. */
  playHeal() {
    this.healSound_.play();
  };


  /** Plays shield sound. */
  playShield() {
    this.shieldSound_.play();
  };


  /** Plays shield disrupt sound. */
  playShieldDisrupt() {
    this.shieldDisruptSound_.play();
  };


  /** Plays attack sound. */
  playAttackSound() {
    this.attackSound_.play();
  };


  /** Plays explosion sound. */
  playExplosionSound() {
    this.explosionSound_.play();
  };


  /** Plays background music. */
  playBackgroundMusic() {
    this.backgroundMusic_.play();
  };


  /** Pauses background music. */
  pauseBackgroundMusic() {
    this.backgroundMusic_.pause();
  };
}
export {
  AudioManager
}
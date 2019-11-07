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
  GameManager
} from './game_manager.js';
import {
  Game
} from './common/game.js';
import {
  ActionManager
} from './action_manager.js';
import {
  AudioManager
} from './audio_manager.js';
import {
  GameConstants
} from './game_constants.js';
import {
  StateMachine
} from './state_machine.js';
import {
  AttackSpell
} from './game_objects/attack_spell.js';
import {
  ElementalEnemy
} from './game_objects/elemental_enemy.js';
import {
  Explosion
} from './game_objects/explosion.js';
import {
  FullScreenDisplay
} from './game_objects/full_screen_display.js';
import {
  HealthDisplay
} from './game_objects/health_display.js';
import {
  LargeTextDisplay
} from './game_objects/large_text_display.js';
import {
  Player
} from './game_objects/player.js';
import {
  TextDisplay
} from './game_objects/text_display.js';

import {
  EnemyResolutionPhase
} from './states/enemy_resolution_phase.js';
import {
  EnemyVictoryState
} from './states/enemy_victory_state.js';
import {
  InstructionsState
} from './states/instructions_state.js';
import {
  PausedState
} from './states/paused_state.js';
import {
  PlayerActionPhase
} from './states/player_action_phase.js';
import {
  PlayerResolutionPhase
} from './states/player_resolution_phase.js';
import {
  PlayerVictoryState
} from './states/player_victory_state.js';
import {
  WaitingForPlayersState
} from './states/waiting_for_players_state.js';

import {
  DifficultySetting,
  GameData,
  GameStateId,
  PlayerBonus,
  PlayerMessage,
  PlayerPlayingData,
  PlayerReadyData,
  Spell,
  SpellAccuracy,
  SpellElement,
  SpellMessage,
  SpellType,
  GameplayState,
  PlayerState,
  StatusCode,
  EventType
} from './spellcast_messages.js';

/**
 * Spellcast game.
 *
 * The game uses a state machine to transition between different states (e.g.
 * waiting for players in a lobby, showing instructions, waiting
 * for players to cast spells, showing the enemy attack, etc). Each state can
 * use game manager API events to respond to players (e.g. the lobby shows a
 * player on the screen when the game manager API PLAYER_READY event is fired).
 * Each state also uses an action manager to coordinate how game objects are
 * animated on the screen (e.g. moving a player forward and then move a spell
 * effect and then explode the spell on the enemy).
 */
class SpellcastGame extends Game {

  constructor(gameManager) {
    super();
    /** @private {!GameManager} */
    this.gameManager_ = gameManager;
    /**
     * Debug only. Set this to true to make the game automatically add players and
     * play by itself with no senders. Useful when testing and debugging,
     * especially when running standalone on a local web server.
     * @public {boolean}
     */
    this.randomAiEnabled = true;

    const view = document.getElementById('view');
    /** @private {number} */
    this.canvasWidth_ = view.clientWidth;

    /** @private {number} */
    this.canvasHeight_ = view.clientHeight;

    console.log(this.canvasWidth_);
    console.log(this.canvasHeight_);

    // Set up fps monitoring
    this.stats_ = new Stats();
    view.getElementsByClassName('stats')[0].appendChild(this.stats_.domElement);

    /** @private {function(number)} Pre-bound call to #update. */
    this.boundUpdateFunction_ = this.update_.bind(this);

    /**
     * Pre-bound call to #onPlayerQuit.
     * @private {function(Event)}
     */
    this.boundPlayerQuitCallback_ = this.onPlayerQuit_.bind(this);

    /**
     * Pre-bound call to #onGameMessageReceived.
     * @private {function(Event)}
     */
    this.boundGameMessageReceivedCallback_ =
      this.onGameMessageReceived_.bind(this);

    /** @private {boolean} */
    this.isLoaded_ = false;

    /** @private {boolean} */
    this.isRunning_ = false;

    /** @private {!AudioManager} */
    this.audioManager_ = new AudioManager();

    /** @private {!PIXI.WebGLRenderer} */

    //PIXI.settings.GC_MODE = PIXI.GC_MODES.MANUAL;

    this.renderer_ = new PIXI.autoDetectRenderer({
      transparent: true,
      antialias: true,
      width: this.canvasWidth_,
      height: this.canvasHeight_,
    });

    /** @private {!PIXI.Container} */
    this.container_ = new PIXI.Container();

    /** @private {Element} */
    this.loadingImageElement_ = document.createElement('img');
    // Show the loading image once the loading image is loaded.
    this.loadingImageElement_.onload = (() => {
      if (!this.isLoaded_) {
        view.appendChild(this.loadingImageElement_);
      }
    }).bind(this);
    this.loadingImageElement_.src = 'assets/title.jpg';

    /** @private {!PIXI.loaders.Loader} */
    this.loader_ = new PIXI.loaders.Loader();
    this.loader_.add('assets/air_explosion.json');
    this.loader_.add('assets/earth_explosion.json');
    this.loader_.add('assets/fire_explosion.json');
    this.loader_.add('assets/water_explosion.json');
    this.loader_.add('assets/heal.png');
    this.loader_.add('assets/wizards.json');
    this.loader_.add('assets/air_attack.json');
    this.loader_.add('assets/earth_attack.json');
    this.loader_.add('assets/fire_attack.json');
    this.loader_.add('assets/water_attack.json');
    this.loader_.add('assets/air_elemental_idle.json');
    this.loader_.add('assets/earth_elemental_idle.json');
    this.loader_.add('assets/fire_elemental_idle.json');
    this.loader_.add('assets/water_elemental_idle.json');
    this.loader_.add('assets/air_elemental_attack.json');
    this.loader_.add('assets/earth_elemental_attack.json');
    this.loader_.add('assets/fire_elemental_attack.json');
    this.loader_.add('assets/water_elemental_attack.json');
    this.loader_.add('assets/air_elemental_hit.json');
    this.loader_.add('assets/earth_elemental_hit.json');
    this.loader_.add('assets/fire_elemental_hit.json');
    this.loader_.add('assets/water_elemental_hit.json');
    this.loader_.add('assets/red_meter_bar.json');
    this.loader_.add('assets/green_meter_bar.json');
    this.loader_.add('assets/bg_meter_bar.json');
    this.loader_.add('assets/shield.png');
    this.loader_.add('assets/blank_tile.png');

    this.loader_.once('complete', this.onAssetsLoaded_.bind(this));

    // When all fullscreen assets are loaded, complete PIXI asset loading.
    FullScreenDisplay.loadImages([
      'assets/background.jpg',
      'assets/lobby_text.png',
      'assets/win_text.png',
      'assets/lose_text.png',
      'assets/instructions_text.png',
      'assets/paused_text.png'
    ]).then((() => {
      console.log('images loaded');
      this.loader_.load();
    }).bind(this));

    /** @private {?function()} Callback used with #run. */
    this.loadedCallback_ = null;

    /** @private {!Array.<string>} */
    this.PLAYER_ASSETS_ = [
      'wizard_1',
      'wizard_2',
      'wizard_3',
      'wizard_4'
    ];

    /** @private {!Array.<!PIXI.Point>} Normalized player lobby positions. */
    this.PLAYER_LOBBY_POSITIONS_ = [
      new PIXI.Point(0.2, 0.81),
      new PIXI.Point(0.4, 0.81),
      new PIXI.Point(0.6, 0.81),
      new PIXI.Point(0.8, 0.81)
    ];

    /** @private {!Array.<!PIXI.Point>} Normalized player battle positions. */
    this.PLAYER_BATTLE_POSITIONS_ = [
      new PIXI.Point(0.234375, 0.657778),
      new PIXI.Point(0.382811, 0.69111),
      new PIXI.Point(0.29609375, 0.7675),
      new PIXI.Point(0.1875, 0.80499)
    ];

    /** @private {FullScreenDisplay} */
    this.battlefieldDisplay_ = null;

    /** @private {FullScreenDisplay} */
    this.lobbyDisplay_ = null;

    /** @private {FullScreenDisplay} */
    this.playerVictoryDisplay_ = null;

    /** @private {FullScreenDisplay} */
    this.enemyVictoryDisplay_ = null;

    /** @private {FullScreenDisplay} */
    this.instructionsDisplay_ = null;

    /** @private {FullScreenDisplay} */
    this.pausedDisplay_ = null;

    /** @private {!Array.<!Player>} */
    this.playerPool_ = [];

    /** @private {!Array.<!PIXI.Texture>} Pool of player textures. */
    this.playerTextures_ = [];

    /** @private {HealthDisplay} */
    this.partyHealthDisplay_ = null;

    /** @private {!PIXI.Point} Used to position the party health display. */
    this.partyHealthDisplayPos_ = new PIXI.Point(0.05, 0.05);

    /** @private {Enemy} */
    this.enemy_ = null;

    /** @private {HealthDisplay} */
    this.enemyHealthDisplay_ = null;

    /** @private {!PIXI.Point} Used to position the enemy health display. */
    this.enemyHealthDisplayPos_ = new PIXI.Point(0.6, 0.05);

    /** @private {LargeTextDisplay} */
    this.countdownPlayerActionDisplay_ = null;

    /** @private {TextDisplay} */
    this.waitingPlayerActionDisplay_ = null;

    /**
     * A map of spell elements to attack spells.
     * @private {!Object.<!SpellElement,
     *     !AttackSpell>}
     */
    this.attackSpells_ = Object.create(null);

    /** @private {AttackSpell} */
    this.currentAttackSpell_ = null;

    /**
     * The amount of damage absorbed by the current party shield. 0 if no party
     * shield is active.
     * @private {number}
     */
    this.partyShieldValue_ = 0;

    /**
     * Incremented every time a player casts shield and reset at the end of the
     * player resolution phase.
     * @private {number}
     */
    this.numberOfShieldSpellsCastThisRound_ = 0;

    /**
     * A map of spell elements to explosions.
     * @private {!Object.<!SpellElement,
     *     !Explosion>}
     */
    this.explosions_ = Object.create(null);

    /** @private {Explosion} */
    this.currentExplosion_ = null;

    /** @private {!DifficultySetting} */
    this.gameDifficulty_ = DifficultySetting.EASY;

    /** @private {!PIXI.Point} Re-usable top-left corner position. */
    this.topLeftPosition_ = new PIXI.Point(0, 0);

    /** @private {number} Current health of the party. */
    this.partyHealth_ = -1;

    /** @private {number} Max health of the party of players. */
    this.partyMaxHealth_ = -1;

    /** @private {number} Current health of the enemy. */
    this.enemyHealth_ = -1;

    /** @private {number} Max health of the enemy. */
    this.enemyMaxHealth_ = -1;

    /** @private {!SpellElement} */
    this.enemyElement_ = SpellElement.NONE;

    /**
     * A map from player ids, to their assigned bonus for this round.
     * @private {!Object.<string, !PlayerBonus>}
     */
    this.playerBonus_ = Object.create(null);

    /** @private {PIXI.Sprite} */
    this.playerHealCastingSprite_ = null;

    /** @private {PIXI.Sprite} */
    this.playerShieldCastingSprite_ = null;

    /** @private {!ActionManager} */
    this.actionManager_ = new ActionManager(this);

    /** @private {number} */
    this.lastTime_ = 0;

    /**
     * Maps player IDs to spellcast player objects.
     * @private {!Object.<string, !Player>}
     */
    this.playerMap_ = Object.create(null);

    /**
     * A re-used list of players in the playing state updated by calls to
     * {@code GameManager.getPlayersInState}.
     * @private {!Array.<!PlayerInfo>}
     */
    this.playingPlayers_ = [];

    /**
     * Game data shared with players by the game manager.
     * @private {!GameData}
     */
    this.gameData_ = new GameData();

    /**
     * A reusable message sent to players. See #assignBonusesAndNotifyPlayers.
     * @private {!PlayerMessage}
     */
    this.playerMessage_ = new PlayerMessage();

    /** @private {!StateMachine} */
    this.stateMachine_ = new StateMachine(this);
    this.stateMachine_.addState(
      GameStateId.WAITING_FOR_PLAYERS,
      new WaitingForPlayersState(this,
        this.stateMachine_));
    this.stateMachine_.addState(
      GameStateId.INSTRUCTIONS,
      new InstructionsState(this,
        this.stateMachine_, this.actionManager_));
    this.stateMachine_.addState(
      GameStateId.PLAYER_ACTION,
      new PlayerActionPhase(this,
        this.stateMachine_, this.actionManager_));
    this.stateMachine_.addState(
      GameStateId.PLAYER_RESOLUTION,
      new PlayerResolutionPhase(this,
        this.stateMachine_, this.actionManager_));
    this.stateMachine_.addState(
      GameStateId.ENEMY_RESOLUTION,
      new EnemyResolutionPhase(this,
        this.stateMachine_, this.actionManager_));
    this.stateMachine_.addState(
      GameStateId.PLAYER_VICTORY,
      new PlayerVictoryState(this,
        this.stateMachine_, this.actionManager_));
    this.stateMachine_.addState(
      GameStateId.ENEMY_VICTORY,
      new EnemyVictoryState(this,
        this.stateMachine_, this.actionManager_));
    this.stateMachine_.addState(
      GameStateId.PAUSED,
      new PausedState(this,
        this.stateMachine_, this.actionManager_));

    this.counter_ = 0;
  };


  /**
   * Runs the game. Game should load if not loaded yet.
   * @param {function()} loadedCallback This function will be called when the game
   *     finishes loading or is already loaded and about to actually run.
   * @export
   */
  run(loadedCallback) {
    console.log('run')
    // If the game is already running, return immediately.
    if (this.isRunning_) {
      loadedCallback();
      return;
    }

    // Start loading if game not loaded yet.
    this.loadedCallback_ = loadedCallback;
    if (!this.isLoaded_) {
      this.loader_.load();
      return;
    }

    // Start running.
    this.start_();
  };


  /**
   * Stops the game.
   * @export
   */
  stop() {
    if (this.loadedCallback_ || !this.isRunning_) {
      this.loadedCallback_ = null;
      return;
    }

    this.audioManager_.pauseBackgroundMusic();

    this.isRunning_ = false;
    const view = document.getElementById('view');
    view.removeChild(this.renderer_.view);

    this.gameManager_.removeEventListener(
      EventType.PLAYER_QUIT,
      this.boundPlayerQuitCallback_);
    this.gameManager_.removeEventListener(
      EventType.PLAYER_DROPPED,
      this.boundPlayerQuitCallback_);
  };


  /**
   * Adds the renderer and run the game. Calls loaded callback passed to #run.
   * @private
   */
  start_() {
    console.log('start_')
    // If callback is null, the game was stopped already.
    if (!this.loadedCallback_) {
      return;
    }

    this.audioManager_.playBackgroundMusic();

    this.isRunning_ = true;
    this.gameManager_.updateGameplayState(
      GameplayState.RUNNING, null);

    requestAnimationFrame(this.update_.bind(this));

    this.loadedCallback_();
    this.loadedCallback_ = null;

    this.gameManager_.addEventListener(
      EventType.GAME_MESSAGE_RECEIVED,
      this.boundGameMessageReceivedCallback_);
    this.gameManager_.addEventListener(
      EventType.PLAYER_QUIT,
      this.boundPlayerQuitCallback_);
    this.gameManager_.addEventListener(
      EventType.PLAYER_DROPPED,
      this.boundPlayerQuitCallback_);

    // Display the title for a few seconds
    console.log('start_ timeout starting')
    setTimeout((() => {
      console.log('start_ timeout ended')
      const view = document.getElementById('view');
      view.removeChild(this.loadingImageElement_);
      this.renderer_.view.style.position = 'absolute';
      this.renderer_.view.style.left = '0';
      this.renderer_.view.style.top = '0';
      view.appendChild(this.renderer_.view)

      this.stateMachine_.goToState(
        GameStateId.WAITING_FOR_PLAYERS);
    }).bind(this), 5000);
  };


  /**
   * Updates the game on each animation frame.
   * @param {number} timestamp
   * @private
   */
  update_(timestamp) {
    if (!this.isRunning_) {
      return;
    }
    this.stats_.begin();

    requestAnimationFrame(this.update_.bind(this));

    let deltaTime = this.lastTime_ ? timestamp - this.lastTime_ : 0;
    // Clamp deltaTime between 10-20 fps to reduce jitter.
    if (deltaTime > 100) {
      deltaTime = 100;
    } else if (deltaTime < 50) {
      deltaTime = 50;
    }
    this.lastTime_ = timestamp;

    this.stateMachine_.update();

    // If the game is paused, do not update any game objects and timed actions.
    // Just render the stage as-is.
    if (this.gameManager_.getGameplayState() ==
      GameplayState.PAUSED) {
      this.renderer_.render(this.container_);
      return;
    }

    this.actionManager_.update();

    this.gameManager_.getPlayersInState(PlayerState.PLAYING,
      this.playingPlayers_);
    for (let i = 0; i < this.playingPlayers_.length; i++) {
      let player = this.playerMap_[this.playingPlayers_[i].playerId];
      if (player && player.active) {
        player.update(deltaTime);
      }
    }

    if (this.currentExplosion_ && this.currentExplosion_.active) {
      this.currentExplosion_.update(deltaTime);
    }

    if (this.currentAttackSpell_ && this.currentAttackSpell_.active) {
      this.currentAttackSpell_.update(deltaTime);
    }

    if (this.partyHealthDisplay_ && this.partyHealthDisplay_.active) {
      this.partyHealthDisplay_.update(deltaTime);
    }

    if (this.enemy_) {
      this.enemy_.update(deltaTime);
    }

    if (this.enemyHealthDisplay_ && this.enemyHealthDisplay_.active) {
      this.enemyHealthDisplay_.update(deltaTime);
    }

    if (this.countdownPlayerActionDisplay_ &&
      this.countdownPlayerActionDisplay_.active) {
      this.countdownPlayerActionDisplay_.update(deltaTime);
    }

    if (this.waitingPlayerActionDisplay_ &&
      this.waitingPlayerActionDisplay_.active) {
      this.waitingPlayerActionDisplay_.update(deltaTime);
    }
    this.renderer_.render(this.container_);
    this.stats_.end();
  };


  /**
   * Called when all assets are loaded.
   * @private
   */
  onAssetsLoaded_() {
    console.log('assets loaded');
    this.isLoaded_ = true;
    this.audioManager_.loadAllAudio();

    // Set up sprites shown over players casting spells.
    this.playerHealCastingSprite_ =
      PIXI.Sprite.fromImage('assets/heal.png');
    this.playerShieldCastingSprite_ =
      PIXI.Sprite.fromImage('assets/shield.png');

    // Set up game objects from furthest in background to furthest in foreground.

    // Displays battlefield background.
    this.battlefieldDisplay_ =
      new FullScreenDisplay(
        'assets/background.jpg', 1.0);

    // Displays lobby screen.
    this.lobbyDisplay_ =
      new FullScreenDisplay(
        'assets/background.jpg', 1.0, 'assets/lobby_text.png');

    // Displays player victory screen.
    this.playerVictoryDisplay_ =
      new FullScreenDisplay(
        'assets/background.jpg', 1.3, 'assets/win_text.png',
        new PIXI.Rectangle(0, 0, 718, 219));

    // Displays enemy victory screen.
    this.enemyVictoryDisplay_ =
      new FullScreenDisplay(
        'assets/background.jpg', 0.5, 'assets/lose_text.png',
        new PIXI.Rectangle(0, 0, 837, 220));

    // Displays the instructions screen.
    this.instructionsDisplay_ =
      new FullScreenDisplay(
        'assets/background.jpg', 1.0, 'assets/instructions_text.png');

    // Set up pool of players. Assumes MAX_PLAYERS is <= PLAYER_ASSETS_ length.
    if (this.PLAYER_ASSETS_.length <
      GameConstants.MAX_PLAYERS) {
      throw new Error('Not enough player assets available!');
    }
    for (let i = 0; i < GameConstants.MAX_PLAYERS; i++) {
      this.playerTextures_.push(PIXI.Texture.fromImage(this.PLAYER_ASSETS_[i]));
      let player = new Player(
        this.PLAYER_LOBBY_POSITIONS_[i], this.PLAYER_BATTLE_POSITIONS_[i],
        new PIXI.Sprite(this.playerTextures_[i]),
        this.container_, this.canvasWidth_, this.canvasHeight_);
      this.playerPool_.push(player);
    }

    // Set up enemies.
    this.enemy_ = new ElementalEnemy(
      this.container_, this.canvasWidth_, this.canvasHeight_);

    // Explosion and attack spell should be on top of players and enemies.
    this.explosions_[SpellElement.AIR] =
      new Explosion('air_explosion', 12,
        this.container_, this.canvasWidth_, this.canvasHeight_,
        this.audioManager_);
    this.explosions_[SpellElement.EARTH] =
      new Explosion('earth_explosion', 12,
        this.container_, this.canvasWidth_, this.canvasHeight_,
        this.audioManager_);
    this.explosions_[SpellElement.FIRE] =
      new Explosion('fire_explosion', 12,
        this.container_, this.canvasWidth_, this.canvasHeight_,
        this.audioManager_);
    this.explosions_[SpellElement.WATER] =
      new Explosion('water_explosion', 12,
        this.container_, this.canvasWidth_, this.canvasHeight_,
        this.audioManager_);

    this.attackSpells_[SpellElement.AIR] =
      new AttackSpell('air_attack', 11,
        this.container_, this.canvasWidth_, this.canvasHeight_);
    this.attackSpells_[SpellElement.EARTH] =
      new AttackSpell('earth_attack', 11,
        this.container_, this.canvasWidth_, this.canvasHeight_);
    this.attackSpells_[SpellElement.FIRE] =
      new AttackSpell('fire_attack', 11,
        this.container_, this.canvasWidth_, this.canvasHeight_);
    this.attackSpells_[SpellElement.WATER] =
      new AttackSpell('water_attack', 11,
        this.container_, this.canvasWidth_, this.canvasHeight_);

    // These displays should be on top of everything.
    this.partyHealthDisplay_ = new HealthDisplay(
      this.container_, this.canvasWidth_, this.canvasHeight_);

    this.enemyHealthDisplay_ = new HealthDisplay(
      this.container_, this.canvasWidth_, this.canvasHeight_);

    this.waitingPlayerActionDisplay_ =
      new TextDisplay();
    this.countdownPlayerActionDisplay_ =
      new LargeTextDisplay();

    // Displays the paused screen on top of everything.
    this.pausedDisplay_ =
      new FullScreenDisplay(
        'assets/background.jpg', 0.5, 'assets/paused_text.png');

    this.start_();
  };

  /** @return {!AudioManager} The audio manager. */
  getAudioManager() {
    return this.audioManager_;
  };

  /**
   * @return {!GameManager} The game manager.
   */
  getGameManager() {
    return this.gameManager_;
  };


  /**
   * @return {HealthDisplay} The party health
   *     display.
   */
  getPartyHealthDisplay() {
    return this.partyHealthDisplay_;
  };


  /**
   * @return {HealthDisplay} The enemy health
   *     display.
   */
  getEnemyHealthDisplay() {
    return this.enemyHealthDisplay_;
  };


  /**
   * @return {LargeTextDisplay} The countdown
   *     display.
   */
  getCountdownPlayerActionDisplay() {
    return this.countdownPlayerActionDisplay_;
  };


  /**
   * @return {TextDisplay} The waiting for player
   *     action display.
   */
  getWaitingPlayerActionDisplay() {
    return this.waitingPlayerActionDisplay_;
  };


  /**
   * @return {FullScreenDisplay} The lobby
   *     display.
   */
  getLobbyDisplay() {
    return this.lobbyDisplay_;
  };


  /**
   * @return {FullScreenDisplay} Player victory
   *     display.
   */
  getPlayerVictoryDisplay() {
    return this.playerVictoryDisplay_;
  };


  /**
   * @return {FullScreenDisplay} Enemy victory
   *     display.
   */
  getEnemyVictoryDisplay() {
    return this.enemyVictoryDisplay_;
  };


  /**
   * @return {FullScreenDisplay} The instructions
   *     display.
   */
  getInstructionsDisplay() {
    return this.instructionsDisplay_;
  };


  /**
   * @return {FullScreenDisplay} The paused
   *     display.
   */
  getPausedDisplay() {
    return this.pausedDisplay_;
  };


  /**
   * @return {FullScreenDisplay} The battlefield
   *     display.
   */
  getBattlefieldDisplay() {
    return this.battlefieldDisplay_;
  };


  /** @return {!PIXI.Point} Returns top left corner position. */
  getTopLeftPosition() {
    return this.topLeftPosition_;
  };


  /** @return {Enemy} The current enemy. */
  getEnemy() {
    return this.enemy_;
  };


  /**
   * Sets the current attack spell to the specified spell element. Deactivates any
   * previous attack spell.
   * @param {SpellElement} spellElement
   * @return {!AttackSpell} The current attack
   *     spell.
   */
  setCurrentAttackSpellElement(spellElement) {
    let newAttackSpell = this.attackSpells_[spellElement];
    if (!newAttackSpell) {
      throw Error('No attack spell found for element ' + spellElement);
    }

    if (newAttackSpell == this.currentAttackSpell_) {
      return this.currentAttackSpell_;
    }

    if (this.currentAttackSpell_) {
      this.currentAttackSpell_.deactivate();
    }
    this.currentAttackSpell_ = newAttackSpell;
    return this.currentAttackSpell_;
  };


  /**
   * @return {AttackSpell} The current attack
   *     spell.
   */
  getCurrentAttackSpell() {
    return this.currentAttackSpell_;
  };


  /**
   * Sets the current explosion to the specified spell element. Deactivates any
   * previous explosion.
   * @param {SpellElement} spellElement
   * @return {!Explosion} The current explosion.
   */
  setCurrentExplosionSpellElement(spellElement) {
    let newExplosion = this.explosions_[spellElement];
    if (!newExplosion) {
      throw Error('No explosion found for element ' + spellElement);
    }

    if (newExplosion == this.currentExplosion_) {
      return this.currentExplosion_;
    }

    if (this.currentExplosion_) {
      this.currentExplosion_.deactivate();
    }
    this.currentExplosion_ = newExplosion;
    return this.currentExplosion_;
  };


  /** @return {PIXI.Sprite} The sprite from player casting heal. */
  getPlayerHealCastingSprite() {
    return this.playerHealCastingSprite_;
  };


  /** @return {PIXI.Sprite} The sprite from player casting shield. */
  getPlayerShieldCastingSprite() {
    return this.playerShieldCastingSprite_;
  };


  /**
   * Returns a spellcast player.
   * @param {string} playerId The player ID of the spellcast player object.
   * @return {!Player} The spellcast player.
   */
  getPlayer(playerId) {
    let player = this.playerMap_[playerId];
    if (!player) {
      throw Error('Unknown player with id: ' + playerId);
    }
    return player;
  };


  /**
   * Removes a spellcast player.
   * @param {string} playerId The player ID of the spellcast player object.
   * @private
   */
  removePlayer_(playerId) {
    let player = this.getPlayer(playerId);
    delete this.playerMap_[playerId];
    player.deactivate();
    this.playerPool_.push(player);
  };


  /**
   * Creates a new spellcast player object.
   * @param {string} playerId The player ID.
   * @param {string} name The name to show on the player.
   * @param {number} avatarAssetIndex Avatar index for the player, starts from 0.
   * @return {Player}
   */
  createPlayer(playerId, name, avatarAssetIndex) {
    console.log('createPlayer: ' + avatarAssetIndex);
    if (this.playerPool_.length <= 0) {
      console.error('Cannot create a new player, ran out of sprites.');
      return null;
    }

    let existingPlayer = this.playerMap_[playerId];
    if (existingPlayer) {
      existingPlayer.sprite.alpha = 1.0;
      existingPlayer.sprite.texture = this.playerTextures_[avatarAssetIndex];
      return existingPlayer;
    }

    let newPlayer = this.playerPool_.shift();
    if (avatarAssetIndex < 0 || avatarAssetIndex >= this.playerTextures_.length) {
      console.error('Invalid avatarIndex : ' + avatarAssetIndex);
      avatarAssetIndex = 0;
    }
    newPlayer.sprite.alpha = 1.0;
    newPlayer.sprite.texture = this.playerTextures_[avatarAssetIndex];

    newPlayer.setPlayerIdAndName(playerId, name);
    this.playerMap_[playerId] = newPlayer;
    return newPlayer;
  };


  /**
   * Selects a random element for the enemy and update the enemy.
   * @return {!SpellElement} The enemy's element.
   */
  selectEnemyElement() {
    this.enemyElement_ = this.getRandomElement();
    this.enemy_.activate(this.enemy_.getIdleAnimation(this.enemyElement_));
    return this.enemyElement_;
  };


  /**
   * @return {!SpellElement} The enemy's currently
   *     selected element.
   */
  getEnemyElement() {
    return this.enemyElement_;
  };


  /**
   * Selects a random player bonus element for each player and notify each player.
   */
  assignBonusesAndNotifyPlayers() {
    this.gameManager_.getPlayersInState(PlayerState.PLAYING,
      this.playingPlayers_);
    let keys = Object.keys(this.playerBonus_);
    for (let i = 0; i < keys.length; i++) {
      delete this.playerBonus_[keys[i]];
    }
    for (let i = 0; i < this.playingPlayers_.length; i++) {
      let playerId = this.playingPlayers_[i].playerId;
      let playerBonus = this.getRandomPlayerBonus();
      this.playerBonus_[playerId] = playerBonus;
      this.playerMessage_.playerBonus = playerBonus;
      this.playerMessage_.castSpellsDurationMillis =
        GameConstants.
      DIFFICULTY_ACTION_PHASE_DURATION_MAP.get(this.gameDifficulty_);
      this.gameManager_.sendGameMessageToPlayer(playerId, this.playerMessage_);
    }
  };


  /**
   * Return the player bonus for a given player ID for this round.
   * @param {string} playerId
   * @return {!PlayerBonus}
   */
  getPlayerBonus(playerId) {
    return this.playerBonus_[playerId];
  };


  /**
   * Initializes the game world for a new encounter.
   */
  setupWorld() {
    this.battlefieldDisplay_.activate(this.topLeftPosition_);

    this.gameManager_.getPlayersInState(PlayerState.PLAYING,
      this.playingPlayers_);

    // Place health displays above background and enemy.
    this.partyMaxHealth_ = GameConstants.
    PARTY_INITIAL_HEALTH_MAP[this.playingPlayers_.length];
    this.partyHealthDisplay_.deactivate();
    this.partyHealthDisplay_.activate(this.partyHealthDisplayPos_);
    this.partyHealthDisplay_.configure(this.partyMaxHealth_);
    this.setPartyHealth(this.partyMaxHealth_);

    this.enemyMaxHealth_ = GameConstants.
    ENEMY_INITIAL_HEALTH_MAP[this.playingPlayers_.length];
    this.enemyHealthDisplay_.deactivate();
    this.enemyHealthDisplay_.activate(this.enemyHealthDisplayPos_);
    this.enemyHealthDisplay_.configure(this.enemyMaxHealth_);
    this.setEnemyHealth(this.enemyMaxHealth_);
  };


  /** Increments the number of shield spells cast this round. */

  addNumberOfShieldSpellsCastThisRound() {
    this.numberOfShieldSpellsCastThisRound_++;
  };


  /** @return {number} The number of shield spells cast this round. */

  getNumberOfShieldSpellsCastThisRound() {
    return this.numberOfShieldSpellsCastThisRound_;
  };


  /** Resets the number of shield spells cast this round. */

  resetNumberOfShieldSpellsCastThisRound() {
    this.numberOfShieldSpellsCastThisRound_ = 0;
  };


  /**
   * Enable shields for all players.
   * @param {number} value The number of hitpoints absorbed by this shield.
   * @param {number} alpha Alpha applied to all player shield sprites.
   * @param {number} tint Tint applied to all player shield sprites.
   */
  enablePartyShield(value,
    alpha, tint) {

    if (value < 1) {
      throw Error('Tried to set shield with invalid value: ' + value + '.');
    }

    if (value == this.partyShieldValue_) {
      return;
    }

    this.gameManager_.getPlayersInState(PlayerState.PLAYING,
      this.playingPlayers_);
    for (let i = 0; i < this.playingPlayers_.length; i++) {
      let player = this.playerMap_[this.playingPlayers_[i].playerId];
      player.enableShield(alpha, tint);
    }
    this.partyShieldValue_ = value;
  };


  /** @return {number} The current party shield value. */
  getPartyShieldValue() {
    return this.partyShieldValue_;
  };


  /**
   * Disable shields for all players.
   */
  disablePartyShield() {
    if (this.partyShieldValue_ == 0) {
      return;
    }

    this.gameManager_.getPlayersInState(PlayerState.PLAYING,
      this.playingPlayers_);
    for (let i = 0; i < this.playingPlayers_.length; i++) {
      let player = this.playerMap_[this.playingPlayers_[i].playerId];
      player.disableShield();
    }
    this.partyShieldValue_ = 0;
  };


  /**
   * Enable heals for all players.
   * @param {number} scale X and Y scaling applied on all player heal sprites.
   */
  enableHeal(scale) {
    this.gameManager_.getPlayersInState(PlayerState.PLAYING,
      this.playingPlayers_);
    for (let i = 0; i < this.playingPlayers_.length; i++) {
      let player = this.playerMap_[this.playingPlayers_[i].playerId];
      player.enableHeal(scale);
    }
  };


  /**
   * Disable heals for all players.
   */
  disableHeal() {
    this.gameManager_.getPlayersInState(PlayerState.PLAYING,
      this.playingPlayers_);
    for (let i = 0; i < this.playingPlayers_.length; i++) {
      let player = this.playerMap_[this.playingPlayers_[i].playerId];
      player.disableHeal();
    }
  };


  /**
   * Returns the current health value for the player party.
   * @return {number} The health value.
   */
  getPartyHealth() {
    return this.partyHealth_;
  };


  /**
   * Sets the current health value for the player party, making sure it stays
   * between 0 and partyMaxHealth_.
   * @param {number} value The new health value.
   * @return {number} The new health value.
   */
  setPartyHealth(value) {
    this.partyHealth_ = value;
    if (this.partyHealth_ > this.partyMaxHealth_) {
      this.partyHealth_ = this.partyMaxHealth_;
    }
    if (this.partyHealth_ < 0) {
      this.partyHealth_ = 0;
    }

    this.partyHealthDisplay_.updateHealth(this.partyHealth_);
    return this.partyHealth_;
  };


  /**
   * Updates the current health value for the player party, making sure it stays
   * between 0 and #partyMaxHealth_.
   * @param {number} delta The delta to be applied to the current value.
   * @return {number} The new health value.
   */
  updatePartyHealth(delta) {
    return this.setPartyHealth(this.partyHealth_ + delta);
  };


  /**
   * Returns the current health value for the enemy.
   * @return {number} The health value.
   */
  getEnemyHealth() {
    return this.enemyHealth_;
  };


  /**
   * Sets the current health value for the enemy, making sure it stays
   * between 0 and #enemyMaxHealth_.
   * @param {number} value he new health value.
   * @return {number} The new health value.
   */
  setEnemyHealth(value) {
    this.enemyHealth_ = value;
    if (this.enemyHealth_ > this.enemyMaxHealth_) {
      this.enemyHealth_ = this.enemyMaxHealth_;
    }
    if (this.enemyHealth_ < 0) {
      this.enemyHealth_ = 0;
    }

    this.enemyHealthDisplay_.updateHealth(this.enemyHealth_);
    return this.enemyHealth_;
  };


  /**
   * Updates the current health value for the enemy, making sure it stays
   * between 0 and #enemyMaxHealth_.
   * @param {number} delta The delta to be applied to the current value.
   * @return {number} The new health value.
   */
  updateEnemyHealth(delta) {
    return this.setEnemyHealth(this.enemyHealth_ + delta);
  };


  /**
   * Removes all players from the game by forcing them to quit state.
   */
  removeAllPlayers() {
    let playerIds = Object.keys(this.playerMap_);

    // Turn off effects affecting all players.
    this.disableHeal();
    this.disablePartyShield();

    for (let i = 0; i < playerIds.length; i++) {
      this.removePlayer_(playerIds[i]);
    }
  };


  /**
   * Removes enemy from the game.
   */
  removeEnemy() {
    if (this.enemy_) {
      this.enemy_.deactivate();
    }
  };


  /**
   * Updates the game data persisted by the running game and broadcasts the
   * current status of the game to all players. Called by the state machine when
   * the current game state changes (e.g. from waiting for players screen to
   * player action phase screen).
   * @param {GameStateId} gameStateId
   */
  broadcastGameStatus(gameStateId) {
    this.gameData_.gameStateId = gameStateId;

    this.gameManager_.updateGameData(this.gameData_);
    this.gameManager_.broadcastGameManagerStatus( /* exceptSenderId */ null);
  };


  /**
   * Sets the game difficulty.
   * @param {DifficultySetting} difficultySetting
   */
  setDifficultySetting(difficultySetting) {
    this.gameDifficulty_ = difficultySetting;
  };


  /**
   * Return a random element.
   * @return {!SpellElement}
   */
  getRandomElement() {
    let randomElement = Math.floor(Math.random() *
      GameConstants.RANDOM_ELEMENTS.length);
    return GameConstants.RANDOM_ELEMENTS[randomElement];
  };


  /**
   * Return a random player bonus.
   * @return {!PlayerBonus}
   */
  getRandomPlayerBonus() {
    let i = Math.floor(Math.random() *
      GameConstants.RANDOM_PLAYER_BONUS.length);
    return GameConstants.RANDOM_PLAYER_BONUS[i];
  };


  /**
   * Fired when a player quits from the game.
   * @param {Event} event
   * @private
   */
  onPlayerQuit_(event) {
    // Tear down the game if there are no more players. Might want to show a nice
    // UI with a countdown instead of tearing down instantly.
    let connectedPlayers = this.gameManager_.getConnectedPlayers();
    if (connectedPlayers.length == 0) {
      console.log('No more players connected. Tearing down game.');
      cast.receiver.CastReceiverManager.getInstance().stop();
      return;
    }

    if (event.statusCode != StatusCode.SUCCESS) {
      console.log('Error: Event status code: ' + event.statusCode);
      console.log('Reason for error: ' + event.errorDescription);
      return;
    }

    let playerId = event.playerInfo.playerId;
    let player = this.playerMap_[playerId];
    if (!player) {
      return;
    }
    this.removePlayer_(playerId);
  };


  /**
   * Fired when a game message is received. This callback is only used for
   * toggling the debug UI from a game message from the game debugger sender.
   * @param {Event} event
   * @private
   */
  onGameMessageReceived_(event) {
    if (!event.requestExtraMessageData ||
      !event.requestExtraMessageData.hasOwnProperty('debug')) {
      return;
    }
  };


  /**
   * Creates a random spell for testing purposes.
   * @return {!Spell}
   * @export
   */
  createRandomTestSpell() {
    console.log('createRandomTestSpell');
    let spell = new Spell();
    let r = Math.random();
    if (r < 0.50) {
      spell.spellType = SpellType.BASIC_ATTACK;
      console.log('BASIC_ATTACK')
    } else if (r < 0.80) {
      spell.spellType = SpellType.HEAL;
      console.log('HEAL')
    } else {
      spell.spellType = SpellType.SHIELD;
      console.log('SHIELD')
    }

    r = Math.random();
    if (r < 0.25) {
      spell.spellElement = SpellElement.FIRE;
      console.log('FIRE')
    } else if (r < 0.50) {
      spell.spellElement = SpellElement.AIR;
      console.log('AIR')
    } else if (r < 0.75) {
      spell.spellElement = SpellElement.EARTH;
      console.log('EARTH')
    } else {
      spell.spellElement = SpellElement.WATER;
      console.log('WATER')
    }

    r = Math.random();
    if (r < 0.33) {
      spell.spellAccuracy = SpellAccuracy.GOOD;
      console.log('GOOD')
    } else if (r < 0.66) {
      spell.spellAccuracy = SpellAccuracy.GREAT;
      console.log('GREAT')
    } else {
      spell.spellAccuracy = SpellAccuracy.PERFECT;
      console.log('PERFECT')
    }

    return spell;
  };


  /**
   * Creates a random spell message for testing purposes.
   * @return {!SpellMessage}
   * @export
   */
  createRandomTestSpellMessage() {
    console.log('createRandomTestSpellMessage');
    let spellMessage = new SpellMessage();
    let length = Math.random() * 5;
    for (let i = 0; i < length; i++) {
      spellMessage.spells.push(this.createRandomTestSpell());
    }
    return spellMessage;
  };


  /**
   * Creates test player ready data for testing purposes.
   * @return {!PlayerReadyData}
   * @export
   */
  createTestPlayerReadyData() {
    console.log('createTestPlayerReadyData');
    let playerReadyData = new PlayerReadyData();
    let avatarIndex = this.gameManager_.getPlayers().length;
    playerReadyData.avatarIndex = avatarIndex;
    if (GameConstants.MAX_PLAYERS === 1) {
      playerReadyData.playerName = 'Wizard';
    } else {
      playerReadyData.playerName = GameConstants.WIZARD_NAMES[avatarIndex];
    }
    return playerReadyData;
  };

  /**
   * Sends a test player ready message to create a new test player or a re-used
   * available player, simulating what happens when this message arrives from a
   * client.
   * @export
   */
  testCreatePlayer() {
    console.log('testCreatePlayer');
    let playerReadyData = this.createTestPlayerReadyData();
    let availablePlayers = this.gameManager_.getPlayersInState(
      PlayerState.AVAILABLE);
    let newPlayerId = null;
    if (availablePlayers.length > 0 &&
      !this.gameManager_.getSenderIdWithPlayerId(
        availablePlayers[0].playerId)) {
      newPlayerId = availablePlayers[0].playerId;
    } else {
      let result = this.gameManager_.updatePlayerState( /* playerId */ null,
        PlayerState.AVAILABLE, /* extraMessageData */ null);
      newPlayerId = result.playerId;
    }
    this.gameManager_.updatePlayerState(newPlayerId,
      PlayerState.READY, playerReadyData);
  };


  /**
   * Send random actions for all players for testing purposes, simulating what
   * happens when this message arrives from a client.
   * @export
   */
  testCreatePlayerActions() {
    console.log('testCreatePlayerActions: ' + this.counter_);
    if (this.counter_++ > 0) {
      interactiveCanvas.sendTextQuery('cast a spell');
    }
    return;
    let players = this.gameManager_.getPlayers();
    for (let i = 0; i < players.length; i++) {
      this.gameManager_.simulateGameMessageFromPlayer(
        players[i].playerId, this.createRandomTestSpellMessage());
    }
  };


  /**
   * Sends a player playing message for testing purposes, simulating what happens
   * when this message arrives from a client.
   * @export
   */
  testStartGame() {
    console.log('testStartGame');
    let playerPlayingData = new PlayerPlayingData();
    playerPlayingData.difficultySetting = DifficultySetting.EASY;
    let players = this.gameManager_.getPlayers();
    this.gameManager_.updatePlayerState(players[0].playerId,
      PlayerState.PLAYING, playerPlayingData);
  };


  /**
   * Quits a random player for testing purposes.
   * @export
   */
  testQuitPlayer() {
    console.log('testQuitPlayer');
    let players = this.gameManager_.getPlayers();
    let quitPlayerIndex = Math.floor(Math.random() * players.length);
    let quitPlayerId = players[quitPlayerIndex].playerId;
    this.gameManager_.updatePlayerState(quitPlayerId,
      PlayerState.QUIT, null);
  };


  /**
   * Sends a player idle message to test pausing and unpausing, simulating what
   * happens when this message arrives from a client.
   * @export
   */
  testPause() {
    console.log('testPause');
    let players = this.gameManager_.getPlayers();
    let pausePlayerIndex = Math.floor(Math.random() * players.length);
    let pausePlayerId = players[pausePlayerIndex].playerId;
    this.gameManager_.updatePlayerState(pausePlayerId,
      PlayerState.IDLE, null);

    setTimeout((() => {
      this.gameManager_.updatePlayerState(pausePlayerId,
        PlayerState.PLAYING, null);
    }).bind(this), 5000);
  };
}
export {
  SpellcastGame
}
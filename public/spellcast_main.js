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
'use strict';

import {
  GameManager
} from './game_manager.js';
import {
  SpellcastGame
} from './spellcast_game.js';
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
 * Main entry point.
 */
const initialize = () => {
  /** @suppress {missingRequire} */
  let gameManager = new GameManager('Spellcast');
  /** @suppress {missingRequire} */
  let game = new SpellcastGame(gameManager);

  const createSpell = (intent) => {
    console.log('createSpell');
    let spell = new Spell();
    spell.spellType = SpellType.BASIC_ATTACK;
    spell.spellElement = SpellElement.FIRE;

    let r = Math.random();
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

    switch (intent) {
      case 'heal':
        spell.spellType = SpellType.HEAL;
        break;
      case 'shield':
        spell.spellType = SpellType.SHIELD;
        break;
      case 'fire':
        spell.spellType = SpellType.BASIC_ATTACK;
        spell.spellElement = SpellElement.FIRE;
        break;
      case 'air':
        spell.spellType = SpellType.BASIC_ATTACK;
        spell.spellElement = SpellElement.AIR;
        break;
      case 'earth':
        spell.spellType = SpellType.BASIC_ATTACK;
        spell.spellElement = SpellElement.EARTH;
        break;
      case 'water':
        spell.spellType = SpellType.BASIC_ATTACK;
        spell.spellElement = SpellElement.WATER;
        break;
      default:
        r = Math.random();
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
        break;
    }

    return spell;
  };

  const createSpellMessage = (intent) => {
    console.log('createSpellMessage: ' + intent);
    let spellMessage = new SpellMessage();
    spellMessage.spells.push(createSpell(intent));
    return spellMessage;
  };

  // Adjust body for header height
  interactiveCanvas.getHeaderHeightPx().then((height) => {
    console.log('getHeaderHeightPx', height);
    document.body.style.paddingTop = height + "px";
    document.getElementById('view').style.paddingTop = height + "px";

    game.run(() => {
      console.log('Game running.');
    });
  });

  // Register Interactive Canvas callbacks
  const callbacks = {
    onUpdate(data) {
      console.log('onUpdate', JSON.stringify(data));
      let intent = data.sceneState;
      switch (data.sceneState) {
        case 'ELEMENT':
          intent = data.element;
          break;
        case 'NO INPUT':
          return;
        case 'SPELL':
          return;

        default:
          break;
      }
      let spellMessage = createSpellMessage(intent.toLowerCase());
      let players = gameManager.getPlayers();
      for (let i = 0; i < players.length; i++) {
        gameManager.simulateGameMessageFromPlayer(
          players[i].playerId, spellMessage);
      }
    },
    onTtsMark(name) {
      console.log('onTtsMark', name);
    }
  };
  interactiveCanvas.ready(callbacks);
};

if (document.readyState === 'complete') {
  initialize();
} else {
  /** Main entry point. */
  window.onload = initialize;
}
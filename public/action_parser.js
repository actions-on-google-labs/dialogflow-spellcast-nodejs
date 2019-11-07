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
  SpellType
} from './spellcast_messages.js';

/**
 * Parses a list of spells and returns a list of actions based on them.
 * @param {!ActionManager} actionManager Used to create a
 *     list of actions.
 * @param {!Player} caster The player who
 *     who casted this.
 * @param {!Enemy} enemy enemy The enemy of
 *     this encounter.
 * @param {!Array.<!Spell>} spells
 * @return {!Array.<!Action>} The list of actions,
 *     ready to be sent to the {@link ActionManager}.
 */
class ActionParser {

  constructor() {}

  static parse(actionManager, caster, enemy, spells) {
    // Allocate an empty action list.
    let actions = actionManager.getActionList();

    // Allocate actions and add them to the list of actions.
    for (let i = 0; i < spells.length; i++) {
      let spell = spells[i];
      switch (spell.spellType) {
        case SpellType.BASIC_ATTACK:
          actions.push(actionManager.getPlayerBasicAttackAction(caster, enemy, spell));
          break;
        case SpellType.HEAL:
          actions.push(actionManager.getPlayerHealAction(caster, spell));
          break;
        case SpellType.SHIELD:
          actions.push(actionManager.getPlayerShieldAction(caster, spell));
          break;
        default:
          throw Error('Error parsing action:' + spell);
      }
    }
    return actions;
  };
}

export {
  ActionParser
}
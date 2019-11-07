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

const functions = require('firebase-functions');
// Import the Dialogflow module from the Actions on Google client library.
// https://github.com/actions-on-google/actions-on-google-nodejs
const {dialogflow, HtmlResponse, SimpleResponse} = require('actions-on-google');

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

// Prompts used for responding to the user.
// Each prompt type can have multiple alternatives. A prompt is selected
// randomly to make the conversation more natural.
const prompts = {
  'quit': [
    'Hope to see you soon.',
    'Come back soon.',
    `Let's try this again later.`,
    'Hope to talk to you again soon.'
  ],
  'no_input1': [
    'Sorry, what was that?',
    `Sorry, I didn't hear that.`,
    `If you said something, I didn't hear it.`
  ],
  'no_input2': [
    `Sorry, I didn't catch that. Could you repeat yourself?`,
    `If you're still there, say that again.`
  ],
  'no_input3': [
    `Okay let's try this again later.`,
    'We can stop here. See you soon.'
  ],
  'fallback1': [
    `I didn't quite get that. What do you want to do?`,
    `I didn't understand that. What do you want to do?`
  ],
  'fallback2': [
    `Hmmm. Since I'm still having trouble, I'll stop here. Let's play again soon.`,
    `Since I'm still having trouble, I'll stop here. Try again in a few minutes.`,
    `Since I'm still having trouble, I'll stop here. Bye for now.`
  ],
  'spell': [
    'Your next spell?',
    `What's next?`,
	`What spell will you try now?`,
    `What's your next spell?`
  ]
};

// Instantiate the Dialogflow client with debug logging enabled.
const app = dialogflow({
  debug: true
});
// Do common tasks for each intent invocation
app.middleware((conv, framework) => {
  console.log(`Intent=${conv.intent}`);
  console.log(`Type=${conv.input.type}`);
  // Determine if the user input is by voice
  conv.voice = conv.input.type === 'VOICE';
  if (!(conv.intent === 'Default Fallback Intent' || conv.intent === 'No-input')) {
    // Reset the fallback counter for error handling
    conv.data.fallbackCount = 0;
  }
  conv.hasCanvas = conv.surface.capabilities.has('actions.capability.INTERACTIVE_CANVAS');
  console.log('hasCanvas='+conv.hasCanvas);
});

// Utility to get a random item from an array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * (array.length))];
};

// Utility to get a random prompt without sequential repeats
const getRandomPrompt = (conv, prompt) => {
  let availablePrompts = prompts[prompt];
  // Select a new prompt by avoiding prompts used previously in the session
  if (conv.data.prompts) {
    if (typeof (conv.data.prompts[prompt]) !== 'undefined') {
      availablePrompts = availablePrompts.filter(word => word !== conv.data.prompts[prompt]);
    }
  } else {
    conv.data.prompts = {};
  }
  // Persist selected prompt in session storage
  if (availablePrompts.length > 0) {
    conv.data.prompts[prompt] = getRandomItem(availablePrompts);
  } else {
    conv.data.prompts[prompt] = prompts[prompt][0];
  }
  return conv.data.prompts[prompt];
};

app.intent('Default Welcome Intent', (conv) => {
  if (conv.hasCanvas) {
        conv.ask(`<speak>Welcome to Spell Cast. In this game your wizards cast spells to defeat monsters.<break time="1" />To play the game, select the element opposite of the monster to damage it. Water versus fire, and earth versus air. Select a shield or heal to protect the wizards.<break time="2" />Get ready to cast a spell. What spell are you going to use?</speak>`);
        var d = new Date();
  		var t = d.getTime();
        conv.ask(new HtmlResponse({
    		url: `https://${firebaseConfig.projectId}.firebaseapp.com?${t}`,
            data: {
              sceneState: 'WELCOME',
              query: conv.query
            }
  		}));
      } else {
        conv.close(`Sorry, this device does not support Interactive Canvas!`);
      }
});

app.intent('Default Fallback Intent', (conv) => {  
  conv.ask(new HtmlResponse({
    	data: {
          sceneState: 'FALLBACK',
          query: conv.query
        }
  	}));
});

app.intent('Heal', (conv) => {
  conv.ask(new HtmlResponse({
    	state: {
          data: 'HEAL',
          query: conv.query
        }
  	}));
});

app.intent('Shield', (conv) => {  
  conv.ask(new HtmlResponse({
    	data: {
          sceneState: 'SHIELD',
          query: conv.query
        }
  	}));
});

app.intent('Element', (conv, {element}) => {  
  conv.ask(new HtmlResponse({
    	data: {
          sceneState: 'ELEMENT',
          element: element,
          query: conv.query
        }
  	}));
});

app.intent('No Input', (conv) => {
  conv.ask(new HtmlResponse({
    	data: {
          sceneState: 'NO INPUT',
          query: conv.query
        }
  	}));
});

app.intent('Spell', (conv) => {  
  conv.ask(getRandomPrompt(conv, 'spell'));
    conv.ask(new HtmlResponse({
    	data: {
          sceneState: 'SPELL',
          query: conv.query
        }
  	}));
});

app.intent('Cancel', (conv) => {  
  conv.close(getRandomPrompt(conv, 'quit'));
});

// Cloud Functions for Firebase handler for HTTPS POST requests.
// https://developers.google.com/actions/dialogflow/fulfillment#building_fulfillment_responses
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
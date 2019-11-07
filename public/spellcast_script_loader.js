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
 * Loads scripts in order and appends timestamp GET parameter to prevent the
 * browser from caching them. This is only meant for development builds, not
 * production.
 * @param {!Array.<string>} paths The paths to the js files to load.
 */

const loadScriptsNoCache = (paths) => {
  if (paths.length == 0) {
    return;
  }

  // Load the first path in the array, shift it, and call loadScriptsNoCache
  // again with the shifted path array when the script loads.
  let fileRef = document.createElement('script');
  if (paths.length === 1) {
    fileRef.setAttribute('type', 'module');
  } else {
    fileRef.setAttribute('type', 'text/javascript');
  }
  let path = paths.shift();
  console.log(`loading script ${path}`);
  fileRef.setAttribute('src', path + '?ts=' + Date.now());
  fileRef.onload = () => {
    loadScriptsNoCache(paths);
  };

  document.getElementsByTagName('head')[0].appendChild(fileRef);
}

loadScriptsNoCache([
  'log.js',
  'spellcast_main.js'
]);
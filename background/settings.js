// get all the checkboxes in the settings form
// I'm sure there's a better way to do this
const settingDefaults = {
  'enableAudio': true,
  'enableBubbles': true,
  'enableHints': true,
  'enableLinks': true,
  'enableModals': true,
  'enableToolTips': true,
  'enableVideos': true,
  'enableRefreshTimer': false,
}

/**
 * 
 * @param {string} key 
 * @param {string} value 
 * @param {Function} callback 
 */
export function saveSetting(key, value, callback) {
  
  chrome.storage.local.set({ [key]: value }, () => {
    if (chrome.runtime.lastError) {
      console.error('⚠️ Failed to save setting:', chrome.runtime.lastError);
      sendResponse({ success: false, error: chrome.runtime.lastError });
      return;
    }
    callback({ success: true });
  });
}
/**
 * Fetches the settings from chrome storage
 * @param {Function} callback 
 */
export function getOffers(callback) { // get products

  // if the storage is empty, set all the features in storage to defaults
  isStorageEmpty((err, isEmpty) => {
    if (err) {
      console.error('Failed checking storage for empty:', err);
      return;
    }

    // if the storage is empty, set all the features in storage to defaults
    if (isEmpty) {
      storeDefaultSettings((err) => {
        if (err) {
          console.error('Failed to set default settings:', err);
          return;
        }
      });
    }
  });

  // get settings from storage and return them via callback
  chrome.storage.local.get(null, (settings) => {
    callback(null, settings);
  });
}

/**
 * Fetches the settings from chrome storage
 * @param {Function} callback 
 */
export function getSettings(callback) {

  
  // if the storage is empty, set all the features in storage to defaults
  isStorageEmpty((err, isEmpty) => {
    if (err) {
      console.error('Failed checking storage for empty:', err);
      return;
    }

    // if the storage is empty, set all the features in storage to defaults
    if (isEmpty) {
      storeDefaultSettings((err) => {
        if (err) {
          console.error('Failed to set default settings:', err);
          return;
        }
      });
    }
  });

  // get settings from storage and return them via callback
  chrome.storage.local.get(null, (settings) => {
    callback(null, settings);
  });
}

/**
 * Checks if the storage has popup settings in it already
 * @param {Function} callback 
 */
function isStorageEmpty(callback) {

  let isEmpty = false;
  const keys = Object.keys(settingDefaults);

  // Create an array of promises
  const promises = keys.map((key) => {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (setting) => {
        if (setting[key] === undefined) {
          isEmpty = true;
        }
        resolve();
      });
    });
  });

  // Wait for all promises to complete
  Promise.all(promises).then(() => {
    callback(null, isEmpty);
  });
}

/**
 * Sets the default settings in chrome storage
 * @param {Function} callback 
 */
function storeDefaultSettings(callback) {
  // store the default settings in chrome storage
  chrome.storage.local.set(settingDefaults, () => {
    callback(null);
  });
}
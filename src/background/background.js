import { getSettings, saveSetting } from "./settings.js";
import { getAuthTokens } from "./authTokens.js";

chrome.storage.onChanged.addListener((changes, area) => {
  console.log('storage changed:', changes.products, area);
});

const configDataUrl = "https://raw.githubusercontent.com/dstarr/marketplace-extension-data/refs/heads/main/data/extension-data-v2.json";

/**
 * Load the configuration JSON data from a remote URL
 * @returns {Promise<Object>} - The configuration data
 */
function loadConfig(callback) {

  return fetch(configDataUrl)
    .then(response => response.json())
    .then(data => {
      callback(null, data);
      return;
    })
    .catch(error => {
      callback(error, null);
    });
}

/**
 * Listen for messages from the content or popup script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {


  switch (request.action) {

    case 'loadConfig':
      loadConfig((err, configData) => {
        if (err) {
          console.error('Background worker failed to load config:', err);
          sendResponse({ success: false, error: err });
          return;
        }
        sendResponse({ success: true, data: configData });
      });
      break;
    case 'refreshPopupData':
      chrome.storage.local.get('popupData', (data) => {
        console.debug('popupData', data);
        sendResponse({ success: true, data: data });
      });
      break;
    case 'getOfferData':
      chrome.storage.local.get('products', (products) => {
        console.debug('products', products);
        sendResponse({ success: true, data: products });
      });
      break;
    case 'clearOfferData':
      chrome.storage.local.remove('products', (products) => {
        console.debug('removed products', products);
        sendResponse({ success: true, data: products == undefined });
      });
      break;
    case 'saveOffer':
      break;
    case 'getSettings':
      getSettings((err, settings) => {

        if (err) {
          console.error('Failed to get settings:', err);
          sendResponse({ success: false, error: err });
          return;
        }

        sendResponse({ success: true, data: settings });
      });
      break;

    case 'saveSetting':
      saveSetting(request.key, request.value, (response) => {
        if (!response.success) {
          console.error('Failed to save setting:', response.error);
          sendResponse({ success: false, error: response.error });
          return;
        }

        sendResponse({ success: true });
      });
      break;
      
    case "openPopup":
      chrome.action.openPopup();
      break;

    case "showIcon":      
      chrome.action.enable(sender.tab.id); // Enable the action for the specific tab
      break;
 
    default:
      console.warn('Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
      break;
  }

  return true; // Indicate that the response will be sent asynchronously
});

// Fire an event when the url of a tab changes
chrome.tabs.onUpdated.addListener((tabs, changeInfo) => {

  console.debug('tab updated...')
  if (changeInfo.url) {
    console.debug("URL changed to: " + changeInfo.url);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs?.sendMessage(activeTab.id, { message: "Hello from background.js!" }, (response) => {
        console.debug("Response from content script:", response);
      });

    })
  };
});

/// Context Menu
// Create the root context menu item
chrome.runtime.onInstalled.addListener(() => {
  // Root item
  chrome.contextMenus.create({
    id: "marketplace",
    title: "Marketplace",
    contexts: ["all"]
  });

  // Child item: Copy
  chrome.contextMenus.create({
    id: "copy",
    parentId: "marketplace",
    title: "Copy",
    contexts: ["all"]
  });

  // Child item: Paste
  chrome.contextMenus.create({
    id: "paste",
    parentId: "marketplace",
    title: "Paste",
    contexts: ["all"]
  });
});

// Listener for context menu item clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copy") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: showDialog,
      args: ["Copy clicked"]
    });
  } else if (info.menuItemId === "paste") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: showDialog,
      args: ["Paste clicked"]
    });
  }
});

// Function to show a dialog box
function showDialog(message) {
  alert(message);
}
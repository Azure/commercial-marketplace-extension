import { getSettings, saveSetting } from "./settings.js";
import { getAuthTokens } from "./authTokens.js";
import { getPlanInfo,postPlanInfo } from "./plans.js";
import { getOfferInfo,postOfferInfo,IsItOffer } from "./offers.js";

let copyActionData;

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

    if (!isValidateUrl(tab.url)) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: showDialog,
        args: ["Copy functionality is only available on the Offer or Plan page."]});
      return;
    }
    else
    {

      copyActionInfo(tab.url);
    }

  } else if (info.menuItemId === "paste") {

     pasteActionInfo(tab.url);

  }
});


// Function to show a dialog box
async function showDialog(message) {
  alert(message);

}

// Function to copy the data
async function copyActionInfo(url)
{
  
  console.debug("Call Get Auth Tokens");
  try {
    const tokenData =  await getAuthTokens();
    console.debug(tokenData.msGraphToken);
      if(url.includes("plans"))
      {
        await copyPlanInfo(tokenData.msGraphToken,url);
        console.debug(copyActionData);    
      }
      else
      {
        await copyOfferInfo(tokenData.msGraphToken,url);
        console.debug(copyActionData);    
      }

  } catch (error) {
    console.error('Failed to get  info:', error);
    return error;
  }
};
  


// Function to get the plan data
async function copyPlanInfo(token,url)
{  
  console.debug("Start Copy Plan Information");
  try {
    copyActionData= await getPlanInfo(token,url);
  
  } catch (error) {
    console.error('Failed to get plan info:', error);
    return error;
  }
};
// Function to get the offer data
async function copyOfferInfo(token,url)
{
  
  console.debug("Start Copy Offer Information");
  try {
    
    copyActionData = await getOfferInfo(token,url);
    console.debug(copyActionData);    
  } catch (error) {
    console.error('Failed to get offer info:', error);
    return error;
  }
  

};


// Function to paste the copied data
async function pasteActionInfo(url)
{
  if(copyActionData==null)
  {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: showDialog,
      args: ["No data to paste. Please copy the plan data first."]});
    return;
  }
  else
  {
    if (await IsItOffer(copyActionData))
    {
      pasteOfferInfo(url,'','');
    }
    else
    {
      
      pastePlanInfo(url);
    }
    return;
  }
 
}

// Function to paste the plan data
async function pastePlanInfo(url)
{
  console.debug("Paste Plan Info");
    const tokenData =  await getAuthTokens();
    console.debug(tokenData);
    const msg= await postPlanInfo(url,copyActionData,tokenData.msGraphToken);
    console.debug(msg);
    return;
  
}

// Function to paste the offer data
async function pasteOfferInfo(url,offerName,offerId)
{
  console.debug("Paste Offer Info");
    const tokenData =  await getAuthTokens();
    const msg= await postOfferInfo(url,copyActionData,tokenData.msGraphToken,offerName,offerId);
    console.debug(msg);
    return;
  
}

// validate if the URL is valid for plan listing  
 function isValidateUrl(url) {
  // Regular expression to check for the words "offers", "plans", and "listings"
  var result=false;
  var regex = /offers\/([0-9a-fA-F-]{36})\/overview*/;
  var result= regex.test(url);
  if(!result)
  {
    regex = /offers.*plans\/([0-9a-fA-F-]{36})\/*/;
    // Test the URL against the regular expression
    return regex.test(url);

  }
  return result;
}

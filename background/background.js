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

  // Child item: Import
  chrome.contextMenus.create({
    id: "import",
    parentId: "marketplace",
    title: "Import",
    contexts: ["all"]
  });

  // Child item: Export
  chrome.contextMenus.create({
    id: "export",
    parentId: "marketplace",
    title: "Export",
    contexts: ["all"]
  });
  
});

// Listener for context menu item clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.debug("Context menu clicked:", info.menuItemId);
  console.debug("Current tab URL:", tab.url);
  
  if (info.menuItemId === "copy") {

    if (!isValidateUrl(tab.url)) {
      showToast("Copy functionality is only available on the Offer or Plan page.", "warning");
      return;
    }
    else
    {
      copyActionInfo(tab.url);
    }

  } else if (info.menuItemId === "export") {
    console.debug("Export menu item clicked");
    
    if (!isValidateUrl(tab.url)) {
      console.debug("URL validation failed for export");
      showToast("Export functionality is only available on the Offer or Plan page.", "warning");
      return;
    }
    else
    {
      console.debug("URL validation passed, calling exportActionInfo");
      exportActionInfo(tab.url);
    }

  } else if (info.menuItemId === "import") { // Call the import function directly

      importActionInfo(tab.url); 
      console.debug("Import menu item clicked");

  } else if (info.menuItemId === "paste") {  // Call the paste function directly

     pasteActionInfo(tab.url, tab);
      console.debug("Paste menu item clicked");

  }
});


// Function to show a dialog box
async function showDialog(message) {
  alert(message);
}

// Function to show a toast notification
async function showToast(message, type = 'success', duration = 3000) {
  // Escape the message to prevent issues with quotes
  const escapedMessage = message.replace(/'/g, "\\'").replace(/"/g, '\\"');
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (msg, toastType, dur) => {
          if (typeof window.showMarketplaceToast === 'function') {
            window.showMarketplaceToast(msg, toastType, dur);
          }
        },
        args: [escapedMessage, type, duration]
      });
    }
  });
}

// Function to copy the data
async function copyActionInfo(url)
{
  
  console.debug("Call Get Auth Tokens");
  try {
    // Show loading notification
    showToast("Copying information...", "info", 10000);
    
    const tokenData =  await getAuthTokens();
    console.debug(tokenData.msGraphToken);
      if(url.includes("plans"))
      {
        await copyPlanInfo(tokenData.msGraphToken,url);
        console.debug(copyActionData);
        showToast("Plan information copied successfully!", "success");
      }
      else
      {
        await copyOfferInfo(tokenData.msGraphToken,url);
        console.debug(copyActionData);
        showToast("Offer information copied successfully!", "success");
      }

  } catch (error) {
    console.error('Failed to get  info:', error);
    showToast("Failed to copy information. Please try again.", "error");
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
async function pasteActionInfo(url, tab)
{
  if(copyActionData==null)
  {
    showToast("No data to paste. Please copy the plan data first.", "warning");
    return;
  }
  else
  {
    try {
      // Show loading notification
      showToast("Pasting information...", "info", 10000);
      
      if (await IsItOffer(copyActionData))
      {
        await pasteOfferInfo(url,'','');
        showToast("Offer information pasted successfully!", "success");
      }
      else
      {
        await pastePlanInfo(url);
        showToast("Plan information pasted successfully!", "success");
      }
    } catch (error) {
      console.error('Failed to paste info:', error);
      showToast("Failed to paste information. Please try again.", "error");
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

// Function to export the data as a downloadable JSON file
async function exportActionInfo(url) {
  console.debug("Call Export Action Info");
  console.debug("Export URL:", url);
  
  try {
    // Show loading notification
    showToast("Exporting information...", "info", 10000);
    
    console.debug("Getting auth tokens...");
    const tokenData = await getAuthTokens();
    console.debug("Auth tokens received:", tokenData.msGraphToken ? "✓" : "✗");
    
    let exportData;
    if (url.includes("plans")) {
      console.debug("Exporting plan data...");
      exportData = await getPlanInfo(tokenData.msGraphToken, url);
      console.debug("Plan data received:", exportData ? "✓" : "✗");
      downloadJson(exportData, "plan_export.json");
      showToast("Plan information exported successfully!", "success");
    } else {
      console.debug("Exporting offer data...");
      exportData = await getOfferInfo(tokenData.msGraphToken, url);
      console.debug("Offer data received:", exportData ? "✓" : "✗");
      downloadJson(exportData, "offer_export.json");
      showToast("Offer information exported successfully!", "success");
    }

  } catch (error) {
    console.error('Failed to export info:', error);
    console.error('Error stack:', error.stack);
    showToast("Failed to export information. Please try again.", "error");
    return error;
  }
}

// Helper function to download JSON data as a file
function downloadJson(data, filename) {
  console.debug("downloadJson called with filename:", filename);
  
  if (!data) {
    console.error("No data provided for download");
    showToast("No data to export", "error");
    return;
  }
  
  try {
    // Convert data to JSON string
    const jsonString = JSON.stringify(data, null, 2);
    console.debug("JSON string created, length:", jsonString.length);
    
    // Inject script to handle blob creation and download in content script context
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        console.debug("Injecting download script into tab:", tabs[0].id);
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (jsonData, fileName) => {
            console.log("Download script executing with filename:", fileName);
            try {
              // Create a blob with the JSON data (this works in content script context)
              const blob = new Blob([jsonData], { type: 'application/json' });
              
              // Create a download URL
              const blobUrl = URL.createObjectURL(blob);
              console.log("Blob URL created:", blobUrl);
              
              // Create a temporary anchor element and trigger download
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = fileName;
              a.style.display = 'none';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              
              // Clean up the object URL
              setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
              console.log("Download triggered successfully");
            } catch (err) {
              console.error("Error in download script:", err);
            }
          },
          args: [jsonString, filename]
        }).then(() => {
          console.debug("Script injection successful");
        }).catch((err) => {
          console.error("Script injection failed:", err);
          showToast("Failed to trigger download", "error");
        });
      } else {
        console.error("No active tab found");
        showToast("No active tab found", "error");
      }
    });
  } catch (error) {
    console.error("Error in downloadJson:", error);
    showToast("Error creating download file", "error");
  }
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

// Function to import offer/plan data from a JSON file
async function importActionInfo(url) {
  console.debug("Call Import Action Info");
  console.debug("Import URL:", url);
  
  try {
    // Show loading notification
    showToast("Opening file selector...", "info", 5000);
    
    // Inject script to handle file selection and parsing in content script context
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        console.debug("Injecting file selection script into tab:", tabs[0].id);
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            return new Promise((resolve, reject) => {
              try {
                // Create a hidden file input element
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                fileInput.style.display = 'none';
                
                fileInput.onchange = (event) => {
                  const file = event.target.files[0];
                  if (!file) {
                    reject('No file selected');
                    return;
                  }
                  
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    try {
                      const jsonData = JSON.parse(e.target.result);
                      resolve(jsonData);
                    } catch (parseError) {
                      reject('Invalid JSON file: ' + parseError.message);
                    }
                  };
                  
                  reader.onerror = () => {
                    reject('Error reading file');
                  };
                  
                  reader.readAsText(file);
                };
                
                fileInput.oncancel = () => {
                  reject('File selection cancelled');
                };
                
                // Append to body, click, and remove
                document.body.appendChild(fileInput);
                fileInput.click();
                document.body.removeChild(fileInput);
              } catch (err) {
                reject('Error creating file selector: ' + err.message);
              }
            });
          }
        }).then(async (result) => {
          if (result && result[0] && result[0].result) {
            console.debug("File selected and parsed successfully");
            const importedData = result[0].result;
            
            // Validate the imported data structure
            if (!importedData || !importedData.resources) {
              showToast("Invalid import data structure. Expected an object with 'resources' property.", "error");
              return;
            }
            
            try {
              // Set the imported data to copyActionData and use the existing paste functionality
              copyActionData = importedData;
              console.debug("Imported data set to copyActionData, calling pasteActionInfo");
              
              // Use the existing paste functionality - this ensures 100% consistency
              await pasteActionInfo(url, { url: url });
              
            } catch (error) {
              console.error('Failed to import info:', error);
              showToast("Failed to import information. Please try again.", "error");
            }
          }
        }).catch((err) => {
          console.error("File selection failed:", err);
          if (err !== 'File selection cancelled') {
            showToast("File selection failed: " + err, "error");
          }
        });
      } else {
        console.error("No active tab found");
        showToast("No active tab found", "error");
      }
    });
  } catch (error) {
    console.error('Failed to import info:', error);
    console.error('Error stack:', error.stack);
    showToast("Failed to import information. Please try again.", "error");
    return error;
  }
}

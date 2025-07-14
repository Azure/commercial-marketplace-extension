/**
 * This script is injected into the browser page and is responsible for rendering the content based on the configuration data.
 */

// It import functions from features.js

const renderedObjects = [];  // store the rendered objects to be able to clear them later
/**
 *  sends the seller ID to the webhook for reporting of MBS.
 */
function postToWebhook(sellerId) {
  const webhookUrl = ''; // Replace with your actual webhook URL

  // Make a POST request
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: `{ "sellerId": ${sellerId} }`
  })
    .then(response => {
      // Check if the response has content
      if (response.ok) {
        // Try to parse the response as JSON only if there is content
        return response.text().then(text => {
          return text ? JSON.parse(text) : {}; // Return parsed JSON or an empty object if no content
        });
      } else {
        throw new Error('🕵️‍♀️Network response was not ok.');
      }
    })
    .then(data => {
      console.debug('🕵️‍♀️Success:', data);  // Handle the successful response
    })
    .catch((error) => {
      console.error('🕵️‍♀️Error:', error);  // Handle any errors
    });
}
/**
 *  Get the tokens for authenticating API and Graph resources
 */
async function getAuthTokens() {
  const result = fetch('https://partner.microsoft.com/en-us/api/user/AuthContext', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',

    },
  })
    .then(response => response.json())
    .catch(error => console.error('🕵️‍♀️Error:', error));

  const data = await result;
  return data;
}

/**
 * Get the seller ID from the page and send it to the webhook
 */
function getSellerId() {
  const DOM = document.documentElement.outerHTML;
  const DOM_lines = DOM.split('\n');
  const DOM_mathingLines = DOM_lines.find(line => line.includes("devCenterSellerAccountId"));
  const sellerId = DOM_mathingLines.split("'")[1];
  console.debug("🕵️‍♀️Seller ID: ", sellerId);
  // postToWebhook(sellerId); // Uncomment this line to post the seller ID to the webhook
}

/** 
 * this function is used to wait for the PC page to load as it still loading after marked as ready.
 **/
let sleep = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * loads the main code once the browser page is ready
 */
$(document).ready(async function () {
  getSellerId();
  showBanner();
  processPage(); // render the content
});

/**
 * Renders the engine based on the configuration data.
 */
function processPage() {
  sleep(6 * 1000).then(() => {

    chrome.runtime.sendMessage({ action: 'loadConfig' }, (response) => { // load the config json

      if (response.error) {
        console.error('🛑 Failed to load config JSON:', response.error);
        return;
      }

      config = response.data;

      console.debug("🔍 config", config);

      let filteredPages = config.page_content.filter(page => page.page_url === window.location.href); //filter all the items in the json that belongs to the current url

      // translate the current URL to a pattern that can be matched with the page_url in the config JSON
      if (filteredPages.length == 0) {
        const url = window.location.href;
        const guidPattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
        
        config.page_content.forEach(function (item) {
          if (item.page_url.includes("*")) {
            let modifiedUrl = url.replace(guidPattern, "*");
            if (modifiedUrl == item.page_url) {
              filteredPages.push(item);
            }
          }
        });
      }

      if (filteredPages.length > 1) {
        console.warn("⚠️ Multiple entries found for the current page");
        return;
      }

      if (filteredPages.length == 0) {
        console.debug("⚠️ Current page not found");
        return;
      }
      
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => { // send a message to the background script to end the loading

        if (response.error) {
          console.error('🛑 Failed to load settings:', response.error);
          return;
        }

        ClearPreviousRender();
        RenderEngine(filteredPages[0], response);
        return;

      });
    });
  });
}

/**
 * Clear the previous render objects
 */
function ClearPreviousRender() {
  console.debug(`🧼About to clear ${renderedObjects.length} from previous render...`);
  renderedObjects.forEach(element => {
    $(element).remove();
  });
}

/*
* Render the content based on the settings and the filtered content (the json content associated with the current page)
*/
async function RenderEngine(page, settings) {
  
  var pageOfferType = await getOfferType();
  console.debug("🔍 pageOfferType", pageOfferType);

  for (let content of page.content) {

    console.debug(`🔍 CONTENT ITEM:\ncontent selector: ${content.jquery_selector}\ncontent_type: ${content.content_type}\noffer_type: ${content.offer_type}`);

    // check if the offer type in the content matches the offer type of the extension
    // if it doesn't match, skip the content
    if (content.offer_type !== pageOfferType) {
      continue;
    }

    // check if the content is enabled in the settings
    // if it is enabled, render the content
    switch (content.content_type) {

      case "bubble": {
        if (settings.data['enableBubbles']) {
          renderBubble(content, renderedObjects);
        }
        break;
      }
      case "audio": {
        if (settings.data['enableAudio']) {
          renderAudio(content, renderedObjects);
        }
        break;
      }
      case "video": {
        if (settings.data['enableVideos']) {
          renderVideo(content, renderedObjects);
        }
        break;
      }
      case "hint": {
        if (settings.data['enableHints']) {
          renderHint(content, renderedObjects);
        }
        break;
      }
      case "link": {
        if (settings.data['enableLinks']) {
          renderLink(content, renderedObjects);
        }
        break;
      }
      case "modal": {
        if (settings.data['enableModals']) {
          renderModal(content, renderedObjects);
        }
        break;
      }
      case "tooltip": {
        if (settings.data['enableToolTips']) {
          renderToolTip(content, renderedObjects);
        }
        break;
      }
      default: {
        console.warn("Unknown content type:", content.content_type);
      }

    }
  }
}


/**
 *  Get the Offer Information for specific offer
 */

// Function to check if data is offer data
export async function IsItOffer(data)
{
  console.debug(data);
  if(data.hasOwnProperty("resources"))
  {
    console.debug("it is  Offer");
    return true;
  }
  else
  {
    console.debug("it is not Offer");
    return false;
  }
  
}
// Function to convert ArrayBuffer to hex string
function bufferToHex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

// Function to hash a long string using SHA-256
export async function hashStringToGUID(longString) {
  const encoder = new TextEncoder();
  const data = encoder.encode(longString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = bufferToHex(hashBuffer);

  // Convert the hash to a GUID-like format
  const guid = `${hashHex.slice(0, 8)}-${hashHex.slice(8, 12)}-${hashHex.slice(12, 16)}-${hashHex.slice(16, 20)}-${hashHex.slice(20, 32)}`;

  return guid;
}

// clean up body
 function removePrototype(key, value) {
    if (key === '__proto__' || key === 'constructor' ) {
      return undefined; // Exclude these properties
    }
    return value;
  }


  // extract offer GUID from URL
  export function extractOfferGuidFromUrl(url) {
    // Regular expression to match the GUID pattern
    const regex = /offers\/([0-9a-fA-F-]{36})\/*/;
    
    // Execute the regular expression on the URL
    const match = url.match(regex);
    
    // Return the matched GUID or null if no match is found
    return match ? match[1] : null;
  }
  // extract plan GUID from URL
  export function extractPlanGuidFromUrl(url) {
    // Regular expression to match the plan GUID pattern
    const regex = /plans\/([0-9a-fA-F-]{36})\/listings/;
    
    // Execute the regular expression on the URL
    const match = url.match(regex);
    
    // Return the matched plan GUID or null if no match is found
    return match ? match[1] : null;
  }

// make API call giving URL and token
export async function makeAPICall(token, url, retryUrl) {
  try {
    const response = await fetch(url,  {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Authorization': 'Bearer ' + token,
      },
    });

    // Check if the response status is 400
    if (response.status === 400 && retryUrl) {
      console.warn('Received 400 status, retrying with different URL...');
      const retryResponse = await fetch(retryUrl , {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Authorization': 'Bearer ' + token,
        },
      });

     
      
      if (retryResponse.status === 400 ) {
        console.warn('Received 400 status, retrying with different URL...');
        const retryResponse3 = await fetch(retryUrl.replace("&targetType=preview","") , {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Authorization': 'Bearer ' + token,
          },
        });
        const retryData3 = await retryResponse3.json();
        return retryData3;
      }
      // Parse the JSON response from the retry request
      const retryData = await retryResponse.json();
      return retryData;
    }
    

    // Parse the JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error; // Re-throw the error after logging it
  }
}

  
// make API call giving URL and token
export async function makePostAPICallWithBody(token, url, bodyData) {
  try {
    console.debug(token)
    console.debug(url)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Authorization': 'Bearer ' + token,
      },
      body: bodyData // Include the JSON body
    });

    // Parse the JSON response
    const data = await response.text();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error; // Re-throw the error after logging it
  }
}


// get offer info
export async function getOfferInfo(token, url) {
    const offerId = extractOfferGuidFromUrl(url);
    if (!offerId) {
        throw new Error('Invalid offer URL - could not extract offer ID');
    }
    
    const configUrl = `https://graph.microsoft.com/rp/product-ingestion/resource-tree/product/${offerId}?$version=2022-03-01-preview5&targetType=live`;
    const configUrl2 = `https://graph.microsoft.com/rp/product-ingestion/resource-tree/product/${offerId}?$version=2022-03-01-preview5&targetType=preview`;
    
    const offerData = await makeAPICall(token, configUrl, configUrl2);
    
    if (!offerData || !Array.isArray(offerData.resources)) {
        throw new Error('Invalid offer data received from API');
    }
    
    // Update schema and clean unwanted fields
    offerData["$schema"] = "https://schema.mp.microsoft.com/schema/configure/2022-03-01-preview2";
    delete offerData.root;
    delete offerData.target;

    // First pass: Generate all resourceNames in parallel
    const resourceNamePromises = offerData.resources.map(async (element) => {
        if (element.id) {
            return { 
                element, 
                resourceName: await hashStringToGUID(element.id) 
            };
        }
        return { element, resourceName: null };
    });
    
    // Wait for all hashing to complete
    const resourceResults = await Promise.all(resourceNamePromises);
    
    // Apply the resourceNames to elements
    for (const { element, resourceName } of resourceResults) {
        if (resourceName) {
            element.resourceName = resourceName;
            delete element.id;
        }
    }

    // Second pass: Process all references in parallel
    let submissionIndex = -1;
    const dependencyPromises = offerData.resources.map(async (element, index) => {
        const updates = {};
        
        // Process each reference type
        if (element.product) {
            updates.product = { resourceName: await hashStringToGUID(element.product) };
        }
        
        if (element.listing) {
            updates.listing = { resourceName: await hashStringToGUID(element.listing) };
        }
        
        if (element.plan) {
            updates.plan = { resourceName: await hashStringToGUID(element.plan) };
        }
        
        if (element.meterDefine) {
            updates.meterDefine = { resourceName: await hashStringToGUID(element.meterDefine) };
        }
        
        if (element.leadDestination) {
            updates.leadDestination = 'none';
            updates.deleteMarketoConfig = true;
        }
        
        // Handle schema updates
        if (element.$schema) {
            if (element.$schema.includes("product-ingestion.azureedge.net")) {
                updates.schema = element.$schema
                    .replace("https://product-ingestion.azureedge.net/schema/", "https://schema.mp.microsoft.com/schema/")
                    .replace("-preview3", "-preview5");
            }
            
            if (element.$schema.includes("https://schema.mp.microsoft.com/schema/submission/2022-03-01-preview2")) {
                updates.isSubmission = true;
                submissionIndex = index;
            }
        }
        
        return { element, updates, index };
    });
    
    // Wait for all processing to complete
    const updateResults = await Promise.all(dependencyPromises);
    
    // Apply all updates
    for (const { element, updates } of updateResults) {
        if (updates.product) element.product = updates.product;
        if (updates.listing) element.listing = updates.listing;
        if (updates.plan) element.plan = updates.plan;
        if (updates.meterDefine) element.meterDefine = updates.meterDefine;
        if (updates.leadDestination) element.leadDestination = updates.leadDestination;
        if (updates.deleteMarketoConfig) delete element.marketoLeadConfiguration;
        if (updates.schema) element.$schema = updates.schema;
    }
    
    // Remove submission resource if found
    if (submissionIndex >= 0) {
        offerData.resources.splice(submissionIndex, 1);
    }
    
    console.debug(offerData);
    return offerData;
}
  // post offer info
  export async function postOfferInfo(url,offerData,token,offerName,offerId){
    // check if you get offerName
    for (let i = 0; i < offerData.resources.length; i++) {
      var element = offerData.resources[i];
      //console.debug(element);
      if (element["$schema"] && element["$schema"].includes("https://schema.mp.microsoft.com/schema/product/")) {
        
        if((offerName=='') || (offerName==null)){
          element["alias"] =''+ element["alias"]; 
        }
        else
        {
          element["alias"]=offerName;
        }

        if((offerId=='') || (offerId==null)){
          element["identity"]["externalId"]= element["identity"]["externalId"]+"_copy"; // put clone of
        }
        else
        {
          element["identity"]["externalId"]= offerId;
        }
        break
      }

  }

  
      // submit the offer
      var configUrl='https://graph.microsoft.com/rp/product-ingestion/configure'
      const bodyData = JSON.stringify(offerData, removePrototype);
  
      console.debug(bodyData);
    var response=  await makePostAPICallWithBody(token, configUrl, bodyData)
    console.debug(response);
    return "Offer Submitted";

  }

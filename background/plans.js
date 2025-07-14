/**
 *  Get the Plan Information for specific offer
 */
import { makeAPICall,hashStringToGUID, makePostAPICallWithBody } from "./offers.js";

// sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// clean up body
 function removePrototype(key, value) {
    if (key === '__proto__' || key === 'constructor' ) {
      return undefined; // Exclude these properties
    }
    return value;
  }

// find value by key in json array
async function findObjBySchema(jsonArray, value,planGuid,schemaOnly=false) {
    // Loop through each object in the JSON array
    for (let i = 0; i < jsonArray.length; i++) {
      const obj = jsonArray[i];
      // Check if the object contains the specified key
      if (obj.hasOwnProperty("$schema") && obj["$schema"].includes(value)) {
            if((obj["id"].includes(planGuid)||(obj["id"].includes("price-and-availability-custom-meter"))))
            {
              return obj;
            }
            if(obj.hasOwnProperty("plan") && obj["plan"].includes(planGuid))
            {
              return obj;
            }
      }

      if (obj.hasOwnProperty("$schema") && obj["$schema"].includes(value) && schemaOnly){
        return obj;
      }
    }
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
    const regex = /plans\/([0-9a-fA-F-]{36})\/(listings|availability|technicalconfiguration)/;
    
    // Execute the regular expression on the URL
    const match = url.match(regex);
    
    // Return the matched plan GUID or null if no match is found
    return match ? match[1] : null;
  }

export async function postPlanInfo(url,copyPlanData,token)
{
    // extract offer GUID from URL
    const offerId=extractOfferGuidFromUrl(url);
    console.debug("current offer Id" + offerId);
    var configUrl='https://graph.microsoft.com/rp/product-ingestion/resource-tree/product/'+offerId+'?$version=2022-03-01-preview5&targetType=live'
    var configUrl2='https://graph.microsoft.com/rp/product-ingestion/resource-tree/product/'+offerId+'?$version=2022-03-01-preview5&targetType=preview'
    var offerData = await makeAPICall(token,configUrl,configUrl2);
    console.debug(offerData);
    // we need to check for offer type 
    var productData = await findObjBySchema(offerData["resources"],"https://schema.mp.microsoft.com/schema/product/",null,true);
    var offerType=productData["productType"];    
    var productId = productData["id"];

    // Update Plan/listing/availability/technicalconfiguration schema to include resourceName part
    var planSetup=copyPlanData["planSetup"];
    var planListing=copyPlanData["planListing"];
    var planAvailability=copyPlanData["planAvailability"];
    var planMeter=copyPlanData["planMeter"];
    var planPackage=copyPlanData["planMeter"];

    // delete Ids
    delete planSetup["id"];
    delete planListing["id"];
    delete planAvailability["id"];

    //Update Product
    planSetup["resourceName"]= await hashStringToGUID(planSetup["id"]);
    planSetup["product"]= productId;
    planListing["product"]= productId;
    planAvailability["product"]= productId;

    //update Plan
    planListing["plan"]= {"resourceName": planSetup["resourceName"]};
    planAvailability["plan"]= {"resourceName": planSetup["resourceName"]};
    
    if(planMeter!=null)
      {
        delete planMeter["id"];
        planMeter["product"]= productId;
      }

      if(planPackage!=null)
        {
          delete planPackage["id"];
          planPackage["product"]= productId;
          planPackage["plan"]= {"resourceName": planSetup["resourceName"]};
    
        }

    console.debug(planSetup);
    console.debug(planListing); 
    console.debug(planAvailability);
    
    console.debug(planMeter);

// prepare for post
    const resourcesArray = [];
    var planPostData= {"$schema":"https://schema.mp.microsoft.com/schema/configure/2022-03-01-preview2"}

    if (planMeter != null) {
      resourcesArray.push(planMeter);
    }
    
    resourcesArray.push(planSetup);
    resourcesArray.push(planListing);
    resourcesArray.push(planAvailability);
    
    
    if (planPackage != null) {
      resourcesArray.push(planPackage);
    }
    
    // Assign the resources array to offerData
    planPostData["resources"] = resourcesArray;
    console.debug(planPostData);
    
    // post the data
          // submit the offer
    var configUrl='https://graph.microsoft.com/rp/product-ingestion/configure'
    const bodyData = JSON.stringify(planPostData, removePrototype);
    console.debug(bodyData);
         // console.debug(bodyData);
    await makePostAPICallWithBody(token, configUrl, bodyData)
    return 'Paste Plan Completed';

}
async function extractPlanData(offerResources,planGuid)
{
    console.debug("Extract Plan Data");
    // get plan data
    //https://schema.mp.microsoft.com/schema/plan/
    //https://product-ingestion.azureedge.net/schema/plan-listing/
    //https://schema.mp.microsoft.com/schema/price-and-availability-plan
    //https://product-ingestion.azureedge.net/schema/pri…and-availability-custom-meter

    // Container and VM will have technical configuration.. add it later.

    var planMeterInfo=null;
    var packageInfo=null;
    var planInfo= await findObjBySchema(offerResources,"https://schema.mp.microsoft.com/schema/plan/",planGuid);
    var planListingInfo=await findObjBySchema(offerResources,"https://product-ingestion.azureedge.net/schema/plan-listing/",planGuid);
    var planAvailabilityInfo=await findObjBySchema(offerResources,"https://schema.mp.microsoft.com/schema/price-and-availability-plan/",planGuid);
    
    //Check if plan is metered or not
    if(planAvailabilityInfo.hasOwnProperty("pricing") && planAvailabilityInfo["pricing"].hasOwnProperty("customMeters") && planAvailabilityInfo["pricing"]["customMeters"].hasOwnProperty("meters"))
    {
      planMeterInfo= await findObjBySchema(offerResources,"https://product-ingestion.azureedge.net/schema/price-and-availability-custom-meter/",planGuid);

      if(planMeterInfo!=null)
      {
        console.debug(planAvailabilityInfo);
        console.debug(planMeterInfo);
        // get active meter
        var meters=planAvailabilityInfo["pricing"]["customMeters"]["meters"];
        const keys = Object.keys(meters);
        const meterkeys = Object.keys(planMeterInfo["customMeters"])

        for (const meterkey of meterkeys) {
          if(keys.includes(meterkey))
          {
            console.debug("found active meter");
          }
          else
          {
            delete planMeterInfo["customMeters"][meterkey]
          }

        }

    }}
    return {"planSetup":planInfo,"planListing":planListingInfo,"planAvailability":planAvailabilityInfo,"planMeter":planMeterInfo, "packageInfo":packageInfo};
}

export async function getPlanInfo(token,url)
{
    const planGuid=extractPlanGuidFromUrl(url);
    var offerId= extractOfferGuidFromUrl(url);
    var configUrl='https://graph.microsoft.com/rp/product-ingestion/resource-tree/product/'+offerId+'?$version=2022-03-01-preview5&targetType=live'
    var configUrl2='https://graph.microsoft.com/rp/product-ingestion/resource-tree/product/'+offerId+'?$version=2022-03-01-preview5&targetType=preview'
    var offerData = await makeAPICall(token,configUrl,configUrl2);
    console.debug(offerData);
    
    //TODO
    // get offer type and save it

    var planInfo=await extractPlanData(offerData["resources"],planGuid);
    
    return planInfo;
}
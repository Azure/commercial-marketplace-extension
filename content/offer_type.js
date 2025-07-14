/**
 * This file contains the logic to determine the offer type of the current page.
 * It watches for the command bar to be loaded and then fetch the offer type from the product API.
 */


/**
 * Get the GUID of the current offer from the URL
 * @returns {string} - The GUID of the current offer
 * @returns {undefined} - If the GUID cannot be determined
 */
function getOfferGuid() {
  
  const guidPattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;

  var splitHref = window.location.href.split('/');
  var guid = splitHref[splitHref.indexOf('offers') +1];
  var gotValidGuid = guidPattern.test(guid);

  if (!gotValidGuid) {
    return undefined;
  }
  
  return guid;
}

/**
 * Get the offer type of the current page from the product API
 * @returns {string} - The offer type of the current page
 * @returns {undefined} - If the offer type cannot be determined
 */
async function getOfferType() {

  // Callback function to execute when mutations are observed
  var offerGuid = getOfferGuid();
  if (offerGuid == undefined) {
    return undefined;
  }

  var productUrl = 'https://partner.microsoft.com/en-us/dashboard/product/api/products/' + offerGuid + '/productAndFocusNav';
  var offerType = undefined;
  await fetch(productUrl)
        .then(response => response.json())
        .then(data => 
          {
            offerType = data['product']['type'];
          });
    
  return offerType;
}
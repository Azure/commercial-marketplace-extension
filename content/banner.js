/**
 * Displays a banner if it has not been previously closed.
 * Checks the 'bannerClosed' flag in Chrome's local storage.
 * If the banner was previously closed, it logs a debug message and exits.
 * Otherwise, it logs a different debug message and calls the renderBanner function.
 */
function showBanner(){
    // localStorage.clear();
    chrome.storage.local.get(['bannerClosed'], function(result) {
        if (result.bannerClosed) {
            console.debug('🪧Banner previously closed.');
            return;
        }
        else {
            console.debug('🪧Banner not previously closed.');
            renderBanner();
        }
    });
}


/**
 * Renders a banner on the page with information about the Marketplace extension.
 * The banner includes an icon to open the menu and a close button to hide the banner.
 * 
 * The banner is inserted before the element with the ID `onedash-header-search-icon`.
 * 
 * The banner contains:
 * - A title indicating the addition of the Marketplace extension.
 * - An image of a tote bag that, when clicked, sends a message to open a popup.
 * - An image of an 'X' that, when clicked, hides the banner and saves the closed state in local storage.
 * 
 * The function also sends a message to show an icon when the banner is rendered.
 */
function renderBanner() {
    console.debug('🪧Render banner...')
    
    const toteBagImage = chrome.runtime.getURL("images/tote-bag.png");
    
    chrome.runtime.sendMessage({ action: "showIcon" });
    
    const element = $(`#onedash-header-search-icon`);
    console.debug("element");
    console.debug(element);
    
    const banner = $(`
        <div id="banner-div" class="banner">
            <span class="banner-title">
                You have added the Marketplace extension 
                (<img id="tote-bag" src="${toteBagImage}" class="banner-tote-bag" alt="marketplace tote bag image">) 
                to show the extension.
            </span>    
        </div>`);

    // use svg for the X (close) button on the banner
    let svgX = $(`
        <span id="banner-x-span">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" class="bi bi-x-lg" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
            </svg>
        </span>`);
    
    svgX.click(function () {
        $(".banner").toggle();    
        chrome.storage.local.set({ bannerClosed: true }, function() {
            console.debug('Banner closed state saved.');
        });
    });
    
    banner.append(svgX);
        
    element.before(banner); // adds the bubble after the element from jquery_selector

    $("#banner-div").click(function () {
        chrome.runtime.sendMessage({ action: "openPopup" });       
    });

}


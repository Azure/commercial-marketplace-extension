/**
 * The main function that runs when the document loads.
 * @returns {void}
 */
$(document).ready(() => {

    registerEventListeners();
    loadSettings();

    chrome.runtime.sendMessage({ action: 'loadConfig' }, (response) => {
        
        if (response.error) {
            console.error('Failed to load config JSON:', response.error);
            showContent('pageContentNavItem', 'pageContentDiv');
            return;
        }

        if (response.success) {
            // setPrivateOffersIFrameSrc(response.data);
            mountRecentContent(response.data);
            mountPageContent(response.data, () => {
                showContent('pageContentNavItem', 'pageContentDiv');
            });

        }
    });
});

/**
 * Register the event listeners for the form elements
 * @returns {void}
 */
let registerEventListeners = function () {

    // get the div ids for all children of the #navDiv element,
    // removing the 'NavItem' suffix from the id
    let navSections = $('#navDiv').children().map((index, element) => {
        return element.id.replace('NavItem', '');
    });

    // wire up event handling for the nav buttons
    Array.from(navSections).forEach(contentSection => {
        $(`#${contentSection}NavItem`).on('click', () => {
            showContent(`${contentSection}NavItem`, `${contentSection}Div`);
        });
    });

    // wire up event handling for the settings form elements
    $('#enableAll').on('click', () => {
        toggleAllSettings(true);
    });

    $('#disableAll').on('click', () => {
        toggleAllSettings(false);
    });

    let checkboxes = $('#settingsDiv input[type="checkbox"]');
    Array.from(checkboxes).forEach(checkbox => {
        $(checkbox).on('click', () => {
            console.debug('Checkbox clicked:', $(checkbox).attr('id'));
            saveCheckboxValue($(checkbox).attr('id'));
        });
    });
}

/**
 * Toggle all the settings checkboxes to the specified state
 * @param {boolean} isChecked - the state to set the checkboxes to
 * @returns {void}
 * */
let toggleAllSettings = function (isChecked) {
    let checkboxes = $('#settingsDiv input[type="checkbox"]');
    Array.from(checkboxes).forEach(checkbox => {
        $(checkbox).prop('checked', isChecked);
        saveCheckboxValue($(checkbox).attr('id'));
    });
}

/**
 * Show the content for the specified nav item and content item
 * @param {string} navItemId - the id of the nav item
 * @param {string} contentItemId - the id of the content item
 * @returns {void}
 * */
let showContent = function (navItemId, contentItemId) {

    // hide the content divs and disable the nav buttons
    $(".nav-link").removeClass("active");
    $(".content-pane").css("display", "none");

    // activate the correct content div and enable the nav button
    $(`#${navItemId}`).addClass("active");
    $(`#${contentItemId}`).css("display", "flex");
}

/** 
 * Mount the recent content to the popup window
 * @param {Object} config - the config object containing the content
 * @returns {void}
 */
let mountRecentContent = function (config) {

    let recentContentList = $("#recentContentList");
    recentContentList.empty();

    if (config == null) {
        console.error("Config not loaded. Cannot mount recent content.");
        recentContentList.text("Error loading recent content. Please try again.");
        return;
    }

    // create a link for each recent content item
    let contentLinks = [];
    config.recent_content.forEach((content) => {
        contentLink = createContentLink(content);
        contentLinks.push(contentLink[0]);
    });

    // sort the content links by title
    contentLinks = contentLinks.sort((a, b) => {
        if (a.innerText < b.innerText) {
            return -1;
        }
        if (a.innerText > b.innerText) {
            return 1;
        }
        return 0;
    });

    // put the content on the page
    if (contentLinks.length > 0) {
        recentContentList.empty(); // clear the content
        contentLinks.forEach(link => {
            recentContentList.append(link);
        });
    }
}

/** 
 * Mount the page content to the popup window.
 * @param {Object} config - the config object containing the content
 * @returns {void}
 */
let mountPageContent = function (config, onSuccessfulMount) {

    let pageContentDiv = $("#pageContentDiv");

    if (config == null) {
        console.error("Config not loaded. Cannot mount page content.");
        pageContentDiv.text("Error loading page content. Please try again.");
        return;
    }

    // mount the content items that are targeted to the current page
    chrome?.tabs?.query({ active: true, currentWindow: true }, (tabs) => {

        if (tabs[0].url == null) {
            console.warn("No URL found for the current tab.");
            onSuccessfulMount();
            return;
        }

        // get the current page URL and clean it to its bare minimum
        let parsedUrl = new URL(tabs[0].url);
        let currentPageUrl = parsedUrl.origin + parsedUrl.pathname;
        if (currentPageUrl.endsWith('/')) {
            currentPageUrl = currentPageUrl.slice(0, -1);
        }

        // mount any content that targets the current page
        let contentLinks = createContentLinks(config, currentPageUrl);

        if (contentLinks.length > 0) {
            let pageContentList = $("#pageContentList");
            pageContentList.empty(); // clear the content

            // put the content on the page
            contentLinks.forEach(link => {
                pageContentList.append(link);
            });
        }
    });

    onSuccessfulMount();
}

/**
 * Create a link element for content item data
 * @param {Object} content - the content object with title and url properties
 * @returns {HTMLAnchorElement} - the link element
 */
let createContentLink = function (content) {

    // create new link for this content
    let contentLink = $("<a></a>");
    contentLink.attr('href', content.target_url);
    contentLink.attr('title', content.target_title);
    contentLink.text(content.target_title);
    contentLink.addClass(content.content_type + "-link content-link list-group-item list-group-item-action");

    // assign event handler to open the link in a new tab
    contentLink.click(() => {
        window.open(contentLink.attr("href"), '_blank');
    });

    return contentLink;
}

/**
 * Get the content links that target the current page
 * @param {Object} config - the config object containing the content
 * @param {string} currentPageUrl - the current page URL
 * @returns {Array} - the content links that target the current page
 */
let createContentLinks = function (config, currentPageUrl) {

    let contentLinks = [];
    let acceptedContentTypes = [
        "audio",
        "video",
        "modal"
    ];
    let pageUrl = currentPageUrl.toLowerCase();

    // for each entry in the config
    // if the content targets the current page
    config.page_content.forEach(page => {

        // are we on the page that the content is targeting?
        if (pageUrl == page.page_url.toLowerCase()) {

            console.debug(`Found content for page: ${page.page_url}`);

            // for each content item on the page in the config
            page.content.forEach(content => {

                // only include accepted content types
                if (acceptedContentTypes.includes(content.content_type)) {
                    console.debug(`Adding content of type: ${content.content_type}`);
                    // add a link for each link item that targets the current page
                    let contentLink = createContentLink(content);
                    contentLinks.push(contentLink);
                }
            });
            return;
        }
    });

    return contentLinks;
}

/**
 * Save the value of a checkbox
 * @param {string} inputId - the id of the checkbox input
 * @returns {void}
 */
let saveCheckboxValue = function (inputId) {

    let isChecked = $(`#${inputId}`).is(':checked');

    let message = {
        action: 'saveSetting',
        key: inputId,
        value: isChecked
    }

    // send the message to the background worker to save the setting
    chrome.runtime.sendMessage(message, (response) => {
        if (!response.success) {
            console.error('Failed to save setting:', response.error);
            return;
        }
        // console.debug('saveCheckboxValue:', inputId, isChecked);
    });
}

/**
 * Load the settings state from chrome storage
 * and set the form elements accordingly
 * @returns {void}
 */
let loadSettings = function () {

    // get the settings from storage via the background worker
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {

        if (!response.success) {
            console.error('Failed to get settings:', response.error);
            return;
        }

        let settings = response.data;

        // set the values on the controls in settings
        let checkboxes = $('#settingsDiv input[type="checkbox"]');
        Array.from(checkboxes).forEach(checkbox => {
            let key = $(checkbox).attr('id');
            let value = settings[key];
            console.debug('loadSettings:', key, value);
            $(checkbox).prop('checked', value);
        });
    });
}

/**
 * Set the src attribute of the private offers iframe
 * from the config object
 * @param {Object} config - the config object containing the content mapping
 * @returns {void}
 * */
let setPrivateOffersIFrameSrc = function(config) {
    let iframe = $("#privateOfferIFrame");
    iframe.prop("src", config.private_offer_page);
}

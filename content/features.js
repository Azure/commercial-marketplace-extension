// Description: This file contains the code for rendering the features of the product.

// Renders a hint with the given content.
function renderHint(content, renderedObjects) {

  //write a function to run the carasoul on startup
  function runCarousel() {
    console.debug("Running sticky note carousel...");
    const container = document.querySelector('.carousel-container');
    const items = document.querySelectorAll('.carousel-item');
    let currentIndex = 0;
    const totalItems = items.length;
    if (totalItems <= 1) {
      console.debug("No or one items found in sticky note carousel.");
      return;
    };

    function showNextItem() {
      // Remove 'active' class from the current item
      items[currentIndex].classList.remove('active');

      // Get a random index
      let randomIndex = Math.floor(Math.random() * items.length);

      // Calculate the next index
      //currentIndex = (currentIndex + 1) % totalItems;
      // Add 'active' class to the next item
      items[randomIndex].classList.add('active');
      currentIndex = randomIndex;
    }

    // Set an interval to show the next item every 3 seconds
    setInterval(showNextItem, 10000);
  }

  console.debug("⚙️Starting renderHint...");

  const element = $(`${content.jquery_selector}`);
  if (!element) {
    console.error(`Element not found to mount hint. JQuery selector: ${content.jquery_selector}`);
    return;
  }

  const stickynoteElement = document.createElement('div');
  stickynoteElement.classList.add('sticky-note');
  stickynoteElement.innerHTML = `<h2 class="hint-title">${content.title}</h2> <br>`;

  const carouselcontainer = document.createElement('div');
  carouselcontainer.classList.add('carousel-container');

  content.items.forEach((item) => {

    const carouselItem = document.createElement('div');

    carouselItem.classList.add('carousel-item');

    if (content.items.indexOf(item) === 0) {
      carouselItem.classList.add('active');
    }

    carouselItem.innerHTML = `<p class="note-text">${item.target_title}</p><p><a href="${item.target_url}" target="_blank" class="note-link">Link</a></p>`;
    carouselcontainer.appendChild(carouselItem);
  });

  stickynoteElement.appendChild(carouselcontainer);
  element.before(stickynoteElement); // adds the bubble after the element from jquery_selector
  runCarousel();

  renderedObjects.push(stickynoteElement); //add to the rendered objects array for later removal
}

// Renders the embedded video with the given content.
function renderVideo(content, renderedObjects) {
  console.debug("⚙️Starting renderVideo...");

  const element = $(`${content.jquery_selector}`);

  if (!element) {
    console.debug(`⚠️ Element not found to mount video. JQuery selector: ${content.jquery_selector}`);
    return;
  }

  let videoDiv = $("<div class='video-container'></div>");

  //append the video player
  videoDiv.append(`
     <video class="video-player" controls>
      <source src="${content.target_url}" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  `);
  element.before(videoDiv); // adds the bubble after the element from jquery_selector

  renderedObjects.push(videoDiv); //add to the rendered objects array for later removal
}

// Renders the diagram with the given content.
function renderModal(content, renderedObjects) {

  console.debug("⚙️ Starting renderModal...");

  const mountElement = $(`${content.jquery_selector}`);
  if (!mountElement) {
    console.debug(`⚠️ Element not found to mount feature. JQuery selector: ${content.jquery_selector}`);
    return;
  }

  const modalId = Math.random().toString(36).substr(2, 8);

  let modalHtmlBuilder = `
    <div id="div-${modalId}" class="diagram-container">
      <span id="tbc-${modalId}" class="toggle-x-button">
        <svg xmlns="http://www.w3.org/2000/svg" alt="Close" width="16" height="16" fill="black" class="bi bi-x-lg" viewBox="0 0 16 16">
          <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
        </svg>
      </span>
      <div class="diagram-title">${content.text}</div>`; // no closing tag for the div yet, comes later

  // render video or image icon
  if (content.target_url.endsWith('.mp4')) { //render video
    modalHtmlBuilder += `
      <video class="video-player" title="${content.target_title}" controls>
        <source src="${content.target_url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>`;
  }
  else { // render image
    modalHtmlBuilder += `<img src="${content.target_url}" title="${content.target_title}" alt="Image" class='modal-image'>`;
  }

  modalHtmlBuilder += `<div class="diagram-description">${content.target_title}</div></div>`;

  // Place the diagram in the productWeb div
  let displayDiagramDiv = $(`#productWeb`);
  displayDiagramDiv.append(modalHtmlBuilder);


  // wire up the open button/icon
  let openIconHtmlBuilder = $(`<div class='diagram-div'></div>`);
  openIconHtmlBuilder.css({
    'position': content.position || 'relative',
    'left': content.left || '0px',
    'top': content.top || '0px'
  });

  mountElement.before(openIconHtmlBuilder);

  if (content.target_url.endsWith('.mp4')) { //render video icon
    openIconHtmlBuilder.append(`
      <span id="tb-${modalId}" class="toggle-button">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="svg-icon modal-video-icon" viewBox="0 0 25 25">
          <title>${content.target_title}</title>
          <path d="M0 12V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2m6.79-6.907A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814z"/>
        </svg>
      </span>`);
  }
  else { // render image icon
    openIconHtmlBuilder.append(`
      <span id="tb-${modalId}" class="toggle-button">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="svg-icon modal-camera-icon" viewBox="0 0 16 16">
          <title>${content.target_title}</title>
          <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
          <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"/>
        </svg>
      </span>`);
  }

  $(`#tb-${modalId}`).click(function () {
    $(`#div-${modalId}`).toggle();
  });

  $(`#tbc-${modalId}`).click(function () {
    $(`#div-${modalId}`).toggle();
  });

  renderedObjects.push(modalHtmlBuilder); //add to the rendered objects array for later removal
  renderedObjects.push(openIconHtmlBuilder); //add to the rendered objects array for later removal
}

/**
 * Renders a tooltip with the given content.
 * @param {*} content
 * @param {*} renderedObjects
 * @returns
 */
function renderToolTip(content, renderedObjects) {
  
  console.debug("⚙️ Starting renderToolTip...");

  const mountElement = $(`${content.jquery_selector}`);
  if (!mountElement) {
    console.debug(`⚠️ Element not found to mount tooltip. JQuery selector: ${content.jquery_selector}`);
    return;
  }

  let tooltipIcon = $(`
    <span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="svg-icon tool-tip-icon" viewBox="0 -8 25 25">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
      </svg>
    </span>`);

  let tooltipDiv = $(`<div class='tooltip'>${content.text}</div>`);
  tooltipDiv.css({
    left: content.left || '10px',
    top: content.top || 'inherit',
    display: 'none'
  });
    
  tooltipIcon.append(tooltipDiv);
  tooltipIcon.hover(function () {
    tooltipDiv.toggle();
  });
  
  mountElement.after(tooltipIcon);

  renderedObjects.push(tooltipIcon); //add to the rendered objects array for later removal
  renderedObjects.push(tooltipDiv); //add to the rendered objects array for later removal
}

/**
 * Renders a dynamic link to the screen
 * @param {*} content 
 * @param {*} renderedObjects 
 */
function renderLink(content, renderedObjects) {

  console.debug("🔗 Starting renderLink...");
  let mountElement = $(`${content.jquery_selector}`);

  if (!mountElement) {
    console.debug(`⚠️ Element not found to mount link. JQuery selector: ${content.jquery_selector}`);
    return;
  }

  let linkContainerSpan = $(
    `<span class='link-container'>
      <a href="${content.target_url}" title="${content.target_title}" target="_blank">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="svg-icon link-icon" viewBox="0 -8 25 25">
          <title>${content.target_title}</title>
          <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
          <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
        </svg>
      </a>
     </span'>`);

  mountElement.append(linkContainerSpan);

  renderedObjects.push(linkContainerSpan); //add to the rendered objects array for later removal
}

/**
 * Renders an audio player with the given content.
 * @param {*} content
 * @param {*} renderedObjects
 */
function renderAudio(content, renderedObjects) {
  console.debug("⚙️Start renderAudio...");

  let audioContainerDiv = $(
    `<span class='audio-container'>
      <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon audio-icon" viewBox="0 -12 25 25">
          <title>${content.target_title}</title>
          <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/>
          <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z"/>
          <path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06"/>
        </svg>
    </span'>`);

  // add a div into the audioContainerDiv element to hold the player
  let audioPlayerSpan = $(`<span class='audio-player'></span>`);
  let audioTag = $(
    `<audio controls>
      <source src="${content.target_url}" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>)`);

  // add an onclick event that changes visibility of the playerDiv
  audioContainerDiv.click(function () {
    audioPlayerSpan.toggle();

    // play the audio when the player is visible
    if (audioPlayerSpan.is(':visible'))
      audioTag[0].play();
    else
      audioTag[0].pause();
  });

  audioPlayerSpan.append(audioTag);
  audioContainerDiv.append(audioPlayerSpan);

  let mountElement = $(`${content.jquery_selector}`);
  mountElement.append(audioContainerDiv);

  renderedObjects.push(audioContainerDiv); //add to the rendered objects array for later removal
}


// Renders a bubble with the given content.
function renderBubble(content, renderedObjects) {
  console.debug("starting bubble...");
  const element = $(`${content.jquery_selector}`);
  console.debug("element");
  console.debug(element);

  let divBuilder = `<div class="bubble">
                      <p class="bubble-text">${content.text}`;
  divBuilder += content.target_url ? `<a href="${content.target_url}" class="bubble-link" target="_blank">Link</a>` : ``;
  divBuilder += `  </p> 
                    </div>`;
  let floatingDiv = $(divBuilder);

  // Style the <div> to float on the page
  floatingDiv.css({
    'position': content.position || 'absolute',
    'padding': '5px',
    'padding-left': '10px',
    'background-color': content.color || 'cyan',
    'color': 'black',
    'border-radius': '5px',
    'border-color': 'black',
    'box-shadow': '4px 4px 8px rgba(0, 0, 0, 0.5)',
    'z-index': '1000',
    'font-size': '14px',
    'top': content.top || '0px',
    'margin-left': '15px',
    'margin-right': '15px',
    'display': 'inline-block',
    'min-width': '200px',
    'width': content.width || 'auto',
  });
  
  floatingDiv.css('left', content.left || 100 + 'px');
  element.after(floatingDiv); // adds the bubble after the element from jquery_selector

  renderedObjects.push(floatingDiv); //add to the rendered objects array for later removal
}
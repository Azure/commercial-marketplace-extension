(function () {
  // Declare variables for timer and display elements
  var refreshTimerView = undefined;
  var display = undefined;
  var currentTimerLimit = 60000;
  var timerInterval = undefined;
  var reloadInterval = undefined;

  // Function to stop the refresh timer
  function stopRefreshTimer() {
    console.debug("Stop refresh timer...");
    clearInterval(timerInterval);
    timerInterval = undefined;
  };

  // Function to start the refresh timer
  function startRefreshTimer() {
    console.debug("Start Refresh Timer.");
    startTimerInterval(currentTimerLimit, display);
  };

  // Function to initialize and start the timer interval
  function startTimerInterval(duration, display) {
    console.debug("Initializing refresh timer...");
    duration = 60 * 1000;
    var timer = duration, minutes, seconds;
    if (timerInterval == undefined) {
      timerInterval = setInterval(function () {
        minutes = parseInt(timer / 6000, 1000);
        seconds = parseInt(timer % 60, 10);
        if (seconds === 0) {
          seconds = 59;
        }
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        display.textContent = (isNaN(minutes) ? "0" : minutes) + ":" + seconds;
        if ((isNaN(minutes) || minutes == 0) && seconds == "01") {
          console.debug("Refresh timer expired.");
          location.reload();
        }
        if (--timer < 0) {
          timer = duration;
        }
      }, 1000);
      console.debug("Refresh timer initialized.");
    } else {
      console.debug("Refresh timer already running.");
      console.debug(timerInterval);
    }
  }

  // Function to watch for changes in the publish status
  function watchForPublishStatus() {
    // Select the node that will be observed for mutations
    const targetNode = document.querySelector('body');
    // Options for the observer (which mutations to observe)
    const config = { attributes: true, childList: true, subtree: true };
    const callback = async (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0
          && $('header.section-header:contains("Publish status")')
          && $('div.subway-marble.complete').length > 0 && $('div.subway-marble.complete').length < 3) {

          const element = $('header.section-header:contains("Publish status")');
          if (element.length > 0) {
            _refreshTimerView = await chrome.runtime.getURL('content/controls/refresh_timer.html');
            const response = fetch(_refreshTimerView);
            response.then(async (data) => {
              const responseData = await data.text();
              element.append(responseData);
              display = document.querySelector('span#refresh_timer');

              document.querySelector('button#refreshStart').addEventListener('click', startRefreshTimer, false);
              document.querySelector('button#refreshStop').addEventListener('click', stopRefreshTimer, false);

              startRefreshTimer();
            });

            observer.disconnect();
            return;
          }
        }
      }
    };
    console.debug('watch for publish status');
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }


  // Regular expression to match the overview path
  const regex = new RegExp("/*(\/overview)");
  $(document).ready(async () => {
    chrome.storage.local.get('enableRefreshTimer', (data) => {
      console.debug('refreshTimer', data.enableRefreshTimer);
      if (data.enableRefreshTimer) {
        watchForPublishStatus();
      }
    });

    // Stop the refresh timer when navigating away from the overview page
    navigation.addEventListener('navigate', () => {
      if (!regex.test(location.href)) {
        stopRefreshTimer();
      }
    });
  });
})();
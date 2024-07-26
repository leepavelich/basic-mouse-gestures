const Errors = {
  NOT_FOUND_NEXT_PAGE: "Cannot find a next page in history.",
};

const forwardErrHandler = (error) => {
  if (error.message === Errors.NOT_FOUND_NEXT_PAGE) return
  console.error(`Error performing 'right' gesture: ${error.message}`);
}

const gestureActions = {
  'left': (sender) => chrome.tabs.goBack(sender.tab.id),
  'right': (sender) => chrome.tabs.goForward(sender.tab.id).catch(forwardErrHandler),
  'up': (_sender, link) => chrome.tabs.create({ url: link || 'chrome://newtab/', active: true }),
  'down': (_sender, link) => {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      chrome.tabs.create({ url: link || 'chrome://newtab/', active: false, index: tabs[0].index + 1 });
    });
  },
  'down-right': (sender) => chrome.tabs.remove(sender.tab.id),
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== 'performGesture') return

  const action = gestureActions[request.gesture];
  if (action) action(sender, request.link);
});

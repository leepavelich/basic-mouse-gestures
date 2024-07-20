const gestureActions = {
  'left': (sender) => chrome.tabs.goBack(sender.tab.id),
  'right': (sender) => chrome.tabs.goForward(sender.tab.id),
  'up': (_sender, link) => chrome.tabs.create({ url: link || 'chrome://newtab/', active: true }),
  'down': (_sender, link) => chrome.tabs.create({ url: link || 'chrome://newtab/', active: false }),
  'down-right': (sender) => chrome.tabs.remove(sender.tab.id),
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'performGesture') {
    const action = gestureActions[request.gesture];

    if (action) {
      action(sender, request.link);
    }
  }
});

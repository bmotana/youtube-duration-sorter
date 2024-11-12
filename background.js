/* global chrome */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab?.url?.includes('youtube.com/videos')) {
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError.message);
          } else {
            console.log('Message sent successfully, response:', response);
          }
        });
      }, 1000);
    }
  });
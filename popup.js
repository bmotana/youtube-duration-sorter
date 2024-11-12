/* global chrome */
document.addEventListener('DOMContentLoaded', () => {
    const maxVideosSelect = document.getElementById('maxVideosSelect');
    const saveButton = document.getElementById('saveButton');
  
    // Load the current max video count from storage
    chrome.storage.sync.get(['max_videos'], (result) => {
      maxVideosSelect.value = result.max_videos || '60'; // Default to 120 if not set
    });
  
    // Save the selected max video count
    saveButton.addEventListener('click', () => {
      const selectedValue = parseInt(maxVideosSelect.value, 10);
      chrome.storage.sync.set({ max_videos: selectedValue }, () => {
        console.log(`Max videos set to ${selectedValue}`);
        window.close(); // Close the popup after saving
      });
    });
  });
  
/**
 * @license
 * YouTube Duration Sorter
 * Copyright (c) 2024 Your Name
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* global chrome */
console.log('YouTube Sorter content script loaded');
const DEFAULT_MAX_VIDEOS = 60;
const SCROLL_DELAY = 500;
const LOADING_DELAY = 1500;
let isSorting = false;
let currentSortOrder = null;
let originalVideos = null;  // Store the original order of videos
let currentGeneralSort = null;
let activeButton = null; // Keep track of currently active button
let revertButton = null;
let maxVideos = DEFAULT_MAX_VIDEOS;
let latestMax = 60;

// ui-manager.js
class UIManager {
    showLoadingPopup() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        const loadingText = document.createElement('div');
        loadingText.style.cssText = `
            color: white;
            font-size: 24px;
            animation: blink 1s infinite;
        `;
        loadingText.innerHTML = 'Loading...';
    
        loadingOverlay.appendChild(loadingText);
        document.body.appendChild(loadingOverlay);
    
        // Disable scrolling
        document.body.style.overflow = 'hidden';
    }

    hideLoadingPopup() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    
        // Re-enable scrolling
        document.body.style.overflow = '';
    }
  }

// video-sorter.js
class VideoSorter {
    sortVideosByDuration(order) {
        console.log('Sorting Videos by Duration:', order);
        if (isSorting) return;
        isSorting = true;
    
        const videoContainer = document.querySelector('#contents');
        if (!videoContainer) {
            isSorting = false;
            return;
        }
    
        const videos = Array.from(videoContainer.querySelectorAll('ytd-rich-item-renderer'));
        const videoCount = videos.length;
        console.log(`Total videos found: ${videoCount}`);
        
        videos.sort((a, b) => {
            const durationA = this.parseDuration(a.querySelector('#text.ytd-thumbnail-overlay-time-status-renderer')?.textContent || '0:00');
            const durationB = this.parseDuration(b.querySelector('#text.ytd-thumbnail-overlay-time-status-renderer')?.textContent || '0:00');
            return order === 'longest' ? durationB - durationA : durationA - durationB;
        });
    
        videoContainer.innerHTML = '';
        videos.forEach(video => videoContainer.appendChild(video));
        isSorting = false;
        buttonManager.addRevertButton();
    }
    
    parseDuration(duration) {
        const parts = duration.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        return 0;
    }
  }
  

// button-manager.js
class ButtonManager {
    createSortButton(text, clickHandler) {
        console.log('Creating sort button:', text);
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('yt-spec-button-shape-next', 'yt-spec-button-shape-next--tonal', 'yt-spec-button-shape-next--mono', 'yt-spec-button-shape-next--size-m');
    
        button.style.cssText = `
            height: 32px;
            width: 72.56px;
            padding: 0px 10px;  /* Match padding */
            border-radius: 8px;  /* Match the rounded borders */
            cursor: pointer;  /* Make it clickable */
            transition: background-color 0.2s;  /* Add smooth hover transition */
        `;
    
    
        // Add click handler wrapper to manage active state
        button.addEventListener('click', () => {
            if (activeButton === button) {
                // Deactivate button
                button.style.backgroundColor = ''; // Reset to default
                button.style.color = ''; // Reset to default
                activeButton = null;
            } else {
                // Deactivate previous button if exists
                if (activeButton) {
                    activeButton.style.backgroundColor = '';
                    activeButton.style.color = '';
                }
                
                // Activate clicked button
                button.style.backgroundColor = 'var(--yt-spec-call-to-action)';
                button.style.color = 'white';
                activeButton = button;
            }
            
            clickHandler();
        });
        return button;
    }
    addSortButtons() {
        const existingButtons = document.querySelector('#chips');
        if (existingButtons && !document.querySelector('#duration-sort-buttons')) {
            console.log('Adding sort buttons');
            const sortButtonsContainer = document.createElement('div');
            sortButtonsContainer.id = 'duration-sort-buttons';
    
            sortButtonsContainer.style.cssText = `
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 8px;
            margin-left: 10px;
            display: inline-flex;  /* This ensures horizontal layout */
        `;
    
    
            const longestButton = this.createSortButton('Longest', () => toggleSort('longest')) ;
            const shortestButton = this.createSortButton('Shortest', () => toggleSort('shortest'));
    
            sortButtonsContainer.appendChild(longestButton);
            sortButtonsContainer.appendChild(shortestButton);
    
            existingButtons.parentNode.insertBefore(sortButtonsContainer, existingButtons.nextSibling);
        };
        if (!existingButtons) {
            console.log('Button Might not Exist');
        }
    }
    
    addRevertButton() {
        const videoContainer = document.querySelector('#contents');
        
        if (!videoContainer) {
            console.log('Video container not found.');
            return;
        }
    
        // Check if the button already exists to prevent duplicate buttons
        if (document.querySelector('#revertButton')) {
            console.log('Revert button already exists.');
            return;
        }
    
        // Create the button
        let revertButton = document.createElement('button');
        revertButton.id = 'revertButton';
        revertButton.textContent = 'Revert';
        
        // Optional styling
        revertButton.style.cssText = `
            margin-top: 10px;
            padding: 10px 20px;
            font-size: 16px;
            background-color: #0073e6;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
    
        // Append the button after the video container
        videoContainer.parentNode.insertBefore(revertButton, videoContainer.nextSibling);
    
        // Add click event listener
        revertButton.addEventListener('click', () => {
            console.log('Revert button clicked');
            document.body.style.overflow = 'hidden';
            // Add your revert functionality here
            restoreOriginalOrder();
            currentSortOrder = null;
            revertToGeneralSortButton();
            if (activeButton) {
                activeButton.style.backgroundColor = '';
                activeButton.style.color = '';
                activeButton = null;
            }
            ScrollManager.scrollToSortButtons();
            // Re-enable scrolling
            
            // Remove the button itself after clicking
            revertButton.remove();
    
            // Call this function only when you want to re-enable scrolling
            setTimeout(ScrollManager.reenableScrolling, 2000); // Example delay; adjust as needed
        });
    }
  }


function triggerYouTubeLoad() {
    const container = document.querySelector('#contents');
    if (container) {
        container.scrollIntoView({ behavior: 'instant', block: 'end' });
        window.dispatchEvent(new Event('scroll'));
    }
}

function getSortButtons() {
    console.log('Getting Sort Buttons');
    const chipsContainer = document.getElementById('chips');
    const sortButtons = chipsContainer.querySelectorAll('yt-chip-cloud-chip-renderer');
    return sortButtons;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// todo: can be more efficient
function revertToGeneralSortButton() {
    console.log("Reverting to General Sort Button");
    const sortOrders = ['Latest', 'Popular', "Oldest"];
    const sortButtons = getSortButtons();
    sortButtons.forEach(button => {
        // Check if the button has an active or selected class (or attribute)
        if (button.classList.contains('selected') || button.getAttribute('aria-selected') === 'true') {
            currentGeneralSort  = button.textContent.trim();  // Get the text of the active button
        }});
    sortOrders.forEach( async sortOrder => {
        console.log(sortOrder, currentGeneralSort);
        if (sortOrder === currentGeneralSort) {
            const index = sortOrders.indexOf(sortOrder); // returns 2
            console.log(index); // Output: 2
            if (index === 0) {
                let button = sortButtons[1];
                button.click();
                await sleep(SCROLL_DELAY); 
                button = sortButtons[0];
                button.click();
            } else {
                let button = sortButtons[index -1];
                button.click();
                await sleep(SCROLL_DELAY); 
                button = sortButtons[index];
                button.click();
            }
        }

    }); 
}

// todo: can be more efficient
async function loadUntilTargetVideos(targetCount) {
    const videoContainer = document.querySelector('#contents');
    while (true) {
        const videos = Array.from(videoContainer.querySelectorAll('ytd-rich-item-renderer'));
        const videoCount = videos.length;
        console.log(`Total videos found: ${videoCount}`);

        if (videoCount >= targetCount) {
            console.log(`Reached ${targetCount} videos or more.`);
            break;
        }

        triggerYouTubeLoad();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to load videos
    }
}

function startVideoLoading() {
    chrome.storage.sync.get(['max_videos'], async (result) => {
        console.log('Max videos:', result.maxVideos);
        maxVideos = result.maxVideos || DEFAULT_MAX_VIDEOS; // Default to 120 if not set
    });
  }

async function toggleSort(order) {
    if (currentSortOrder === order) {
        console.log('Undoing sort');
        restoreOriginalOrder();
        currentSortOrder = null;
        revertToGeneralSortButton();
        if (activeButton) {
            activeButton.style.backgroundColor = '';
            activeButton.style.color = '';
            activeButton = null;
        }
        if (revertButton) {
            revertButton.remove();
        }
    } else {
        console.log('Sorting Videos by Duration:', order, "with Toggle Sort");
        if (!originalVideos) {
            saveOriginalOrder();
        }

        uiManager.showLoadingPopup();
        if (!currentSortOrder || (latestMax <= maxVideos)) {
            if (latestMax <= maxVideos) {
                revertToGeneralSortButton();
            }
            startVideoLoading();
            await sleep(SCROLL_DELAY);
            await loadUntilTargetVideos(maxVideos);
            await sleep(1000); 
            await sleep(250); 
            ScrollManager.scrollToSortButtons();
            await sleep(SCROLL_DELAY);
            latestMax = maxVideos

        }
        videoSorter.sortVideosByDuration(order);
        currentSortOrder = order;

        setTimeout(() => {
            uiManager.hideLoadingPopup();
        }, LOADING_DELAY);

        debouncedSort();

    }
}

function saveOriginalOrder() {
    console.log('Saving original order');
    const videoContainer = document.querySelector('#contents');
    if (!videoContainer) return;

    originalVideos = Array.from(videoContainer.querySelectorAll('ytd-rich-item-renderer'));
}

function restoreOriginalOrder() {
    console.log('Restoring original order');
    const videoContainer = document.querySelector('#contents');
    if (!videoContainer || !originalVideos) return;

    videoContainer.innerHTML = '';
    originalVideos.forEach(video => videoContainer.appendChild(video));

}

class ScrollManager {
    static reenableScrolling() {
        document.body.style.overflow = '';
    }

    static scrollToSortButtons() {
        const targetElement = document.querySelector('#chips');
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            setTimeout(() => {
                window.scrollBy(0, -110);
            }, 250);
        } else {
            console.log('Element not found');
        }
    }
}

function debounce(func, wait) {
    console.log('Debouncing');
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedSort = debounce(() => {
    // if (!isLoadingVideos) { // Check the loading flag
    console.log('Debounced Sorting');
    if (currentSortOrder) {
        videoSorter.sortVideosByDuration(currentSortOrder);
    }
    // }
}, 500);

function observePageChanges() {
    const observer = new MutationObserver(() => {
        // Use a debounced version of addSortButtons
        debouncedAddButtons();
    });

    // More specific targeting of what to observe
    const targetNode = document.querySelector('#content');
    if (targetNode) {
        observer.observe(targetNode, { 
            childList: true, 
            subtree: true,
            attributes: false, // Don't observe attribute changes
            characterData: false // Don't observe text changes
        });
    }
}

const debouncedAddButtons = debounce(() => {
    buttonManager.addSortButtons();
}, 250);

const uiManager = new UIManager();
const videoSorter = new VideoSorter();
const buttonManager = new ButtonManager();


buttonManager.addSortButtons();
observePageChanges();

// tiny changes
// make modules , applying separation of concerns

// later
// alrightm efficiency
// error handling
// making it look end to edn and production level 
// documentaion
// I don't know enough to make it a full end to end project, like things like security
    // best practices
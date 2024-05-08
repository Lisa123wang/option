//login
chrome.storage.local.get('userEmail', (result) => {
    if (!result.userEmail) {
        chrome.runtime.openOptionsPage();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    
    document.getElementById('loginForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        fetch('https://roughly-suitable-polliwog.ngrok-free.app/YTplugin/openai-chatgpt-chrome-extension-main/login.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                // Update to use the appropriate user detail, assuming 'email' here as an example
                //document.getElementById('message').textContent = `Welcome ${data.user.email}!`;

                // Save the email to Chrome storage
                chrome.storage.local.set({'userEmail': data.user.email}, function() {
                    alert('Login sucesss, can use extension now.');
                });
            } else {
                alert('Account or password not correct');
                //document.getElementById('message').textContent = data.message;  // Display the error message
            }
        })
        .catch(error => {
            alert('Error:', error);
            document.getElementById('message').textContent = 'Login failed: ' + error.message;  // Display error in the div element
        });
    });
});




'use strict';

var activePBRButton;
var screenshotKey = false;
var playbackSpeedButtons = false;
var screenshotFunctionality = 0;
var screenshotFormat = "png";
var extension = 'png';




function formatTime(timeInSeconds) {
	const pad = (num) => (num < 10 ? '0' : '') + num;
	let hours = Math.floor(timeInSeconds / 3600);
	let minutes = Math.floor((timeInSeconds % 3600) / 60);
	let seconds = Math.floor(timeInSeconds % 60);

	return `${pad(hours)}-${pad(minutes)}-${pad(seconds)}`;
}



function CaptureScreenshot() {
    chrome.storage.local.get('userEmail', (result) => {
        if (!result.userEmail) {
            alert("User is not logged in. Please login first to take a screenshot.");
            chrome.runtime.sendMessage({ action: "openOptionsPage" });
            return;
        }
    
        fetch('https://roughly-suitable-polliwog.ngrok-free.app/YTplugin/openai-chatgpt-chrome-extension-main/server/getUserID.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userEmail: result.userEmail })
        })
        .then(response => response.json())
        .then(data => {
            let userID = data.userID;
    
            var player = document.querySelector('video');
            if (!player) {
                console.log("No video player found.");
                return;
            }
    
            updateScreenshotContainer(); // Prepare or ensure the container is ready.
    
            var canvas = document.createElement('canvas');
            canvas.width = player.videoWidth;
            canvas.height = player.videoHeight;
            var ctx = canvas.getContext('2d');
    
            ctx.fillStyle = '#FFFFFF'; // White background.
            ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas.
            ctx.drawImage(player, 0, 0, canvas.width, canvas.height); // Draw the video frame onto the canvas.
    
            var dataURL = canvas.toDataURL('image/png');
            var base64Data = dataURL.replace(/^data:image\/\w+;base64,/, "");
            var container = document.getElementById('customScreenshotContainer');
            var imgWrapper = document.createElement('div');
            imgWrapper.style.marginBottom = '20px';
            container.appendChild(imgWrapper);
    
            var currentTime = formatTime(player.currentTime);
            var formattedTime = Math.floor(player.currentTime);
    
            var timeText = document.createElement('a');
            timeText.href = '#';
            timeText.innerText = "Time: " + currentTime;
            timeText.style.color = 'white';
            timeText.style.textAlign = 'left';
            imgWrapper.appendChild(timeText);
    
            timeText.addEventListener('click', function(event) {
                event.preventDefault();
                player.currentTime = formattedTime;
            });
    
            var img = new Image();
            img.src = "data:image/png;base64," + base64Data;
            img.style.maxWidth = '100%';
            img.style.display = 'block';
            img.style.cursor = 'pointer';
            imgWrapper.appendChild(img);
    
            canvas.toBlob(function(blob) {
                var formData = new FormData();
                formData.append('image', blob, 'screenshot.png');
    
                fetch('https://roughly-suitable-polliwog.ngrok-free.app/YTplugin/openai-chatgpt-chrome-extension-main/upload.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.text())
                .then(imageUrl => {
                    var imageUrlDisplay = document.createElement('p');
                    imageUrlDisplay.innerText = "Image URL: " + imageUrl;
                    imageUrlDisplay.style.color = 'white';
                    imgWrapper.appendChild(imageUrlDisplay);
    
                    return imageUrl;
                })
                .then(imageUrl => {
                    const promises = [
                        fetch('https://roughly-suitable-polliwog.ngrok-free.app/YTplugin/openai-chatgpt-chrome-extension-main/imageToText.php', {
                            method: 'POST',
                            body: JSON.stringify({imageUrl: imageUrl}),
                            headers: {'Content-Type': 'application/json'}
                        }).then(response => response.text()),
    
                        fetch('https://roughly-suitable-polliwog.ngrok-free.app/YTplugin/openai-chatgpt-chrome-extension-main/imageCaption.php', {
                            method: 'POST',
                            body: JSON.stringify({imageUrl: imageUrl}),
                            headers: {'Content-Type': 'application/json'}
                        }).then(response => response.text()),
    
                        fetch('https://roughly-suitable-polliwog.ngrok-free.app/YTplugin/openai-chatgpt-chrome-extension-main/imageExercise.php', {
                            method: 'POST',
                            body: JSON.stringify({imageUrl: imageUrl}),
                            headers: {'Content-Type': 'application/json'}
                        }).then(response => response.text()),
    
                        fetch('https://roughly-suitable-polliwog.ngrok-free.app/YTplugin/openai-chatgpt-chrome-extension-main/imageLabel.php', {
                            method: 'POST',
                            body: JSON.stringify({imageUrl: imageUrl}),
                            headers: {'Content-Type': 'application/json'}
                        }).then(response => response.text())
                    ];
    
                    return Promise.all(promises);
                })
                .then(([textResponse, captionResponse, imageExerciseResponse, imageCategoryResponse]) => {
                    const textApiResponseDisplay = document.createElement('div');
                    textApiResponseDisplay.innerText = "Text Detection \n: " + textResponse;
                    textApiResponseDisplay.style.color = 'white';
                    imgWrapper.appendChild(textApiResponseDisplay);
    
                    const captionApiResponseDisplay = document.createElement('div');
                    captionApiResponseDisplay.innerText = "Image Caption \n: " + captionResponse;
                    captionApiResponseDisplay.style.color = 'yellow';
                    imgWrapper.appendChild(captionApiResponseDisplay);
    
                    const imageExerciseApiResponseDisplay = document.createElement('div');
                    imageExerciseApiResponseDisplay.innerText = "Image Exercise \n: " + imageExerciseResponse;
                    imageExerciseApiResponseDisplay.style.color = 'lightgreen';
                    imgWrapper.appendChild(imageExerciseApiResponseDisplay);
    
                    const imageCategoryApiResponseDisplay = document.createElement('div');
                    imageCategoryApiResponseDisplay.innerText = "Image Label \n: " + imageCategoryResponse;
                    imageCategoryApiResponseDisplay.style.color = 'pink';
                    imgWrapper.appendChild(imageCategoryApiResponseDisplay);
    
                    // Aggregating video and image analysis data
                    const videodata = {
                        videoTitle: getVideoTitle(), // Assuming getVideoTitle() fetches video title
                        videoUrl: window.location.href,
                        currentTime: currentTime,
                        textDetection: textResponse,
                        imageCaption: captionResponse,
                        exercise: imageExerciseResponse,
                        label: imageCategoryResponse,
                        userID: userID // Include the userID in the data being sent
                    };
    
                    // Send aggregated data to another HTTP PHP server
                    fetch('https://roughly-suitable-polliwog.ngrok-free.app/YTplugin/openai-chatgpt-chrome-extension-main/server/save_imagerecognition.php', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(videodata)
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Data sent to server and processed:', data);
                    })
                    .catch(error => {
                        console.error('Failed to send data to the server:', error);
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    var responseText = document.createElement('p');
                    responseText.innerText = 'Process failed: ' + error.message;
                    responseText.style.color = 'red';
                    imgWrapper.appendChild(responseText);
                });
            }, 'image/png');
        })
        .catch(error => {
            console.error('Failed to fetch userID:', error);
        });
    });
}    





function updateScreenshotContainer() {
    const API_KEY = 'AIzaSyAtsBif-ZM6Jpgx1ld04fxYbI9MGnvqBvY'; // Replace with your actual YouTube Data API v3 key
    const target = document.getElementById('secondary');
    if (!target) {
        console.error("YouTube secondary column not found.");
        return;
    }

    let container = document.getElementById('customScreenshotContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'customScreenshotContainer';
        container.style.cssText = 'max-width: 500px; margin-top: 16px; border: 2px solid #FFF; padding: 10px; box-sizing: border-box;';
        container.setAttribute('tabindex', '-1');
        container.setAttribute('aria-live', 'polite');
        target.insertBefore(container, target.firstChild);
    }

    chrome.storage.local.get('userEmail', function(data) {
        const userEmail = data.userEmail;
        fetch('https://roughly-suitable-polliwog.ngrok-free.app/YTplugin/openai-chatgpt-chrome-extension-main/server/getUserID.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userEmail })
        })
        .then(response => response.json())
        .then(data => {
            const userID = data.userID;
            // Update user info
            let emailElement = container.querySelector('#userEmail');
            if (!emailElement) {
                emailElement = document.createElement('p');
                emailElement.id = 'userEmail';
                emailElement.style.color = 'white';
                emailElement.textContent = `Email: ${userEmail}`;
                container.insertBefore(emailElement, container.firstChild);
            }

            let userIDElement = container.querySelector('#userID');
            if (!userIDElement) {
                userIDElement = document.createElement('p');
                userIDElement.id = 'userID';
                userIDElement.style.color = 'white';
                userIDElement.textContent = `User ID: ${userID}`;
                container.insertBefore(userIDElement, emailElement.nextSibling);
            } else {
                userIDElement.textContent = `User ID: ${userID}`;
            }

            let logoutButton = document.getElementById('logoutButton');
            if (!logoutButton) {
                logoutButton = document.createElement('button');
                logoutButton.id = 'logoutButton';
                logoutButton.textContent = 'Log Out';
                logoutButton.style.marginLeft = '10px';
                logoutButton.onclick = function() {
                    chrome.storage.local.remove('userEmail', function() {
                        alert('Logged out successfully.');
                        location.reload(); // Refresh the page to update UI state
                    });
                };
                emailElement.appendChild(logoutButton);
            }

            // Fetch video details
            const videoID = getYouTubeVideoId();
            const videoTitle = getVideoTitle();
            fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoID}&key=${API_KEY}&part=snippet`)
                .then(response => response.json())
                .then(data => {
                    const videoDescription = data.items.length > 0 ? data.items[0].snippet.description : "No description available.";
                    const url = window.location.href;
                    updateElement(container, 'videoTitle', 'h3', videoTitle, 'white');
                    updateElement(container, 'videoUrl', 'p', url, 'cyan');
                    updateElement(container, 'videoSummary', 'p', videoDescription, 'grey');
                    
                    // Capture and store data
                    let player = document.querySelector('video');
                    if (!player) {
                        console.error("No video player found.");
                        return;
                    }

                    let canvas = document.createElement('canvas');
                    canvas.width = player.videoWidth;
                    canvas.height = player.videoHeight;
                    let ctx = canvas.getContext('2d');
                    ctx.drawImage(player, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(function(blob) {
                        let formData = new FormData();
                        formData.append('image', blob, 'screenshot.png');
                        formData.append('videoTitle', videoTitle);
                        formData.append('videoURL', url);
                        formData.append('videoSummary', videoDescription);
                        formData.append('tags', ''); // Assuming tags is an empty string for now
                        formData.append('duration', Math.floor(player.duration));
                        formData.append('userID', userID);
                        
                        fetch('https://roughly-suitable-polliwog.ngrok-free.app/YTplugin/openai-chatgpt-chrome-extension-main/server/save_video.php', {
                            method: 'POST',
                            body: formData
                        })
                        .then(response => response.text())
                        .then(data => {
                            console.log('Screenshot and video data uploaded:', data);
                        })
                        .catch(error => {
                            console.error('Failed to upload data:', error);
                        });
                    }, 'image/png');

                    // Get video list from current channel
                    getVideoListFromCurrentChannel(API_KEY, videoID)
                        .then(videos => {
                            const videoListText = videos.map(video => video.snippet.title).join(", ");
                            updateElement(container, 'videoList', 'p', `Other videos: ${videoListText}`, 'lightgreen');
                            saveVideoList(userID, videos);
                        });
                })
                .catch(error => {
                    console.error('Failed to fetch video description:', error);
                });
        })
        .catch(error => console.error('Error:', error));
    });

    function getYouTubeVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    }

    function getVideoTitle() {
        var title;
        var headerEls = document.querySelectorAll("h1.title.ytd-video-primary-info-renderer");
    
        function SetTitle() {
            if (headerEls.length > 0) {
                title = headerEls[0].innerText.trim();
                return true;
            } else {
                return false;
            }
        }
    
        if (!SetTitle()) {
            headerEls = document.querySelectorAll("h1.watch-title-container");
    
            if (!SetTitle()) title = "Video Screenshot"; // Fallback title if none is found
        }
    
        return title;
    }

    function getVideoListFromCurrentChannel(apiKey, videoId) {
        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

        return fetch(videoDetailsUrl)
            .then(response => response.json())
            .then(data => {
                const channelId = data.items[0].snippet.channelId;
                const listUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=3&type=video`;
                return fetch(listUrl);
            })
            .then(response => response.json())
            .then(data => data.items) // This will be the list of videos
            .catch(error => console.error('Failed to fetch video list:', error));
    }

    

    function updateElement(container, id, tagName, textContent, color) {
        let element = container.querySelector(`#${id}`);
        if (!element) {
            element = document.createElement(tagName);
            element.id = id;
            element.style.color = color;
            container.appendChild(element);
        }
        element.textContent = textContent;
    }
}





function getVideoListFromCurrentChannel(apiKey, videoId) {
    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

    return fetch(videoDetailsUrl)
        .then(response => response.json())
        .then(data => {
            const channelId = data.items[0].snippet.channelId;
            const listUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=3&type=video`;
            return fetch(listUrl);
        })
        .then(response => response.json())
        .then(data => data.items) // This will be the list of videos
        .catch(error => console.error('Failed to fetch video list:', error));
}

// Define getYouTubeVideoId and getVideoTitle based on how you plan to retrieve them
// Placeholder functions:
function getYouTubeVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
}


// Call the main function to execute the script
updateScreenshotContainer();

// Keyboard shortcut to focus on the customScreenshotContainer for screen readers
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyS') {
        let container = document.getElementById('customScreenshotContainer');
        if (container) {
            container.focus(); // Focus the container
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
});

function getVideoTitle() {
	var title;
	var headerEls = document.querySelectorAll("h1.title.ytd-video-primary-info-renderer");

	function SetTitle() {
		if (headerEls.length > 0) {
			title = headerEls[0].innerText.trim();
			return true;
		} else {
			return false;
		}
	}

	if (!SetTitle()) {
		headerEls = document.querySelectorAll("h1.watch-title-container");

		if (!SetTitle()) title = "Video Screenshot"; // Fallback title if none is found
	}

	return title;
}





function AddScreenshotButton() {
	var ytpRightControls = document.getElementsByClassName("ytp-right-controls")[0];
	if (ytpRightControls) {
		ytpRightControls.prepend(screenshotButton);
	}

	chrome.storage.sync.get('playbackSpeedButtons', function(result) {
		if (result.playbackSpeedButtons) {
			ytpRightControls.prepend(speed3xButton);
			ytpRightControls.prepend(speed25xButton);
			ytpRightControls.prepend(speed2xButton);
			ytpRightControls.prepend(speed15xButton);
			ytpRightControls.prepend(speed1xButton);

			var playbackRate = document.getElementsByTagName('video')[0].playbackRate;
			switch (playbackRate) {
				case 1:
					speed1xButton.classList.add('SYTactive');
					activePBRButton = speed1xButton;
					break;
				case 2:
					speed2xButton.classList.add('SYTactive');
					activePBRButton = speed2xButton;
					break;
				case 2.5:
					speed25xButton.classList.add('SYTactive');
					activePBRButton = speed25xButton;
					break;
				case 3:
					speed3xButton.classList.add('SYTactive');
					activePBRButton = speed3xButton;
					break;
			}
		}
	});
}
// Initialize playback speed buttons and add them to the interface...

chrome.storage.sync.get(['screenshotKey', 'playbackSpeedButtons', 'screenshotFunctionality', 'screenshotFileFormat'], function (result) {
	screenshotKey = result.screenshotKey;
	playbackSpeedButtons = result.playbackSpeedButtons;
	screenshotFormat = result.screenshotFileFormat || 'png';
	screenshotFunctionality = result.screenshotFunctionality || 0;
	extension = screenshotFormat === 'jpeg' ? 'jpg' : screenshotFormat;
});

document.addEventListener('keydown', function (e) {
	// Key event listeners for playback speed adjustments and screenshot capture...
	// Check if Ctrl is pressed and the key is '6'
	if (e.ctrlKey && e.key === '6') {
		CaptureScreenshot();
		e.preventDefault(); // Prevent the default action of the key press
	}
});
var screenshotButton = document.createElement("button");
screenshotButton.className = "screenshotButton ytp-button";
screenshotButton.style.width = "auto";
screenshotButton.innerHTML = "Screenshot";
screenshotButton.style.cssFloat = "left";
screenshotButton.onclick = CaptureScreenshot;



chrome.storage.sync.get(['screenshotKey', 'playbackSpeedButtons', 'screenshotFunctionality', 'screenshotFileFormat'], function(result) {
	screenshotKey = result.screenshotKey;
	playbackSpeedButtons = result.playbackSpeedButtons;
	if (result.screenshotFileFormat === undefined) {
		screenshotFormat = 'png'
	} else {
		screenshotFormat = result.screenshotFileFormat
	}

	if (result.screenshotFunctionality === undefined) {
		screenshotFunctionality = 0;
	} else {
    	screenshotFunctionality = result.screenshotFunctionality;
	}

	if (screenshotFormat === 'jpeg') {
		extension = 'jpg';
	} else {
		extension = screenshotFormat;
	}
});

document.addEventListener('keydown', function(e) {
	if (document.activeElement.contentEditable === 'true' || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.contentEditable === 'plaintext')
		return true;

	if (playbackSpeedButtons) {
		switch (e.key) {
			case 'q':
				speed1xButton.click();
				e.preventDefault();
				return false;
			case 's':
				speed15xButton.click();
				e.preventDefault();
				return false;
			case 'w':
				speed2xButton.click();
				e.preventDefault();
				return false;
			case 'e':
				speed25xButton.click();
				e.preventDefault();
				return false;
			case 'r':
				speed3xButton.click();
				e.preventDefault();
				return false;
		}
	}

	if (screenshotKey && e.key === 'p') {
		CaptureScreenshot();
		e.preventDefault();
		return false;
	}
});

AddScreenshotButton();

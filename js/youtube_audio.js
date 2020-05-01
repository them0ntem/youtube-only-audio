chrome.runtime.sendMessage('enable-youtube-audio');

let makeSetAudioURL = function (videoElement, url) {
    if (videoElement.src !== url) {
        let paused = videoElement.paused;
        videoElement.src = url;
        if (paused === false) {
            videoElement.play();
        }
    }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "curr_time") {
        let ytPlayer = document.getElementsByClassName("video-stream")[0];
        let time = ytPlayer.currentTime;
        sendResponse({"time": ~~time});
        return;
    }

    let url = request.url;
    let videoElement = document.getElementsByTagName('video')[0];
    videoElement.onloadeddata = makeSetAudioURL(videoElement, url);

    let audioOnlyDivs = document.getElementsByClassName('audio_only_div');
    // Append alert text
    if (audioOnlyDivs.length === 0 && url.includes('mime=audio')) {
        let extensionAlert = document.createElement('div');
        extensionAlert.className = 'audio_only_div';

        let alertText = document.createElement('p');
        alertText.className = 'alert_text';
        alertText.innerHTML =
            'Youtube Audio Extension is running. It disables the video stream and uses only the audio stream' +
            ' which saves battery life and bandwidth / data when you just want to listen to just songs. If you want to watch' +
            ' video also, click on the extension icon and refresh your page.';

        extensionAlert.appendChild(alertText);
        let parent = videoElement.parentNode.parentNode;

        // Append alert only if options specify to do so
        chrome.storage.local.get('disable_video_text', function (values) {
            let disableVideoText = (!!values.disable_video_text);
            if (!disableVideoText &&
                parent.getElementsByClassName("audio_only_div").length === 0)
                parent.appendChild(extensionAlert);
        });
    } else if (url === "") {
        for (let div in audioOnlyDivs) {
            div.parentNode.removeChild(div);
        }
    }
});

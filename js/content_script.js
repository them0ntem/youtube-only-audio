const makeSetAudioURL = (videoElement, url) => {
    if (videoElement.src !== url) {
        videoElement.src = url;
    }
};

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "curr_time") {
        let ytPlayer = document.getElementsByClassName("video-stream")[0];
        sendResponse({
            time: ~~ytPlayer.currentTime,
        });

        return;
    }

    let videoElement = document.getElementsByTagName('video')[0];
    videoElement.onloadeddata = makeSetAudioURL(videoElement, request.url, request.paused);

    // append alert text
    let audioOnlyDivs = document.getElementsByClassName('audio_only_div');
    browser.storage.local.get('disable_video_text').then(values => {
        let disableVideoText = (!!values.disable_video_text);
        if (!disableVideoText && audioOnlyDivs.length === 0 && request.url.includes('mime=audio')) {
            let extensionAlert = document.createElement('div');
            extensionAlert.className = 'audio_only_div';

            let alertText = document.createElement('p');
            alertText.className = 'alert_text';
            alertText.innerHTML =
                'Youtube Audio Extension is running. It disables the video stream and uses only the audio stream' +
                ' which saves battery life and bandwidth / data when you just want to listen to just songs. If you want to watch' +
                ' video also, click on the extension icon and refresh your page.';

            extensionAlert.appendChild(alertText);
            videoElement.parentNode.parentNode.appendChild(extensionAlert);
        }
    });

    if (request.url === "") {
        for (let div in audioOnlyDivs) {
            div.parentNode.removeChild(div);
        }
    }
});

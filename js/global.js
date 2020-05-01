const tabIds = new Set();

function removeURLParameters(url, parameters) {
    parameters.forEach(function (parameter) {
        let urlParts = url.split('?');
        if (urlParts.length >= 2) {
            let prefix = encodeURIComponent(parameter) + '=';
            let pars = urlParts[1].split(/[&;]/g);

            for (let i = pars.length; i-- > 0;) {
                if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                    pars.splice(i, 1);
                }
            }

            url = urlParts[0] + '?' + pars.join('&');
        }
    });
    return url;
}

function reloadTab() {
    for (const tabId of tabIds) {
        chrome.tabs.get(tabId, function (tab) {
            if (tab.active) {
                chrome.tabs.sendMessage(tabId, {action: "curr_time"}, (resp) => {
                    let url = removeURLParameters(tab.url, ['t'])
                    url = url + "&t=" + resp.time;
                    let urlUpdate = chrome.tabs.update(
                        tabId,
                        {url: url},
                    );
                    urlUpdate.then(
                        () => {
                        },
                        (error) => {
                            console.error(`Tab update failed. ${error}`)
                        },
                    );

                    chrome.tabs.reload(tabId);
                });
            }
        });
    }
}

function processRequest(details) {
    if (!tabIds.has(details.tabId)) {
        return;
    }

    if (details.url.indexOf('mime=audio') !== -1 &&
        !details.url.includes('live=1')) {
        let parametersToBeRemoved = ['range', 'rn', 'rbuf'];
        let audioURL = removeURLParameters(details.url, parametersToBeRemoved);
        chrome.tabs.sendMessage(details.tabId, {url: audioURL});
    }
}

function enableExtension() {
    chrome.browserAction.setIcon(
        {path: {128: "img/icon128.png", 38: "img/icon38.png"}});
    chrome.webRequest.onBeforeRequest.addListener(
        processRequest, {urls: ["<all_urls>"]}, ["blocking"]);
}

function disableExtension() {
    chrome.browserAction.setIcon({
        path: {
            38: "img/disabled_icon38.png",
        }
    });
    chrome.webRequest.onBeforeRequest.removeListener(processRequest);
}

function saveSettings(currentState) {
    chrome.storage.local.set({'youtube_audio_state': currentState});
}

chrome.browserAction.onClicked.addListener(function () {
    chrome.storage.local.get('youtube_audio_state', function (values) {
        let currentState = values.youtube_audio_state;
        let newState = !currentState;

        if (newState) {
            enableExtension();
        } else {
            disableExtension();
        }

        saveSettings(newState);
        reloadTab();
    });
});

chrome.storage.local.get('youtube_audio_state', function (values) {
    let currentState = values.youtube_audio_state;
    if (typeof currentState === "undefined") {
        currentState = true;
        saveSettings(currentState);
    }

    if (currentState) {
        enableExtension();
    } else {
        disableExtension();
    }
});

chrome.runtime.onMessage.addListener(
    (message, sender) => {
        console.log(message, sender);
        tabIds.add(sender.tab.id);
    },
);

chrome.tabs.onRemoved.addListener(
    (tabId) => {
        tabIds.delete(tabId);
    },
);

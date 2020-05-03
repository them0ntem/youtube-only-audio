const tabIds = new Map();

const removeURLParameters = (addr, parameters) => {
    let url = new URL(addr);
    for (let param of parameters) {
        url.searchParams.delete(param)
    }

    return url.toString();
}

const addURLParameters = (addr, parameters) => {
    let url = new URL(addr);
    for (let {name, value} of parameters) {
        url.searchParams.append(name, value)
    }

    return url.toString();
}

const reloadTab = tab => {
    browser.tabs.sendMessage(tab.id, {action: "curr_time"}).then(resp => {
        let url = removeURLParameters(tab.url, ['t']);
        url = addURLParameters(url, [
            {name: "t", value: resp.time},
        ])

        browser.tabs.update(
            tab.id,
            {url: url},
        ).then(
            () => undefined,
            (error) => {
                console.error(`tab update failed: ${error}`)
            },
        );

    });
};

const addListener = () => {
    browser.webRequest.onBeforeRequest.addListener(
        processRequest,
        {urls: ["*://*.googlevideo.com/*",]},
        ["blocking"],
    );
};

const processRequest = details => {
    if (!tabIds.has(details.tabId)) {
        return;
    }

    if (details.url.indexOf('mime=audio') !== -1 && !details.url.includes('live=1')) {
        let parametersToBeRemoved = ['range', 'rn', 'rbuf'];
        let audioURL = removeURLParameters(details.url, parametersToBeRemoved);
        browser.tabs.sendMessage(details.tabId, {url: audioURL}).then(() => undefined);
    }
};


const setTitleAndIcon = (tabId, setEnabled) => {
    let title = setEnabled ? "Youtube Audio" : "Youtube Audio - Disabled"
    let iconPath = setEnabled ? "img/icon38.png" : "img/disabled_icon38.png"

    browser.pageAction.setIcon({
        tabId: tabId, path: iconPath
    }).then(() => undefined);

    browser.pageAction.setTitle({
        tabId: tabId,
        title: title,
    })
}

browser.pageAction.onClicked.addListener(tab => {
    browser.pageAction.getTitle({
        tabId: tab.id
    }).then(title => {
        if (title === "Youtube Audio") {
            setTitleAndIcon(tab.id, false);
            tabIds.delete(tab.id);
        } else {
            setTitleAndIcon(tab.id, true);
            tabIds.set(tab.id, true);
        }
    });

    reloadTab(tab);
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "loading" && tabIds.get(tabId)) {
        setTitleAndIcon(tabId, true);
        if (!browser.webRequest.onBeforeRequest.hasListener(processRequest)) {
            addListener();
        }
    }
}, {
    properties: ["status"],
    urls: ["*://*.youtube.com/*"],
});

browser.tabs.onRemoved.addListener(tabId => {
    tabIds.delete(tabId);
});

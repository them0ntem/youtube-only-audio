// Fetch references to the options' corresponding HTML elements
let disableVideoTextCheckbox = document.getElementById("disable-video-text");

// Initialize option elements (register listeners & set initial states)
if (disableVideoTextCheckbox) {
    // Register listeners
    disableVideoTextCheckbox.addEventListener("change", optionChanged);

    // Set states
    browser.storage.local.get('disable_video_text').then(values => {
        disableVideoTextCheckbox.checked = (!!values.disable_video_text);
    });
}

// Save options as they're modified
function optionChanged() {
    browser.storage.local.set(
        {"disable_video_text": disableVideoTextCheckbox.checked}
        ).then(() => undefined);
}

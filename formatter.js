// formatter.js - Handles making messy/minified code readable

const formatBtn = document.getElementById('formatBtn');

formatBtn.addEventListener('click', () => {
    // Rely on global variables from script.js
    const activeFileName = document.getElementById('currentFileName').innerText;
    let code = outputArea.textContent;

    if (!code || code.includes('// Extracting code')) return;

    let formattedCode = code;
    const options = { indent_size: 4, space_in_empty_paren: true };

    // Format based on file extension
    try {
        if (activeFileName.endsWith('.html')) {
            formattedCode = html_beautify(code, options);
        } else if (activeFileName.endsWith('.css')) {
            formattedCode = css_beautify(code, options);
        } else if (activeFileName.endsWith('.js')) {
            formattedCode = js_beautify(code, options);
        }

        // Update the global state and the UI
        extractedFiles[activeFileName].content = formattedCode;
        outputArea.textContent = formattedCode;
        
        // Re-apply Prism.js syntax highlighting
        Prism.highlightElement(outputArea);
        
        // Visual feedback
        const originalText = formatBtn.innerHTML;
        formatBtn.innerHTML = `<span style="color:#4ade80">Formatted!</span>`;
        setTimeout(() => formatBtn.innerHTML = originalText, 1500);

    } catch (e) {
        console.error("Formatting failed:", e);
        alert("Could not format this file.");
    }
});

// Enable format button when a file is selected (intercepting selectFile logic)
const originalSelectFile = selectFile;
selectFile = function(fileName) {
    originalSelectFile(fileName);
    formatBtn.disabled = false;
};
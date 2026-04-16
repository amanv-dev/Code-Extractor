// preview.js - Handles the Live Render Sandbox

const tabCode = document.getElementById('tabCode');
const tabPreview = document.getElementById('tabPreview');
const viewPreview = document.getElementById('viewPreview');
const previewFrame = document.getElementById('previewFrame');

tabPreview.addEventListener('click', () => {
    // UI Toggle
    tabCode.classList.remove('active');
    tabCode.style.opacity = '0.7';
    tabPreview.classList.add('active');
    tabPreview.style.opacity = '1';
    
    document.getElementById('viewCode').classList.add('hidden');
    document.getElementById('viewImage').classList.add('hidden');
    viewPreview.classList.remove('hidden');

    // Compile Sandbox
    if (extractedFiles['index.html']) {
        let rawHtml = extractedFiles['index.html'].content;
        let compiledCss = "";
        let compiledJs = "";

        // Gather all CSS and JS
        Object.keys(extractedFiles).forEach(fileName => {
            if (extractedFiles[fileName].category === 'CSS') compiledCss += extractedFiles[fileName].content + "\n";
            if (extractedFiles[fileName].category === 'JavaScript') compiledJs += extractedFiles[fileName].content + "\n";
        });

        // Inject them into the head/body
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');
        
        const styleTag = doc.createElement('style');
        styleTag.innerHTML = compiledCss;
        doc.head.appendChild(styleTag);

        const scriptTag = doc.createElement('script');
        scriptTag.innerHTML = compiledJs;
        doc.body.appendChild(scriptTag);

        // Write to iframe
        previewFrame.srcdoc = doc.documentElement.outerHTML;
    } else {
        previewFrame.srcdoc = "<h3 style='font-family:sans-serif; color:#666; text-align:center; margin-top:50px;'>Extract a website first to preview it here.</h3>";
    }
});

tabCode.addEventListener('click', () => {
    // UI Toggle back to Code
    tabPreview.classList.remove('active');
    tabPreview.style.opacity = '0.7';
    tabCode.classList.add('active');
    tabCode.style.opacity = '1';
    
    viewPreview.classList.add('hidden');
    
    // Re-trigger select logic to show the correct file view
    const currentActiveFile = document.querySelector('.file-item.active');
    if (currentActiveFile) {
        selectFile(currentActiveFile.dataset.filename);
    } else {
        document.getElementById('viewCode').classList.remove('hidden');
    }
});
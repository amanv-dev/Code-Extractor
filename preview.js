const togglePreviewBtn = document.getElementById('togglePreviewBtn');
const viewPreview = document.getElementById('viewPreview');
const viewCode = document.getElementById('viewCode');
const viewImage = document.getElementById('viewImage');

window.isPreviewMode = false;

togglePreviewBtn.addEventListener('click', () => {
    window.isPreviewMode = !window.isPreviewMode;
    
    if (window.isPreviewMode) {
        togglePreviewBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Close Preview`;
        togglePreviewBtn.style.backgroundColor = '#3f3f46'; 
        
        viewCode.classList.add('hidden');
        viewImage.classList.add('hidden');
        viewPreview.classList.remove('hidden');

        if (extractedFiles['index.html']) {
            let rawHtml = extractedFiles['index.html'].content;
            let compiledCss = "";
            let compiledJs = "";

            Object.keys(extractedFiles).forEach(fileName => {
                if (extractedFiles[fileName].category === 'CSS') compiledCss += extractedFiles[fileName].content + "\n";
                if (extractedFiles[fileName].category === 'JavaScript') compiledJs += extractedFiles[fileName].content + "\n";
            });

            const parser = new DOMParser();
            const doc = parser.parseFromString(rawHtml, 'text/html');
            
            const styleTag = doc.createElement('style');
            styleTag.innerHTML = compiledCss;
            doc.head.appendChild(styleTag);

            const scriptTag = doc.createElement('script');
            scriptTag.innerHTML = compiledJs;
            doc.body.appendChild(scriptTag);

            document.getElementById('previewFrame').srcdoc = doc.documentElement.outerHTML;
        } else {
            document.getElementById('previewFrame').srcdoc = "<h3 style='font-family:sans-serif; color:#666; text-align:center; margin-top:50px;'>Extract an HTML file first to preview it here.</h3>";
        }

    } else {
        togglePreviewBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Preview Site`;
        togglePreviewBtn.style.backgroundColor = 'var(--accent)';
        
        viewPreview.classList.add('hidden');
        
        const currentActiveFile = document.querySelector('.file-item.active');
        if (currentActiveFile) {
            selectFile(currentActiveFile.dataset.filename);
        } else {
            viewCode.classList.remove('hidden');
        }
    }
});
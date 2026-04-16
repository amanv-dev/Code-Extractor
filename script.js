// script.js - Core Extraction & State

const urlInput = document.getElementById('websiteUrl');
const fetchBtn = document.getElementById('fetchBtn');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const outputArea = document.getElementById('outputArea');
const copyBtn = document.getElementById('copyBtn');
const fileTree = document.getElementById('fileTree');
const currentFileName = document.getElementById('currentFileName');

// View Containers
const viewCode = document.getElementById('viewCode');
const viewImage = document.getElementById('viewImage');
const imagePreview = document.getElementById('imagePreview');

let extractedFiles = {};

function formatUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) return 'https://' + url;
    return url;
}

async function fetchViaProxy(targetUrl) {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
}

function resolveUrl(baseUrl, relativeUrl) {
    try { return new URL(relativeUrl, baseUrl).href; } catch (e) { return null; }
}

fetchBtn.addEventListener('click', async () => {
    let baseUrl = urlInput.value.trim();
    if (!baseUrl) return alert("Please enter a valid URL.");
    baseUrl = formatUrl(baseUrl);

    fetchBtn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'block';
    extractedFiles = {};
    
    fileTree.innerHTML = `<div class="empty-state">Extracting Code & Media...</div>`;
    
    try {
        const htmlContent = await fetchViaProxy(baseUrl);
        extractedFiles['index.html'] = { category: 'HTML', content: htmlContent, type: 'code' };

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Extract CSS
        const cssLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href')).filter(h => h);
        for (let href of cssLinks) {
            const fullUrl = resolveUrl(baseUrl, href);
            if (fullUrl) {
                try {
                    const cssContent = await fetchViaProxy(fullUrl);
                    let fileName = fullUrl.split('/').pop().split('?')[0] || 'style.css';
                    if (!fileName.endsWith('.css')) fileName += '.css';
                    extractedFiles[fileName] = { category: 'CSS', content: cssContent, type: 'code' };
                } catch (e) {}
            }
        }

        // Extract JS
        const jsLinks = Array.from(doc.querySelectorAll('script[src]')).map(s => s.getAttribute('src')).filter(s => s);
        for (let src of jsLinks) {
            const fullUrl = resolveUrl(baseUrl, src);
            if (fullUrl) {
                try {
                    const jsContent = await fetchViaProxy(fullUrl);
                    let fileName = fullUrl.split('/').pop().split('?')[0] || 'script.js';
                    if (!fileName.endsWith('.js')) fileName += '.js';
                    extractedFiles[fileName] = { category: 'JavaScript', content: jsContent, type: 'code' };
                } catch (e) {}
            }
        }

        // --- NEW: Extract Images ---
        const imgTags = Array.from(doc.querySelectorAll('img')).map(img => img.getAttribute('src')).filter(src => src);
        for (let src of imgTags) {
            const fullUrl = resolveUrl(baseUrl, src);
            if (fullUrl) {
                let fileName = fullUrl.split('/').pop().split('?')[0];
                if(fileName) {
                    // We store the direct URL to avoid fetching large binary blobs right now
                    extractedFiles[fileName] = { category: 'Images', content: fullUrl, type: 'image' };
                }
            }
        }

        renderFileTree();
        selectFile('index.html');

    } catch (error) {
        fileTree.innerHTML = '<div class="empty-state">Extraction failed.</div>';
    } finally {
        fetchBtn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});

const icons = {
    folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
    html: `<svg class="file-icon icon-html" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l1.5 13.5L12 21l6.5-3.5L20 4H4zm11 5H8.5l-.3-3H17l-1 8h-3v-3h3l.4-2z"></path></svg>`,
    css: `<svg class="file-icon icon-css" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l1.5 13.5L12 21l6.5-3.5L20 4H4zm11 5H8.5l-.3-3H17l-1 8h-3v-3h3l.4-2z"></path></svg>`,
    js: `<svg class="file-icon icon-js" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l1.5 13.5L12 21l6.5-3.5L20 4H4zm11 5H8.5l-.3-3H17l-1 8h-3v-3h3l.4-2z"></path></svg>`,
    img: `<svg class="file-icon icon-img" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
};

function renderFileTree() {
    fileTree.innerHTML = '';
    const files = Object.keys(extractedFiles);
    
    const grouped = { HTML: [], CSS: [], JavaScript: [], Images: [] };
    files.forEach(f => {
        if(extractedFiles[f].category === 'Images') grouped.Images.push(f);
        else if(f.endsWith('.css')) grouped.CSS.push(f);
        else if(f.endsWith('.js')) grouped.JavaScript.push(f);
        else grouped.HTML.push(f);
    });

    Object.entries(grouped).forEach(([category, catFiles]) => {
        if (catFiles.length === 0) return;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'folder-group';
        groupDiv.innerHTML = `<div class="folder-title">${icons.folder} ${category}</div>`;

        catFiles.forEach(fileName => {
            const fileEl = document.createElement('div');
            fileEl.className = 'file-item';
            fileEl.dataset.filename = fileName;
            
            let icon = icons.html;
            if (category === 'CSS') icon = icons.css;
            if (category === 'JavaScript') icon = icons.js;
            if (category === 'Images') icon = icons.img;

            fileEl.innerHTML = `${icon} <span>${fileName}</span>`;
            fileEl.addEventListener('click', () => selectFile(fileName));
            groupDiv.appendChild(fileEl);
        });
        
        fileTree.appendChild(groupDiv);
    });
}

function selectFile(fileName) {
    if (!extractedFiles[fileName]) return;
    
    document.querySelectorAll('.file-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.filename === fileName) el.classList.add('active');
    });

    currentFileName.innerText = fileName;
    const fileData = extractedFiles[fileName];
    
    // UI Routing: Show code or image
    if (fileData.type === 'image') {
        viewCode.classList.add('hidden');
        viewImage.classList.remove('hidden');
        imagePreview.src = fileData.content;
        
        // Disable code buttons
        copyBtn.disabled = true;
        if(window.formatBtn) formatBtn.disabled = true;
    } else {
        viewImage.classList.add('hidden');
        viewCode.classList.remove('hidden');
        
        outputArea.textContent = fileData.content;
        let lang = 'markup'; 
        if (fileName.endsWith('.css')) lang = 'css';
        if (fileName.endsWith('.js')) lang = 'javascript';
        
        outputArea.className = `language-${lang}`;
        Prism.highlightElement(outputArea); 
        
        copyBtn.disabled = false;
        if(window.formatBtn) formatBtn.disabled = false;
    }
}

copyBtn.addEventListener('click', async () => {
    if (!outputArea.textContent) return;
    try {
        await navigator.clipboard.writeText(outputArea.textContent);
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `<span style="color:#4ade80">Copied!</span>`;
        setTimeout(() => copyBtn.innerHTML = originalHTML, 2000);
    } catch (err) {}
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchBtn.click();
});
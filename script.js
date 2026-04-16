const urlInput = document.getElementById('websiteUrl');
const fetchBtn = document.getElementById('fetchBtn');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const outputArea = document.getElementById('outputArea');
const copyBtn = document.getElementById('copyBtn');
const fileTree = document.getElementById('fileTree');
const currentFileName = document.getElementById('currentFileName');

let extractedFiles = {};

function formatUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
}

async function fetchViaProxy(targetUrl) {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
}

function resolveUrl(baseUrl, relativeUrl) {
    try {
        return new URL(relativeUrl, baseUrl).href;
    } catch (e) {
        return null;
    }
}

fetchBtn.addEventListener('click', async () => {
    let baseUrl = urlInput.value.trim();
    if (!baseUrl) return alert("Please enter a valid URL.");
    
    baseUrl = formatUrl(baseUrl);

    // UI Loading State
    fetchBtn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'block';
    extractedFiles = {};
    
    fileTree.innerHTML = `<div class="empty-state">
        <div class="loader" style="display:inline-block; border-top-color: var(--accent); border-right-color: var(--accent); margin-bottom: 10px;"></div>
        <br>Extracting assets...
    </div>`;
    
    outputArea.textContent = '// Extracting code, please wait...';
    outputArea.className = 'language-javascript';
    Prism.highlightElement(outputArea);
    copyBtn.disabled = true;

    try {
        // 1. Fetch the main HTML
        const htmlContent = await fetchViaProxy(baseUrl);
        extractedFiles['index.html'] = { category: 'HTML', content: htmlContent };

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // --- INLINE EXTRACTION ---
        const inlineStyles = Array.from(doc.querySelectorAll('style')).map(s => s.innerHTML.trim()).filter(t => t).join('\n\n');
        if (inlineStyles) extractedFiles['inline-styles.css'] = { category: 'CSS', content: inlineStyles };

        const inlineScripts = Array.from(doc.querySelectorAll('script:not([src])')).map(s => s.innerHTML.trim()).filter(t => t).join('\n\n');
        if (inlineScripts) extractedFiles['inline-scripts.js'] = { category: 'JavaScript', content: inlineScripts };

        // --- EXTERNAL EXTRACTION ---
        const cssLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
            .map(link => link.getAttribute('href')).filter(href => href);

        for (let href of cssLinks) {
            const fullUrl = resolveUrl(baseUrl, href);
            if (fullUrl) {
                try {
                    const cssContent = await fetchViaProxy(fullUrl);
                    let fileName = fullUrl.split('/').pop().split('?')[0] || 'style.css';
                    if (!fileName.endsWith('.css')) fileName += '.css';
                    extractedFiles[fileName] = { category: 'CSS', content: cssContent };
                } catch (e) { console.warn(`Failed to fetch CSS: ${fullUrl}`); }
            }
        }

        const jsLinks = Array.from(doc.querySelectorAll('script[src]'))
            .map(script => script.getAttribute('src')).filter(src => src);

        for (let src of jsLinks) {
            const fullUrl = resolveUrl(baseUrl, src);
            if (fullUrl) {
                try {
                    const jsContent = await fetchViaProxy(fullUrl);
                    let fileName = fullUrl.split('/').pop().split('?')[0] || 'script.js';
                    if (!fileName.endsWith('.js')) fileName += '.js';
                    extractedFiles[fileName] = { category: 'JavaScript', content: jsContent };
                } catch (e) { console.warn(`Failed to fetch JS: ${fullUrl}`); }
            }
        }

        renderFileTree();
        selectFile('index.html');

    } catch (error) {
        fileTree.innerHTML = '<div class="empty-state">Extraction failed.</div>';
        outputArea.textContent = `// Error fetching data.\n// The website might be blocking the proxy.\n\nError details: ${error.message}`;
        outputArea.className = 'language-javascript';
        Prism.highlightElement(outputArea);
    } finally {
        fetchBtn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});

// SVG Icons for file tree
const icons = {
    folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
    html: `<svg class="file-icon icon-html" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l1.5 13.5L12 21l6.5-3.5L20 4H4zm11 5H8.5l-.3-3H17l-1 8h-3v-3h3l.4-2z"></path></svg>`,
    css: `<svg class="file-icon icon-css" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l1.5 13.5L12 21l6.5-3.5L20 4H4zm11 5H8.5l-.3-3H17l-1 8h-3v-3h3l.4-2z"></path></svg>`,
    js: `<svg class="file-icon icon-js" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l1.5 13.5L12 21l6.5-3.5L20 4H4zm11 5H8.5l-.3-3H17l-1 8h-3v-3h3l.4-2z"></path></svg>`
};

function renderFileTree() {
    fileTree.innerHTML = '';
    const files = Object.keys(extractedFiles);
    if (files.length === 0) {
        fileTree.innerHTML = '<div class="empty-state">No files extracted yet.</div>';
        return;
    }

    // Group files by category
    const grouped = { HTML: [], CSS: [], JavaScript: [] };
    files.forEach(f => {
        if(f.endsWith('.css')) grouped.CSS.push(f);
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
    
    // Set text content and detect language for Prism
    outputArea.textContent = extractedFiles[fileName].content;
    let lang = 'markup'; // Default HTML
    if (fileName.endsWith('.css')) lang = 'css';
    if (fileName.endsWith('.js')) lang = 'javascript';
    
    outputArea.className = `language-${lang}`;
    Prism.highlightElement(outputArea); // Trigger syntax highlighting
    
    copyBtn.disabled = false;
}

copyBtn.addEventListener('click', async () => {
    // Copy the textContent (raw code) instead of value
    if (!outputArea.textContent) return;
    try {
        await navigator.clipboard.writeText(outputArea.textContent);
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span style="color:#4ade80">Copied!</span>`;
        
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
        }, 2000);
    } catch (err) {
        alert('Failed to copy. Please copy manually.');
    }
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchBtn.click();
});
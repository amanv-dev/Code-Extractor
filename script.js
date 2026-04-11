const urlInput = document.getElementById('websiteUrl');
const fetchBtn = document.getElementById('fetchBtn');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const outputArea = document.getElementById('outputArea');
const copyBtn = document.getElementById('copyBtn');
const fileTree = document.getElementById('fileTree');
const currentFileName = document.getElementById('currentFileName');

let extractedFiles = {};
let activeFileKey = null;

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

// Crucial: This converts relative paths (like 'style.css') into full URLs based on the target website
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
    fileTree.innerHTML = '<div class="empty-state">Extracting assets...</div>';
    outputArea.value = '';
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
        // Grab External CSS
        const cssLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
            .map(link => link.getAttribute('href'))
            .filter(href => href);

        for (let href of cssLinks) {
            const fullUrl = resolveUrl(baseUrl, href);
            if (fullUrl) {
                try {
                    const cssContent = await fetchViaProxy(fullUrl);
                    // Extract filename from URL, default to style.css if weird
                    let fileName = fullUrl.split('/').pop().split('?')[0] || 'style.css';
                    if (!fileName.endsWith('.css')) fileName += '.css';
                    extractedFiles[fileName] = { category: 'CSS', content: cssContent };
                } catch (e) {
                    console.warn(`Failed to fetch CSS: ${fullUrl}`);
                }
            }
        }

        // Grab External JS
        const jsLinks = Array.from(doc.querySelectorAll('script[src]'))
            .map(script => script.getAttribute('src'))
            .filter(src => src);

        for (let src of jsLinks) {
            const fullUrl = resolveUrl(baseUrl, src);
            if (fullUrl) {
                try {
                    const jsContent = await fetchViaProxy(fullUrl);
                    let fileName = fullUrl.split('/').pop().split('?')[0] || 'script.js';
                    if (!fileName.endsWith('.js')) fileName += '.js';
                    extractedFiles[fileName] = { category: 'JavaScript', content: jsContent };
                } catch (e) {
                    console.warn(`Failed to fetch JS: ${fullUrl}`);
                }
            }
        }

        // Update UI
        renderFileTree();
        selectFile('index.html');

    } catch (error) {
        fileTree.innerHTML = '<div class="empty-state">Extraction failed.</div>';
        outputArea.value = `// Error fetching data.\n// It's possible the website blocked the proxy.\n\nError details: ${error.message}`;
    } finally {
        fetchBtn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});

function renderFileTree() {
    fileTree.innerHTML = '';
    
    // Get all extracted file names
    const files = Object.keys(extractedFiles);

    // If no files, show empty state
    if (files.length === 0) {
        fileTree.innerHTML = '<div class="empty-state">No files extracted yet.</div>';
        return;
    }

    // Render a clean, flat list of files without category headers
    files.forEach(fileName => {
        const fileEl = document.createElement('div');
        fileEl.className = 'file-item';
        fileEl.innerText = fileName;
        fileEl.dataset.filename = fileName;
        
        fileEl.addEventListener('click', () => selectFile(fileName));
        fileTree.appendChild(fileEl);
    });
}

function selectFile(fileName) {
    if (!extractedFiles[fileName]) return;
    activeFileKey = fileName;
    
    document.querySelectorAll('.file-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.filename === fileName) el.classList.add('active');
    });

    currentFileName.innerText = fileName;
    outputArea.value = extractedFiles[fileName].content;
    copyBtn.disabled = false;
}

copyBtn.addEventListener('click', async () => {
    if (!outputArea.value) return;
    try {
        await navigator.clipboard.writeText(outputArea.value);
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        copyBtn.style.color = '#2f81f7';
        copyBtn.style.borderColor = '#2f81f7';
        
        setTimeout(() => {
            copyBtn.innerText = originalText;
            copyBtn.style.color = ''; 
            copyBtn.style.borderColor = '';
        }, 2000);
    } catch (err) {
        alert('Failed to copy. Please copy manually.');
    }
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchBtn.click();
});
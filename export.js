// export.js - Handles ZIP generation, now with images!

const downloadZipBtn = document.getElementById('downloadZipBtn');

downloadZipBtn.addEventListener('click', async () => {
    const files = Object.keys(extractedFiles);
    if (files.length === 0) return alert("No files to download.");

    downloadZipBtn.style.color = "var(--accent)";
    const zip = new JSZip();
    
    // We create an array of promises to fetch images asynchronously
    const fetchPromises = [];

    files.forEach(fileName => {
        const fileData = extractedFiles[fileName];
        
        if (fileData.type === 'code') {
            if (fileName.endsWith('.css')) zip.folder("css").file(fileName, fileData.content);
            else if (fileName.endsWith('.js')) zip.folder("js").file(fileName, fileData.content);
            else zip.file(fileName, fileData.content); // HTML
        } 
        else if (fileData.type === 'image') {
            // For images, we stored the URL. We must fetch it as a blob to ZIP it.
            const p = fetch(fileData.content)
                .then(res => res.blob())
                .then(blob => {
                    zip.folder("images").file(fileName, blob);
                })
                .catch(err => console.warn(`Could not zip image: ${fileName}`));
            fetchPromises.push(p);
        }
    });

    try {
        // Wait for all images to finish downloading
        await Promise.all(fetchPromises);
        
        const content = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        const url = URL.createObjectURL(content);
        a.href = url;
        a.download = "extracted-code.zip";
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            downloadZipBtn.style.color = ""; 
        }, 0);
    } catch (err) {
        alert("Failed to create ZIP file.");
    }
});
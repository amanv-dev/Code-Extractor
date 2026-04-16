// export.js - Handles packaging all extracted code into a downloadable ZIP

const downloadZipBtn = document.getElementById('downloadZipBtn');

downloadZipBtn.addEventListener('click', async () => {
    // 'extractedFiles' comes from script.js
    const files = Object.keys(extractedFiles);
    
    if (files.length === 0) {
        return alert("No files to download. Please extract a website first.");
    }

    // Visual feedback
    downloadZipBtn.style.color = "var(--accent)";

    // Create a new ZIP file instance
    const zip = new JSZip();
    
    // Group files into folders for a clean project structure
    files.forEach(fileName => {
        const fileContent = extractedFiles[fileName].content;
        
        if (fileName.endsWith('.css')) {
            zip.folder("css").file(fileName, fileContent);
        } else if (fileName.endsWith('.js')) {
            zip.folder("js").file(fileName, fileContent);
        } else {
            // Put HTML files in the root folder
            zip.file(fileName, fileContent);
        }
    });

    try {
        // Generate the ZIP file as a Blob
        const content = await zip.generateAsync({ type: "blob" });
        
        // Create a temporary link to trigger the download
        const a = document.createElement("a");
        const url = URL.createObjectURL(content);
        a.href = url;
        a.download = "extracted-code.zip";
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            downloadZipBtn.style.color = ""; // Reset icon color
        }, 0);
        
    } catch (err) {
        console.error("Error creating ZIP:", err);
        alert("Failed to create ZIP file.");
    }
});
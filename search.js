// search.js - Handles IDE-like In-Code Search

const searchContainer = document.getElementById('searchContainer');
const searchInput = document.getElementById('searchInput');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchMatchCount = document.getElementById('searchMatchCount');

// Listen for Cmd+F / Ctrl+F
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        // Only show if we are looking at code
        if (!document.getElementById('viewCode').classList.contains('hidden')) {
            e.preventDefault(); // Prevent browser search
            searchContainer.classList.remove('hidden');
            searchInput.focus();
        }
    }
    
    if (e.key === 'Escape') {
        closeSearch();
    }
});

closeSearchBtn.addEventListener('click', closeSearch);

function closeSearch() {
    searchContainer.classList.add('hidden');
    searchInput.value = '';
    searchMatchCount.innerText = '';
    // Clear browser selection
    window.getSelection().removeAllRanges();
}

// Basic Native Search Implementation
searchInput.addEventListener('input', () => {
    const term = searchInput.value;
    if (!term) {
        searchMatchCount.innerText = '';
        return;
    }

    // Reset selection to start from top
    window.getSelection().removeAllRanges();
    
    // window.find() highlights text naturally in the browser
    const found = window.find(term, false, false, true, false, false, false);
    
    if (found) {
        searchMatchCount.innerText = "Match found";
        searchMatchCount.style.color = "var(--text-muted)";
    } else {
        searchMatchCount.innerText = "0 matches";
        searchMatchCount.style.color = "#ef4444"; // Red
    }
});

// Allow hitting "Enter" to find next match
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        window.find(searchInput.value, false, false, true, false, false, false);
    }
});
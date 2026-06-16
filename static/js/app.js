// Application State
let state = {
    updates: [],
    filteredUpdates: [],
    selectedUpdate: null,
    currentFilter: 'all',
    searchQuery: '',
    currentTemplate: 'standard'
};

// SVG Circle Circumference for character limit progress ring
const CIRCLE_RADIUS = 10;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    refreshIcon: document.getElementById('refresh-icon'),
    lastUpdatedText: document.getElementById('last-updated-text'),
    
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    
    totalCount: document.getElementById('total-count'),
    filteredCount: document.getElementById('filtered-count'),
    
    feedLoading: document.getElementById('feed-loading'),
    feedError: document.getElementById('feed-error'),
    feedEmpty: document.getElementById('feed-empty'),
    feedContainer: document.getElementById('feed-container'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    
    tweetComposerCard: document.getElementById('tweet-composer-card'),
    tweetEmptyState: document.getElementById('tweet-empty-state'),
    tweetWorkspace: document.getElementById('tweet-workspace'),
    
    selectedBadge: document.getElementById('selected-badge'),
    selectedDate: document.getElementById('selected-date'),
    selectedSnippet: document.getElementById('selected-snippet'),
    
    templateChips: document.querySelectorAll('.template-chips .chip'),
    tweetTextInput: document.getElementById('tweet-text-input'),
    tweetUrlTitle: document.getElementById('preview-url-title'),
    
    charCount: document.getElementById('char-count'),
    progressCircle: document.querySelector('.progress-ring__circle'),
    sendTweetBtn: document.getElementById('send-tweet-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn')
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupProgressRing();
    fetchUpdates(false);
});

// Setup Progress Ring
function setupProgressRing() {
    if (elements.progressCircle) {
        elements.progressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
        elements.progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
    }
}

// Fetch release notes from Flask API
async function fetchUpdates(bypassCache = false) {
    showLoading();
    
    try {
        const response = await fetch(`/api/updates?refresh=${bypassCache}`);
        const data = await response.json();
        
        if (data.success) {
            state.updates = data.updates;
            elements.lastUpdatedText.textContent = `Last updated: ${data.last_updated}`;
            filterAndSearch();
        } else {
            showError(data.error || 'Server returned an error.');
        }
    } catch (err) {
        showError(err.message || 'Could not connect to Flask backend.');
    } finally {
        hideLoadingIcon();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Refresh button
    elements.refreshBtn.addEventListener('click', () => {
        elements.refreshIcon.classList.add('fa-spin-custom');
        fetchUpdates(true);
    });
    
    // Retry button (on error)
    elements.retryBtn.addEventListener('click', () => {
        fetchUpdates(true);
    });
    
    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        if (state.searchQuery) {
            elements.clearSearchBtn.style.display = 'block';
        } else {
            elements.clearSearchBtn.style.display = 'none';
        }
        filterAndSearch();
    });
    
    // Clear search
    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearchBtn.style.display = 'none';
        filterAndSearch();
    });
    
    // Filter Buttons
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter;
            filterAndSearch();
        });
    });
    
    // Reset filters (on empty state)
    elements.resetFiltersBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearchBtn.style.display = 'none';
        
        elements.filterButtons.forEach(btn => {
            if (btn.dataset.filter === 'all') btn.classList.add('active');
            else btn.classList.remove('active');
        });
        state.currentFilter = 'all';
        filterAndSearch();
    });
    
    // Template chips
    elements.templateChips.forEach(chip => {
        chip.addEventListener('click', () => {
            elements.templateChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.currentTemplate = chip.dataset.template;
            generateTweetDraft();
        });
    });
    
    // Tweet text input changes
    elements.tweetTextInput.addEventListener('input', () => {
        updateCharCounter();
    });
    
    // Tweet submit button
    elements.sendTweetBtn.addEventListener('click', () => {
        const text = elements.tweetTextInput.value;
        const encodedText = encodeURIComponent(text);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        window.open(twitterUrl, '_blank');
    });
    
    // Export to CSV button
    if (elements.exportCsvBtn) {
        elements.exportCsvBtn.addEventListener('click', exportToCsv);
    }
}

// Show/Hide Loading and States
function showLoading() {
    elements.feedLoading.style.display = 'flex';
    elements.feedError.style.display = 'none';
    elements.feedEmpty.style.display = 'none';
    elements.feedContainer.style.display = 'none';
}

function hideLoadingIcon() {
    elements.refreshIcon.classList.remove('fa-spin-custom');
}

function showError(msg) {
    elements.feedLoading.style.display = 'none';
    elements.feedError.style.display = 'flex';
    elements.feedEmpty.style.display = 'none';
    elements.feedContainer.style.display = 'none';
    elements.errorMessage.textContent = msg;
}

// Filter and Search logic
function filterAndSearch() {
    state.filteredUpdates = state.updates.filter(item => {
        // Filter by Type
        const matchesFilter = state.currentFilter === 'all' || item.type === state.currentFilter;
        
        // Filter by Search Query
        const matchesSearch = !state.searchQuery || 
                              item.text.toLowerCase().includes(state.searchQuery) || 
                              item.type.toLowerCase().includes(state.searchQuery) ||
                              item.date.toLowerCase().includes(state.searchQuery);
                              
        return matchesFilter && matchesSearch;
    });
    
    // Update Stats
    elements.totalCount.textContent = state.updates.length;
    elements.filteredCount.textContent = state.filteredUpdates.length;
    
    renderFeed();
}

// Render feed list grouped by date
function renderFeed() {
    elements.feedLoading.style.display = 'none';
    
    if (state.filteredUpdates.length === 0) {
        elements.feedEmpty.style.display = 'flex';
        elements.feedContainer.style.display = 'none';
        return;
    }
    
    elements.feedEmpty.style.display = 'none';
    elements.feedContainer.style.display = 'block';
    elements.feedContainer.innerHTML = '';
    
    // Group by Date
    const grouped = {};
    state.filteredUpdates.forEach(item => {
        if (!grouped[item.date]) {
            grouped[item.date] = [];
        }
        grouped[item.date].push(item);
    });
    
    // Create DOM structure
    Object.keys(grouped).forEach(date => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'feed-group';
        
        const dateHeader = document.createElement('h3');
        dateHeader.className = 'group-date-header';
        dateHeader.textContent = date;
        groupDiv.appendChild(dateHeader);
        
        grouped[date].forEach(item => {
            const card = document.createElement('div');
            card.className = `note-card ${state.selectedUpdate && state.selectedUpdate.id === item.id ? 'selected' : ''}`;
            card.dataset.id = item.id;
            
            // Set type class
            const badgeClass = `badge-${item.type.toLowerCase()}`;
            
            card.innerHTML = `
                <div class="card-header">
                    <span class="badge ${badgeClass}">${item.type}</span>
                </div>
                <div class="card-body">
                    ${item.html}
                </div>
                <div class="card-footer">
                    <span>BigQuery Notes</span>
                    <div class="card-actions">
                        <a href="${item.link}" target="_blank" class="action-link" title="Open Google Docs">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Docs
                        </a>
                        <button class="action-tweet-btn" title="Tweet this update">
                            <i class="fa-brands fa-twitter"></i> Tweet
                        </button>
                        <button class="action-copy-btn" title="Copy raw text to clipboard">
                            <i class="fa-solid fa-copy"></i> Copy
                        </button>
                    </div>
                </div>
            `;
            
            // Card selection click
            card.addEventListener('click', (e) => {
                // If they clicked the docs external link or copy button, don't trigger selection
                if (e.target.closest('.action-link') || e.target.closest('.action-copy-btn')) return;
                
                selectUpdate(item);
            });
            
            // Clipboard Copy Event Listener
            const copyBtn = card.querySelector('.action-copy-btn');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering card selection
                navigator.clipboard.writeText(item.text).then(() => {
                    copyBtn.classList.add('copied');
                    copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.innerHTML = `<i class="fa-solid fa-copy"></i> Copy`;
                    }, 1500);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            });
            
            groupDiv.appendChild(card);
        });
        
        elements.feedContainer.appendChild(groupDiv);
    });
}

// Select an update card
function selectUpdate(item) {
    state.selectedUpdate = item;
    
    // Highlight active card
    document.querySelectorAll('.note-card').forEach(card => {
        if (card.dataset.id === item.id) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    // Reveal Tweet Composer
    elements.tweetEmptyState.style.display = 'none';
    elements.tweetWorkspace.style.display = 'flex';
    
    // Update Composer Workspace fields
    elements.selectedBadge.className = `badge badge-${item.type.toLowerCase()}`;
    elements.selectedBadge.textContent = item.type;
    elements.selectedDate.textContent = item.date;
    elements.selectedSnippet.textContent = item.text;
    elements.tweetUrlTitle.textContent = `${item.type} | BigQuery Release Note (${item.date})`;
    
    // Generate draft
    generateTweetDraft();
    
    // Scroll tweet composer into view on mobile screens
    if (window.innerWidth <= 1024) {
        elements.tweetComposerCard.scrollIntoView({ behavior: 'smooth' });
    }
}

// Generate Tweet Text draft based on selected update and template
function generateTweetDraft() {
    if (!state.selectedUpdate) return;
    
    const update = state.selectedUpdate;
    const link = update.link || 'https://cloud.google.com/bigquery/docs/release-notes';
    const date = update.date;
    const type = update.type;
    const desc = update.text;
    
    let templateFn;
    switch (state.currentTemplate) {
        case 'excited':
            templateFn = (d) => `🚀 New BigQuery update! [${type}] ${d} Read more details: ${link} #BigQuery #GoogleCloud`;
            break;
        case 'analytical':
            templateFn = (d) => `📊 BigQuery Analyst Alert: ${d} Link: ${link} #GoogleCloud`;
            break;
        case 'short':
            templateFn = (d) => `[BQ ${type}] ${d} ${link}`;
            break;
        case 'standard':
        default:
            templateFn = (d) => `BigQuery Release Note (${date}) - ${type}: ${d} ${link}`;
            break;
    }
    
    // Calculate space for description
    const emptyTweet = templateFn('');
    const availableLength = 280 - emptyTweet.length;
    
    let finalDesc = desc;
    if (desc.length > availableLength) {
        // Truncate description with space for ellipsis
        finalDesc = desc.substring(0, availableLength - 3) + '...';
    }
    
    const tweetText = templateFn(finalDesc);
    elements.tweetTextInput.value = tweetText;
    updateCharCounter();
}

// Update Twitter character counter progress ring
function updateCharCounter() {
    const text = elements.tweetTextInput.value;
    const length = text.length;
    const limit = 280;
    const remaining = limit - length;
    
    elements.charCount.textContent = remaining;
    
    // Progress Ring Dash Offset
    const percent = Math.min(length / limit, 1.0);
    const offset = CIRCUMFERENCE - (percent * CIRCUMFERENCE);
    elements.progressCircle.style.strokeDashoffset = offset;
    
    // Styling colors based on remaining characters
    if (remaining < 0) {
        elements.progressCircle.style.stroke = '#ef4444'; // Red
        elements.charCount.style.color = '#ef4444';
        elements.sendTweetBtn.disabled = true;
        elements.sendTweetBtn.style.opacity = '0.5';
        elements.sendTweetBtn.style.cursor = 'not-allowed';
    } else if (remaining <= 20) {
        elements.progressCircle.style.stroke = '#f59e0b'; // Amber
        elements.charCount.style.color = '#f59e0b';
        elements.sendTweetBtn.disabled = false;
        elements.sendTweetBtn.style.opacity = '1';
        elements.sendTweetBtn.style.cursor = 'pointer';
    } else {
        elements.progressCircle.style.stroke = '#1d9bf0'; // Twitter Blue
        elements.charCount.style.color = 'var(--text-muted)';
        elements.sendTweetBtn.disabled = false;
        elements.sendTweetBtn.style.opacity = '1';
        elements.sendTweetBtn.style.cursor = 'pointer';
    }
}

// Export currently filtered release notes to CSV file
function exportToCsv() {
    if (state.filteredUpdates.length === 0) return;
    
    const headers = ['Date', 'Category', 'Description', 'Link'];
    const rows = state.filteredUpdates.map(item => [
        item.date,
        item.type,
        item.text,
        item.link
    ]);
    
    const escapeCsv = (val) => {
        if (val === undefined || val === null) return '';
        const strVal = String(val);
        const escaped = strVal.replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
            return `"${escaped}"`;
        }
        return strVal;
    };
    
    const csvContent = [
        headers.map(escapeCsv).join(','),
        ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\r\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `bigquery_release_notes_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

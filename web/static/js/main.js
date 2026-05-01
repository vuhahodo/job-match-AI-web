/**
 * Main application logic for Job Matching System
 * Includes Mock Auth and Routing
 */

document.addEventListener('DOMContentLoaded', () => {
    setupUploadForm();
    setupSearch();
    checkSystemStatus(); // New initialization check
    
    // Check if we are on dashboard page
    if (document.getElementById('kanban-board')) {
        loadDashboardData();
    } else {
        loadDashboardMockData();
    }

    // Check local storage for auth state
    if (localStorage.getItem('isLoggedIn') === 'true') {
        setAuthState(true);
    }

    // Init Theme
    initTheme();

    // Init CV
    updateCV();

    // Global Track Button Listener (Event Delegation)
    document.addEventListener('click', async e => {
        const trackBtn = e.target.closest('.track-btn');
        if (trackBtn) {
            e.preventDefault();
            const { id, title, company, loc, url } = trackBtn.dataset;
            trackJob(id, title, company, loc, url);
        }
    });
});

/* --- Theme Logic --- */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        if (theme === 'dark') {
            icon.classList.remove('bi-moon-stars-fill');
            icon.classList.add('bi-sun-fill');
        } else {
            icon.classList.remove('bi-sun-fill');
            icon.classList.add('bi-moon-stars-fill');
        }
    }
}

/* --- CV Builder Logic --- */
function updateCV() {
    // Basic mapping of ID -> ID
    const fields = ['Name', 'Title', 'Email', 'Phone', 'Summary', 'ExpRole', 'ExpCompany', 'ExpDesc', 'EduSchool', 'EduMajor', 'Location'];

    fields.forEach(field => {
        const input = document.getElementById(`cv${field}`);
        const preview = document.getElementById(`prev${field}`);
        if (input && preview) {
            preview.textContent = input.value;
        }
    });

    // Handle Skills separately (render as badges)
    const skillsInput = document.getElementById('cvSkills');
    const skillsPreview = document.getElementById('prevSkills');
    if (skillsInput && skillsPreview) {
        const skills = skillsInput.value.split(',').map(s => s.trim()).filter(s => s);
        skillsPreview.innerHTML = skills.map(skill =>
            `<span class="badge rounded-pill px-3 py-2" style="background: rgba(102, 126, 234, 0.1); color: #667eea;">${skill}</span>`
        ).join('');
    }
}

/* --- Navigation & Routing --- */
/* --- Navigation & Routing --- */
// MPA Architecture: Routing is handled by Flask and standard links.
// We remove showTab and utilize DOMContentLoaded in respective templates.

/* --- Common UI Helpers --- */
// ...

// Inner Tabs Removed - now top level pages

/* --- Authentication Mock --- */
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth-status');
        const data = await response.json();
        setAuthState(data.logged_in, data.user);
    } catch (e) {
        console.error("Auth status check failed", e);
        setAuthState(false);
    }
}

// Call check on load
document.addEventListener('DOMContentLoaded', checkAuthStatus);

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    // Convert FormData to JSON
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    btn.disabled = true;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (response.ok) {
            await checkAuthStatus();
            closeAuthModals();
            showToast('Welcome back!', result.message || 'Logged in successfully.', 'success');
            setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
        } else {
            showToast('Login Failed', result.error, 'danger');
        }
    } catch (e) {
        showToast('Error', 'Connection failed', 'danger');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Basic validation
    if (data.password !== data.confirm_password) {
        showToast('Error', 'Passwords do not match', 'danger');
        return;
    }

    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    btn.disabled = true;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (response.ok) {
            await checkAuthStatus();
            closeAuthModals();
            showToast('Account Created!', result.message, 'success');
            setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
        } else {
            showToast('Registration Failed', result.error, 'danger');
        }
    } catch (e) {
        showToast('Error', 'Connection failed', 'danger');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function closeAuthModals() {
    const loginModalEl = document.getElementById('loginModal');
    const registerModalEl = document.getElementById('registerModal');
    if (loginModalEl) {
        const m = bootstrap.Modal.getInstance(loginModalEl);
        if (m) m.hide();
    }
    if (registerModalEl) {
        const m = bootstrap.Modal.getInstance(registerModalEl);
        if (m) m.hide();
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        setAuthState(false);
        showToast('Logged out', 'See you next time!', 'info');
        setTimeout(() => { window.location.href = '/upload_page'; }, 1000);
    } catch (e) {
        console.error("Logout failed", e);
    }
}

function setAuthState(isLoggedIn, user = null) {
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');

    if (!authButtons || !userProfile) return;

    if (isLoggedIn) {
        authButtons.classList.add('d-none');
        userProfile.classList.remove('d-none');
        // If there's an element to show user's name:
        const nameEl = userProfile.querySelector('.user-name-display');
        const avatarEl = userProfile.querySelector('.user-avatar-display');
        if (nameEl && user && user.name) {
             nameEl.textContent = user.name;
        }
        if (avatarEl && user && user.name) {
             // Lấy tối đa 2 chữ cái đầu làm avatar
             const initials = user.name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
             avatarEl.textContent = initials;
        }
    } else {
        authButtons.classList.remove('d-none');
        userProfile.classList.add('d-none');
    }
}

async function checkSystemStatus() {
    const uploadBtn = document.querySelector('#uploadForm button[type="submit"]');
    const statusMsg = document.createElement('div');
    statusMsg.id = 'system-status-msg';
    statusMsg.className = 'text-center small text-info mb-3';
    
    const form = document.getElementById('uploadForm');
    if (form && uploadBtn) {
        form.insertBefore(statusMsg, uploadBtn.parentElement);
        
        const check = async () => {
            try {
                const res = await fetch('/api/cv-full');
                const data = await res.json();
                if (data.initializing) {
                    uploadBtn.disabled = true;
                    statusMsg.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Knowledge Graph is initializing... Please wait.';
                    setTimeout(check, 3000);
                } else {
                    uploadBtn.disabled = false;
                    statusMsg.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> System Ready';
                    setTimeout(() => { if (statusMsg) statusMsg.remove(); }, 2000);
                }
            } catch (e) {
                setTimeout(check, 5000);
            }
        };
        check();
    }
}

/* --- Dashboard Kanban Data --- */
// Load from localStorage or use defaults
const DEFAULT_KANBAN = {
    saved: [],
    applied: [],
    interview: [],
    offer: []
};

let KANBAN_DATA = JSON.parse(localStorage.getItem('kanbanData')) || DEFAULT_KANBAN;

async function saveKanbanData() {
    // Sync with server and local storage
    localStorage.setItem('kanbanData', JSON.stringify(KANBAN_DATA));
    try {
        await fetch('/api/kanban/update', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(KANBAN_DATA)
        });
    } catch (e) {
        console.error('Failed to sync kanban to server:', e);
    }
}

async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error('Server unreachable');
        const data = await response.json();
        
        // Always trust server data if we got a successful response
        // This handles both logged-in users and guests (who now have session storage)
        if (data.kanban) {
            KANBAN_DATA = data.kanban;
            localStorage.setItem('kanbanData', JSON.stringify(KANBAN_DATA));
        }
        
        const activities = data.activity || [];
        const stats = data.stats || {scans: 0, matches: 0};

        renderAllColumns();
        setupDragAndDrop();
        renderDashboardStats(stats);
        renderDashboardSkills();
        renderRecentActivity(activities);
    } catch (e) {
        console.error('Failed to load dashboard data:', e);
        // Fallback to local storage only on failure
        KANBAN_DATA = JSON.parse(localStorage.getItem('kanbanData')) || DEFAULT_KANBAN;
        renderAllColumns();
        setupDragAndDrop();
        renderDashboardStats();
        renderDashboardSkills();
    }
}

function renderDashboardStats(realStats = null) {
    const totalApps = KANBAN_DATA.saved.length + KANBAN_DATA.applied.length + KANBAN_DATA.interview.length + KANBAN_DATA.offer.length;
    const statEl = document.getElementById('total-apps-stat');
    if (statEl) statEl.textContent = totalApps;

    // Update interview rate
    const interviewCount = KANBAN_DATA.interview.length;
    const offerCount = KANBAN_DATA.offer.length;
    const appliedCount = KANBAN_DATA.applied.length;
    
    const interviewRateCount = interviewCount + offerCount;
    const totalWithApplied = appliedCount + interviewRateCount;
    const rate = totalWithApplied > 0 ? Math.round((interviewRateCount / totalWithApplied) * 100) : 0;

    const rateEl = document.getElementById('interview-rate-stat');
    if (rateEl) rateEl.textContent = rate + '%';

    // Update real stats if provided
    if (realStats) {
        const matchesEl = document.getElementById('total-matches-stat');
        const scansEl = document.getElementById('cv-scanned-stat');
        if (matchesEl) matchesEl.textContent = realStats.matches || 0;
        if (scansEl) scansEl.textContent = realStats.scans || 0;
    }
}

async function renderDashboardSkills() {
    const skillContainer = document.getElementById('dashboard-skills');
    if (!skillContainer) return;

    // Try to load real skills from API
    try {
        const response = await fetch('/user-skills');
        const skills = await response.json();
        const normalizedSkills = Array.isArray(skills) ? skills.map(s => ({
            name: s.name,
            probability: Number(s.probability || 0),
            is_core: Boolean(s.is_core),
            tag: s.tag || ''
        })) : [];

        if (normalizedSkills.length > 0) {
            // Take top 5 skills and format them
            const colors = ['primary', 'info', 'warning', 'success', 'danger'];
            const topSkills = normalizedSkills.slice(0, 5).map((s, i) => ({
                name: s.name,
                level: Math.round(s.probability * 100),
                color: colors[i % colors.length]
            }));

            skillContainer.innerHTML = topSkills.map(s => `
                <div class="mb-3">
                    <div class="d-flex justify-content-between small mb-1">
                        <span class="fw-bold">${s.name}</span>
                        <span class="text-muted">${s.level}%</span>
                    </div>
                    <div class="progress" style="height: 6px; background-color: rgba(0,0,0,0.05)">
                        <div class="progress-bar bg-${s.color}" style="width: ${s.level}%"></div>
                    </div>
                </div>
            `).join('');
            return;
        }
    } catch (e) {
        console.log('Using mock skills - no CV uploaded yet');
    }

    // Fallback to empty state with message
    skillContainer.innerHTML = `
        <div class="text-center py-3">
            <i class="bi bi-upload text-muted" style="font-size: 2rem;"></i>
            <p class="text-muted small mt-2 mb-0">Upload a CV to see your skill profile</p>
            <a href="/upload_page" class="btn btn-sm btn-outline-primary mt-2">Upload CV</a>
        </div>
    `;
}

function renderRecentActivity(activities = []) {
    const activityContainer = document.getElementById('recent-activity-list');
    if (!activityContainer) return;

    if (!activities || activities.length === 0) {
        activityContainer.innerHTML = '<div class="text-center py-4 text-muted small">No recent activity</div>';
        return;
    }

    activityContainer.innerHTML = activities.map(a => `
        <div class="d-flex gap-3 mb-4">
            <div class="activity-icon bg-${a.color} bg-opacity-10 text-${a.color} rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; flex-shrink: 0;">
                <i class="bi ${a.icon} small"></i>
            </div>
            <div>
                <div class="small fw-bold">${a.title}</div>
                <div class="text-muted extra-small">${a.subtitle} • ${a.time}</div>
            </div>
        </div>
    `).join('');
}

function loadDashboardMockData() {
    renderAllColumns();
    renderDashboardStats();
    renderDashboardSkills();
    renderRecentActivity();
}


function renderAllColumns() {
    renderKanbanColumn('saved', 'col-saved');
    renderKanbanColumn('applied', 'col-applied');
    renderKanbanColumn('interview', 'col-interview');
    renderKanbanColumn('offer', 'col-offer');
}

function renderKanbanColumn(key, colId) {
    const col = document.getElementById(colId);
    if (!col) return;

    col.innerHTML = KANBAN_DATA[key].map(item => `
        <div class="card border-0 shadow-sm mb-3 kanban-card draggable" 
             draggable="true" 
             data-id="${item.id}" 
             data-origin="${key}"
             ondblclick="${item.job_id ? `window.location.href='/job-detail/${item.job_id}'` : `viewAppDetails('${key}', '${item.id}')`}"
             title="Double click to view details">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <h6 class="fw-bold mb-0 text-truncate" style="max-width: 80%;">
                        ${item.job_id ? `<a href="/job-detail/${item.job_id}" class="text-decoration-none text-dark hover-primary">${item.title}</a>` : `<a href="javascript:void(0)" onclick="viewAppDetails('${key}', '${item.id}')" class="text-decoration-none text-dark hover-primary">${item.title}</a>`}
                    </h6>
                    <button class="btn btn-sm btn-link text-danger p-0 border-0" onclick="deleteKanbanItem('${key}', '${item.id}')" title="Remove">
                        <i class="bi bi-trash small"></i>
                    </button>
                </div>
                <div class="text-muted small mb-2">${item.company}</div>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex gap-2 align-items-center">
                        <span class="badge bg-light text-dark border"><i class="bi bi-geo-alt me-1"></i>${item.loc}</span>
                        ${item.url ? `<a href="${item.url}" target="_blank" class="text-primary" title="Open Job Link"><i class="bi bi-box-arrow-up-right"></i></a>` : ''}
                    </div>
                    <small class="text-muted" style="font-size:0.7rem">${item.date}</small>
                </div>
            </div>
        </div>
    `).join('');

    const badge = col.parentElement.querySelector('.badge');
    if (badge) badge.textContent = KANBAN_DATA[key].length;
}

async function deleteKanbanItem(col, id) {
    if (!confirm('Are you sure you want to remove this from your tracker?')) return;
    
    try {
        const response = await fetch(`/api/kanban/delete/${col}/${id}`, { method: 'DELETE' });
        
        // Nếu server xóa thành công HOẶC server không tìm thấy (do là dữ liệu mẫu cũ), 
        // chúng ta vẫn xóa ở giao diện để người dùng không bị kẹt.
        if (response.ok || response.status === 404) {
            const index = KANBAN_DATA[col].findIndex(i => i.id === id);
            if (index > -1) {
                KANBAN_DATA[col].splice(index, 1);
                localStorage.setItem('kanbanData', JSON.stringify(KANBAN_DATA));
                renderAllColumns();
                renderDashboardStats();
                showToast('Removed', 'Application removed from tracker', 'info');
            }
        } else {
            throw new Error('Server error');
        }
    } catch (e) {
        console.error('Delete failed:', e);
        showToast('Error', 'Failed to delete item from server', 'danger');
    }
}

/* --- Drag & Drop Logic --- */
let draggedItem = null;

function setupDragAndDrop() {
    const board = document.getElementById('kanban-board');
    if (!board || board.dataset.dragInitialized === "true") return;

    // Use event delegation on the board container
    board.addEventListener('dragstart', e => {
        const draggable = e.target.closest('.draggable');
        if (draggable) {
            draggedItem = draggable;
            draggable.classList.add('opacity-50');
            // Store origin column for easier lookup
            e.dataTransfer.setData('text/plain', draggable.dataset.id);
        }
    });

    board.addEventListener('dragend', e => {
        const draggable = e.target.closest('.draggable');
        if (draggable) {
            draggedItem = null;
            draggable.classList.remove('opacity-50');
            // Clean up hover states
            document.querySelectorAll('.kanban-column').forEach(c => c.style.backgroundColor = '');
        }
    });

    board.addEventListener('dragover', e => {
        const col = e.target.closest('.kanban-column');
        if (col) {
            e.preventDefault();
            // Subtly highlight the column
            col.style.backgroundColor = 'rgba(0,0,0,0.02)';
        }
    });

    board.addEventListener('dragleave', e => {
        const col = e.target.closest('.kanban-column');
        if (col) {
            col.style.backgroundColor = '';
        }
    });

    board.addEventListener('drop', e => {
        const col = e.target.closest('.kanban-column');
        if (col && draggedItem) {
            e.preventDefault();
            col.style.backgroundColor = '';

            const originColKey = draggedItem.dataset.origin;
            const targetColId = col.id;
            const targetColKey = targetColId.replace('col-', '');
            const itemId = draggedItem.dataset.id;

            if (originColKey === targetColKey) return;

            // Move data in memory
            const itemIndex = KANBAN_DATA[originColKey].findIndex(i => String(i.id) === String(itemId));
            if (itemIndex > -1) {
                const [item] = KANBAN_DATA[originColKey].splice(itemIndex, 1);
                item.date = "Just now";
                KANBAN_DATA[targetColKey].unshift(item);

                // Re-render and save
                renderAllColumns();
                saveKanbanData();
                renderDashboardStats();
                
                // Refresh activity list if it moved to a significant status
                if (targetColKey === 'applied' || targetColKey === 'interview' || targetColKey === 'offer') {
                    // We could fetch again or just optimistic update, but fetch is safer to get server-side logged activity if we had it
                    // For now, let's just refresh the dashboard data to get the latest activities
                    setTimeout(loadDashboardData, 500); 
                }

                showToast('Moved', `Moved to ${targetColKey.toUpperCase()}`, 'success');
            }
        }
    });

    board.dataset.dragInitialized = "true";
    
    // Set min-height for columns to ensure they are drop targets even when empty
    document.querySelectorAll('.kanban-column').forEach(col => {
        col.style.minHeight = "300px";
    });
}
async function handleAddApp(e) {
    e.preventDefault();
    const title = document.getElementById('appTitle').value;
    const company = document.getElementById('appCompany').value;
    const loc = document.getElementById('appLocation').value;
    const url = document.getElementById('appUrl').value;
    const status = document.getElementById('appStatus').value;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';

    try {
        const response = await fetch('/api/kanban/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ title, company, loc, status, url })
        });
        const result = await response.json();
        
        if (result.success) {
            // Success - reload dashboard data
            await loadDashboardData();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAppModal'));
            if (modal) modal.hide();
            e.target.reset();
            showToast('Added', 'Application added to tracker', 'success');
        }
    } catch (error) {
        console.error('Error adding app:', error);
        showToast('Error', 'Failed to add application', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Add to Tracker';
    }
}

async function trackJob(jobId, title, company, loc, url) {
    try {
        const response = await fetch('/api/kanban/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ job_id: jobId, title, company, loc, url, status: 'saved' })
        });
        const result = await response.json();
        if (result.success) {
            showToast('Saved', 'Job added to your tracker', 'success');
            // If we are on dashboard, reload
            if (document.getElementById('kanban-board')) {
                loadDashboardData();
            }
        } else {
            showToast('Error', result.error || 'Failed to save job', 'danger');
        }
    } catch (e) {
        showToast('Error', 'Connection failed', 'danger');
    }
}

function viewAppDetails(col, id) {
    const item = KANBAN_DATA[col].find(i => String(i.id) === String(id));
    if (!item) return;

    const content = document.getElementById('viewAppContent');
    if (!content) return;

    content.innerHTML = `
        <div class="mb-3">
            <label class="small text-muted fw-bold text-uppercase">Job Title</label>
            <div class="fw-bold fs-5">${item.title}</div>
        </div>
        <div class="mb-3">
            <label class="small text-muted fw-bold text-uppercase">Company</label>
            <div>${item.company}</div>
        </div>
        <div class="mb-3">
            <label class="small text-muted fw-bold text-uppercase">Location</label>
            <div><i class="bi bi-geo-alt me-1"></i>${item.loc}</div>
        </div>
        ${item.url ? `
        <div class="mb-3">
            <label class="small text-muted fw-bold text-uppercase">Job URL</label>
            <div><a href="${item.url}" target="_blank" class="text-truncate d-block">${item.url}</a></div>
        </div>` : ''}
        <div class="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
            <span class="small text-muted">Added on ${item.date}</span>
            <span class="badge bg-primary-soft text-primary text-uppercase">${col}</span>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('viewAppModal'));
    modal.show();
}

/* --- Search Setup --- */
function setupSearch() {
    // Real data is loaded by handleJobSearch() via /api/search
    // No mock data injected here — avoids flash of fake content
}

/* --- Core Functionality (Upload etc) --- */
function setupUploadForm() {
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('pdfFile');
    const uploadArea = document.querySelector('.upload-area');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    const inlineError = document.getElementById('uploadInlineError');
    const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;

    if (!form || !fileInput) return;

    const setInlineError = (message) => {
        if (!inlineError) return;
        if (message) {
            inlineError.textContent = message;
            inlineError.classList.remove('d-none');
        } else {
            inlineError.textContent = '';
            inlineError.classList.add('d-none');
        }
    };

    const validatePDF = (file) => {
        if (!file) return 'Please select a PDF file.';
        const name = (file.name || '').toLowerCase();
        const type = (file.type || '').toLowerCase();
        if (!name.endsWith('.pdf') && type !== 'application/pdf') {
            return 'Only PDF files are allowed.';
        }
        if (file.size > MAX_UPLOAD_SIZE) {
            return 'File size must be 100MB or less.';
        }
        return '';
    };

    // Drag and drop events
    if (uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        uploadArea.addEventListener('dragover', () => uploadArea.classList.add('dragover'));
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));

        uploadArea.addEventListener('drop', (e) => {
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            fileInput.files = files;
            handleFiles(files);
        });

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => handleFiles(fileInput.files));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setInlineError('');

        const selectedFile = fileInput.files[0];
        const validationError = validatePDF(selectedFile);
        if (validationError) {
            setInlineError(validationError);
            return;
        }

        const loader = document.getElementById('globalLoader');
        if (loader) loader.classList.add('active');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.originalHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Uploading...';
        }

        const formData = new FormData();
        formData.append('pdf_file', selectedFile);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Update UI with results
                // showToast('Success', 'CV analysis complete!', 'success'); // Optional, redundant if we move fast

                // Move to results tab
                window.location.href = '/results-page';

                // Reload graph if needed
                // initializeGraph(true);
            } else {
                setInlineError(data.error || 'Upload failed');
            }
        } catch (error) {
            setInlineError(error.message || 'Upload failed');
        } finally {
            if (loader) loader.classList.remove('active');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = submitBtn.dataset.originalHtml || submitBtn.innerHTML;
            }
        }
    });
}

function handleFiles(files) {
    const fileLabel = document.getElementById('fileNameDisplay');
    const inlineError = document.getElementById('uploadInlineError');
    const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;
    if (files.length > 0 && fileLabel) {
        const file = files[0];
        const name = (file.name || '').toLowerCase();
        const type = (file.type || '').toLowerCase();
        if ((!name.endsWith('.pdf') && type !== 'application/pdf') || file.size > MAX_UPLOAD_SIZE) {
            fileLabel.style.display = 'none';
            if (inlineError) {
                inlineError.textContent = !name.endsWith('.pdf') && type !== 'application/pdf'
                    ? 'Only PDF files are allowed.'
                    : 'File size must be 100MB or less.';
                inlineError.classList.remove('d-none');
            }
            return;
        }
        if (inlineError) {
            inlineError.textContent = '';
            inlineError.classList.add('d-none');
        }
        fileLabel.textContent = file.name;
        fileLabel.style.display = 'inline-block';
    }
}

// Re-using existing load functions with minor tweaks for ID selectors
async function loadResults() {
    const container = document.getElementById('resultsListContainer'); // Changed ID in HTML
    if (!container) return; // Guard clause

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

    try {
        // Fetch both results and full CV data in parallel
        const [resultsRes, cvRes] = await Promise.all([
            fetch('/results'),
            fetch('/api/cv-full')
        ]);
        const results = resultsRes.ok ? await resultsRes.json() : [];
        const cvData = cvRes.ok ? await cvRes.json() : { active: false };

        let html = '';

        // ── CV Overview Section ──
        if (cvData.active) {
            html += `
            <div class="row g-4 justify-content-center mb-4">
                <div class="col-md-10">
                    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div class="card-header py-3 px-4 border-0" style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="fw-bold text-white mb-0">
                                    <i class="bi bi-file-earmark-text me-2"></i>CV Scan Results
                                </h5>
                                <div class="d-flex gap-2 align-items-center">
                                    <span class="badge bg-white bg-opacity-75 text-dark">
                                        <i class="bi bi-file-pdf me-1"></i>${cvData.filename || 'CV'}
                                    </span>
                                    <span class="badge bg-white bg-opacity-75 text-dark">
                                        ${cvData.char_count.toLocaleString()} chars • ${cvData.line_count} lines
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-4">
                            <!-- Extracted Info Summary -->
                            <div class="row g-3 mb-4">
                                <div class="col-md-6">
                                    <h6 class="fw-bold text-muted text-uppercase small mb-3">
                                        <i class="bi bi-person-circle me-1"></i>Personal Info Detected
                                    </h6>
                                    <div class="d-flex flex-column gap-2">
                                        ${cvData.email ? `<div><i class="bi bi-envelope text-primary me-2"></i><strong>Email:</strong> ${cvData.email}</div>` : ''}
                                        ${cvData.phone ? `<div><i class="bi bi-phone text-success me-2"></i><strong>Phone:</strong> ${cvData.phone}</div>` : ''}
                                        ${cvData.role ? `<div><i class="bi bi-briefcase text-warning me-2"></i><strong>Role:</strong> ${cvData.role}</div>` : ''}
                                        ${cvData.city ? `<div><i class="bi bi-geo-alt text-danger me-2"></i><strong>Location:</strong> ${cvData.city}</div>` : ''}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="fw-bold text-muted text-uppercase small mb-3">
                                        <i class="bi bi-lightning-fill me-1"></i>Skills Detected (${cvData.skills_count})
                                    </h6>
                                    <div class="d-flex flex-wrap gap-1">
                                        ${cvData.skills.map(s => `<span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1">${s}</span>`).join('')}
                                        ${cvData.skills_count > 20 ? `<span class="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1">+${cvData.skills_count - 20} more</span>` : ''}
                                    </div>
                                </div>
                            </div>

                            <!-- Full CV Text -->
                            <div>
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 class="fw-bold text-muted text-uppercase small mb-0">
                                        <i class="bi bi-body-text me-1"></i>Full Extracted Text
                                    </h6>
                                    <button class="btn btn-sm btn-outline-secondary" onclick="toggleCVText()">
                                        <i class="bi bi-chevron-down me-1" id="cvTextToggleIcon"></i><span id="cvTextToggleLabel">Show</span>
                                    </button>
                                </div>
                                <div id="cvFullTextBlock" style="display:none;">
                                    <pre class="p-3 bg-light rounded-3 border" style="white-space: pre-wrap; word-wrap: break-word; max-height: 500px; overflow-y: auto; font-size: 0.85rem; line-height: 1.6;">${escapeHtml(cvData.cv_text)}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        // ── Job Matches Section ──
        if (Array.isArray(results) && results.length > 0) {
            html += `
                <div class="row g-4 justify-content-center">
                <div class="col-md-10">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h3 class="fw-bold mb-0">Top AI Recommendations</h3>
                        <button class="btn btn-outline-secondary btn-sm" onclick="window.location.href='/upload_page'">
                            <i class="bi bi-arrow-left me-2"></i>Upload New CV
                        </button>
                    </div>
            `;

            results.forEach((job, index) => {
                html += `
                    <div class="job-card d-flex align-items-center justify-content-between fade-in" style="animation-delay: ${index * 0.1}s">
                        <div class="d-flex align-items-center">
                            <div class="badge-score me-4 fs-5">${(job.score * 100).toFixed(0)}%</div>
                            <div>
                                <h5 class="fw-bold mb-1">${job.title}</h5>
                                <div class="text-secondary mb-1">
                                    <i class="bi bi-building me-2"></i>${job.company}
                                    <span class="mx-2">•</span>
                                    <i class="bi bi-geo-alt me-2"></i>${job.city}
                                </div>
                                <div class="small text-success">
                                    <i class="bi bi-graph-up-arrow me-1"></i> High text similarity
                                </div>
                            </div>
                        </div>
                        <div class="ms-3" style="min-width: 140px;">
                            <div class="d-flex flex-column gap-2">
                                <a href="/job-detail/${job.id}" class="btn btn-outline-primary btn-sm w-100">
                                    <i class="bi bi-info-circle me-1"></i>View Analysis
                                </a>
                                <button class="btn btn-light btn-sm w-100 track-btn" 
                                    data-id="${job.id}" 
                                    data-title="${escapeHtml(job.title)}" 
                                    data-company="${escapeHtml(job.company)}" 
                                    data-loc="${escapeHtml(job.city)}" 
                                    data-url="${job.url || ''}">
                                    <i class="bi bi-bookmark-plus me-1"></i>Track
                                </button>
                                <a href="${job.url}" target="_blank" class="btn btn-primary btn-sm w-100">
                                    <i class="bi bi-box-arrow-up-right me-1"></i>Apply
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div></div>';
        } else{
            html += `
                <div class="row justify-content-center">
                    <div class="col-md-10">
                        <div class="alert alert-warning border-0 shadow-sm rounded-4 p-4 d-flex align-items-start gap-3">
                            <i class="bi bi-exclamation-triangle-fill fs-4"></i>
                            <div>
                                <div class="fw-bold mb-1">No job matches yet</div>
                                <div class="mb-3">
                                    You need to scan your CV first to see job recommendations.
                                </div>
                                <a href="/upload_page" class="btn btn-primary btn-sm rounded-pill px-3">
                                    <i class="bi bi-upload me-2"></i>Scan CV Now
                                </a>
                            </div>
                        </div>
                    </div>
                </div>  
            `;
        }


        container.innerHTML = html;

        // Also inject into search results just for demo
        loadDashboardMockData();

    } catch (error) {
        let msg = error.message;
        if (msg.includes('503')) msg = 'System is still initializing. Please wait and try again.';
        container.innerHTML = `<div class="alert alert-warning shadow-sm border-0 d-flex align-items-center gap-3">
            <i class="bi bi-exclamation-triangle-fill fs-4"></i>
            <div>
                <div class="fw-bold">Scan Incomplete</div>
                <div>${escapeHtml(msg)}</div>
            </div>
        </div>`;
    }
}

// Toggle full CV text visibility
function toggleCVText() {
    const block = document.getElementById('cvFullTextBlock');
    const icon = document.getElementById('cvTextToggleIcon');
    const label = document.getElementById('cvTextToggleLabel');
    if (!block) return;

    if (block.style.display === 'none') {
        block.style.display = 'block';
        icon.className = 'bi bi-chevron-up me-1';
        label.textContent = 'Hide';
    } else {
        block.style.display = 'none';
        icon.className = 'bi bi-chevron-down me-1';
        label.textContent = 'Show';
    }
}

// Escape HTML to prevent XSS in CV text display
function escapeHtml(text) {
    const str = String(text ?? '');
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

async function loadJobDetail(index) {
    try {
        const response = await fetch(`/job/${index}`);
        const detail = await response.json();

        const modalBody = document.getElementById('jobModalBody');

        let html = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5 class="mb-3">Overview</h5>
                    <p class="mb-1"><strong>Company:</strong> ${detail.company}</p>
                    <p class="mb-1"><strong>Location:</strong> ${detail.city}</p>
                    <p class="mb-1"><strong>Total Match:</strong> <span class="text-primary fw-bold">${(detail.score * 100).toFixed(1)}%</span></p>
                </div>
                <div class="col-md-6">
                    <h5 class="mb-3">Score Breakdown</h5>
                    <div class="progress mb-2" style="height: 10px;">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${(detail.components.skill * 100)}%"></div>
                    </div>
                    <small>Skill: ${(detail.components.skill * 100).toFixed(1)}%</small>
                </div>
            </div>

            <div class="mb-4">
                <h6 class="fw-bold mb-3 text-success">Matched Skills</h6>
                <div class="d-flex flex-wrap gap-2">
                    ${(detail.matched_skills || []).map(s =>
            `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 p-2">
                            ${s.skill} ${(s.user_prob * 100).toFixed(0)}%
                         </span>`
        ).join('') || '<span class="text-muted">No direct matches</span>'}
                </div>
            </div>
            
             <div>
                 <h6 class="fw-bold mb-3 text-danger">Missing / Required Skills</h6>
                 <div class="d-flex flex-wrap gap-2">
                    ${(detail.missing_skills || []).map(s =>
            `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 p-2">
                            ${s.skill}
                         </span>`
        ).join('') || '<span class="text-muted">No missing skills detected!</span>'}
                </div>
            </div>
        `;

        if (modalBody) modalBody.innerHTML = html;
        const modal = new bootstrap.Modal(document.getElementById('jobModal'));
        modal.show();
    } catch (error) {
        showToast('Error', 'Failed to load details', 'danger');
    }
}

// Enhanced Skills Profile - Detailed Profile Page
async function loadEnhancedSkillsProfile() {
    const container = document.getElementById('skillsProfile');
    if (!container) return;

    try {
        // Fetch skills and CV data in parallel
        const [skillsResponse, cvResponse] = await Promise.all([
            fetch('/user-skills'),
            fetch('/api/cv-full')
        ]);

        const skills = await skillsResponse.json();
        const cvData = await cvResponse.json();

        // Handle empty state
        if (!cvData.active || !skills || skills.length === 0) {
            container.innerHTML = renderEmptyState();
            return;
        }

        // Normalize and sort skills
        const normalizedSkills = Array.isArray(skills) ? skills.map(skill => ({
            name: skill.name,
            is_core: Boolean(skill.is_core),
            probability: skill.probability || 0.5
        })) : [];

        // Separate skills
        const coreSkills = normalizedSkills.filter(s => s.is_core).sort((a, b) => b.probability - a.probability);
        const supportingSkills = normalizedSkills.filter(s => !s.is_core).sort((a, b) => b.probability - a.probability);
        
        // Calculate average confidence
        const avgConfidence = Math.round(
            (normalizedSkills.reduce((sum, s) => sum + s.probability, 0) / normalizedSkills.length) * 100
        );

        // Generate growth suggestions (top missing skills based on detected role)
        const growthSuggestions = generateGrowthSuggestions(normalizedSkills, cvData.role);

        // Build HTML
        const html = `
            <!-- Hero Section -->
            <div class="skills-hero">
                <div class="skills-hero-content">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h1 class="mb-2">${escapeHtml(cvData.role || 'Professional')}</h1>
                            <div class="d-flex gap-2 flex-wrap">
                                ${cvData.city ? `<span class="badge bg-white bg-opacity-75 text-dark"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(cvData.city)}</span>` : ''}
                                ${cvData.email ? `<span class="badge bg-white bg-opacity-75 text-dark"><i class="bi bi-envelope me-1"></i>${escapeHtml(cvData.email)}</span>` : ''}
                            </div>
                        </div>
                        <small class="text-white-50">CV: ${escapeHtml(cvData.filename)}</small>
                    </div>

                    <!-- Profile Stats -->
                    <div class="profile-summary">
                        <div class="stat-card">
                            <span class="stat-number">${normalizedSkills.length}</span>
                            <span class="stat-label">Total Skills</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-number">${coreSkills.length}</span>
                            <span class="stat-label">Core Skills</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-number">${avgConfidence}%</span>
                            <span class="stat-label">Avg. Confidence</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-number">${supportingSkills.length}</span>
                            <span class="stat-label">Supporting</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CTA Buttons -->
            <div class="skills-cta mb-4">
                <a href="/results-page" class="cta-button btn btn-primary">
                    <i class="bi bi-briefcase-fill"></i>View Matched Jobs
                </a>
                <a href="/interview-page" class="cta-button btn btn-success">
                    <i class="bi bi-chat-dots-fill"></i>Start Interview Practice
                </a>
                <a href="/upload_page" class="cta-button btn btn-info">
                    <i class="bi bi-upload"></i>Re-upload CV
                </a>
            </div>

            <!-- Core Skills Section -->
            <div class="skills-section">
                <h2 class="section-title">
                    <i class="bi bi-star-fill text-warning me-2"></i>Core Skills (${coreSkills.length})
                </h2>
                <div class="row g-3 mt-3">
                    ${coreSkills.length > 0 ? 
                        coreSkills.map(skill => renderSkillCard(skill, 'core')).join('') 
                        : '<p class="text-muted">No core skills detected.</p>'
                    }
                </div>
            </div>

            <!-- Supporting Skills Section -->
            <div class="skills-section">
                <h2 class="section-title">
                    <i class="bi bi-lightbulb text-info me-2"></i>Supporting Skills (${supportingSkills.length})
                </h2>
                <div class="row g-3 mt-3">
                    ${supportingSkills.length > 0 ? 
                        supportingSkills.map(skill => renderSkillCard(skill, 'supporting')).join('') 
                        : '<p class="text-muted">No supporting skills detected.</p>'
                    }
                </div>
            </div>

            <!-- Growth Suggestions Section -->
            <div class="skills-section">
                <h2 class="section-title">
                    <i class="bi bi-trending-up text-success me-2"></i>Growth Suggestions
                </h2>
                <div class="row g-3 mt-3">
                    ${growthSuggestions.length > 0 ? 
                        growthSuggestions.map((skill, idx) => `
                            <div class="col-lg-6">
                                <div class="skill-card">
                                    <div class="skill-info">
                                        <div class="skill-name">${escapeHtml(skill)}</div>
                                        <div class="text-muted small">Recommended for your role</div>
                                    </div>
                                    <span class="badge bg-success">Add</span>
                                </div>
                            </div>
                        `).join('')
                        : '<p class="text-muted">No growth suggestions at this time.</p>'
                    }
                </div>
            </div>
        `;

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading skills profile:', error);
        container.innerHTML = `
            <div class="alert alert-danger border-0 rounded-3">
                <i class="bi bi-exclamation-triangle me-2"></i>Failed to load skills profile. Please try again.
            </div>
        `;
    }
}

function renderSkillCard(skill, type) {
    const percentage = Math.round(skill.probability * 100);
    const badgeClass = type === 'core' ? 'badge-core' : 'badge-supporting';
    const badgeText = type === 'core' ? 'CORE' : 'SUPPORTING';
    const barColor = type === 'core' ? 'success' : 'info';

    return `
        <div class="col-lg-6 col-xl-4">
            <div class="skill-card">
                <div class="skill-info">
                    <div class="skill-name">${escapeHtml(skill.name)}</div>
                    <span class="skill-badge ${badgeClass}">${badgeText}</span>
                    <div class="progress-container">
                        <div class="progress">
                            <div class="progress-bar bg-${barColor}" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
                <div class="skill-confidence">${percentage}%</div>
            </div>
        </div>
    `;
}

function renderEmptyState() {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="bi bi-file-earmark-pdf"></i>
            </div>
            <h2 class="empty-state-title">No Skills Profile Yet</h2>
            <p class="empty-state-text">Upload your CV to extract and analyze your professional skills profile.</p>
            <a href="/upload_page" class="btn btn-primary btn-lg">
                <i class="bi bi-upload me-2"></i>Upload Your CV
            </a>
        </div>
    `;
}

function generateGrowthSuggestions(currentSkills, role) {
    const currentSkillNames = new Set(currentSkills.map(s => s.name.toLowerCase()));
    
    let suggestedSkills = [];
    
    // Normalize role to lowercase for comparison
    const normalizedRole = (role || '').toLowerCase();
    
    // Role-based skill suggestions
    if (normalizedRole.includes('sales') || normalizedRole.includes('bán hàng') || normalizedRole.includes('business development')) {
        // Sales/Business Development skills
        suggestedSkills = [
            'CRM', 'Lead Generation', 'Negotiation', 'Customer Relationship Management',
            'Sales Forecasting', 'Communication', 'Market Research', 'Excel', 'Presentation Skills',
            'Pipeline Management', 'Client Management', 'Strategic Planning'
        ];
    } else if (normalizedRole.includes('account') || normalizedRole.includes('finance') || normalizedRole.includes('tài chính') || normalizedRole.includes('kế toán')) {
        // Accounting/Finance skills
        suggestedSkills = [
            'Excel', 'Financial Reporting', 'Taxes', 'Accounting Software', 'Budgeting',
            'Data Entry', 'Compliance', 'GAAP', 'Audit', 'Cost Analysis',
            'Reconciliation', 'P&L Statement', 'Financial Analysis'
        ];
    } else if (normalizedRole.includes('developer') || normalizedRole.includes('engineer') || normalizedRole.includes('programmer') || 
               normalizedRole.includes('devops') || normalizedRole.includes('architect') || normalizedRole.includes('cntt') || 
               normalizedRole.includes('it ')) {
        // IT/Developer skills
        suggestedSkills = [
            'Cloud Computing', 'Docker', 'Kubernetes', 'CI/CD', 'API Development',
            'Microservices', 'System Design', 'Machine Learning', 'DevOps', 'AWS',
            'Azure', 'GCP', 'GraphQL', 'Data Security', 'Testing Automation'
        ];
    } else if (normalizedRole.includes('marketing') || normalizedRole.includes('market') || normalizedRole.includes('thị trường')) {
        // Marketing skills
        suggestedSkills = [
            'Digital Marketing', 'SEO', 'Content Marketing', 'Social Media Marketing',
            'Email Marketing', 'Analytics', 'Google Analytics', 'A/B Testing',
            'Brand Strategy', 'Market Research', 'Campaign Management', 'Communication'
        ];
    } else if (normalizedRole.includes('hr') || normalizedRole.includes('human resources') || normalizedRole.includes('nhân sự')) {
        // HR skills
        suggestedSkills = [
            'Recruitment', 'Employee Relations', 'Performance Management', 'Payroll',
            'Training & Development', 'HRIS', 'Labor Laws', 'Communication',
            'Conflict Resolution', 'Onboarding', 'Excel', 'Data Management'
        ];
    } else if (normalizedRole.includes('manager') || normalizedRole.includes('lead') || normalizedRole.includes('director') || normalizedRole.includes('quản lý')) {
        // Management skills
        suggestedSkills = [
            'Project Management', 'Team Leadership', 'Strategic Planning', 'Decision Making',
            'Communication', 'Mentoring', 'Budget Management', 'Risk Management',
            'Agile Methodology', 'Performance Metrics', 'Stakeholder Management', 'Excel'
        ];
    } else {
        // Default/General professional skills
        suggestedSkills = [
            'Communication', 'Problem Solving', 'Project Management', 'Excel',
            'Time Management', 'Leadership', 'Teamwork', 'Strategic Thinking',
            'Data Analysis', 'Presentation Skills', 'Critical Thinking', 'Adaptability'
        ];
    }
    
    // Filter out skills already in the current skill set
    const suggestions = suggestedSkills.filter(skill => !currentSkillNames.has(skill.toLowerCase()));
    
    return suggestions.slice(0, 6); // Return top 6 suggestions
}

async function loadSkills() {
    const container = document.getElementById('skillsList');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const response = await fetch('/user-skills');
        const skills = await response.json();
        const normalizedSkills = Array.isArray(skills) ? skills.map(skill => ({
            name: skill.name,
            is_core: Boolean(skill.is_core),
            tag: skill.tag || ''
        })) : [];

        if (!skills || skills.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning border-0 shadow-sm rounded-4 d-flex align-items-start gap-3">
                    <i class="bi bi-info-circle-fill fs-4"></i>
                    <div>
                        <div class="fw-bold mb-1">No skills detected yet</div>
                        <div class="mb-2">Upload and scan your CV to extract your skill profile.</div>
                        <a href="/upload_page" class="btn btn-primary btn-sm rounded-pill px-3">
                            <i class="bi bi-upload me-1"></i>Scan CV
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        const colors = ['primary', 'success', 'info', 'warning', 'danger'];
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="fw-bold mb-0">Extracted Skill Profile <span class="badge bg-primary rounded-pill ms-2">${skills.length}</span></h3>
                <a href="/upload_page" class="btn btn-outline-secondary btn-sm">
                    <i class="bi bi-arrow-left me-2"></i>New CV
                </a>
            </div>
            <div class="row g-3">
        `;
        skills.forEach(skill => {
            const className = skill.is_core ? 'badge bg-primary' : 'badge bg-secondary';
            html += `<span class="${className} p-2">${skill.name}</span>`;
        });

        html += '</div>';
        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger border-0 rounded-4">
                <i class="bi bi-exclamation-triangle me-2"></i>Failed to load skills. Please try again.
            </div>
        `;
        console.error(error);
    }
}

async function loadStatistics() {
    const container = document.getElementById('statisticsDiv');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const response = await fetch('/statistics');
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to load statistics');
        }
        const stats = await response.json();
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="fw-bold mb-0">Database Statistics</h3>
                <a href="/upload_page" class="btn btn-outline-secondary btn-sm">
                    <i class="bi bi-arrow-left me-2"></i>New CV
                </a>
            </div>
            <div class="row g-4">
                <div class="col-md-3 col-6">
                    <div class="card p-3 text-center border-0 shadow-sm rounded-4">
                        <div class="display-6 fw-bold text-primary">${stats.total_jobs}</div>
                        <div class="small text-muted mt-1">Total Jobs</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="card p-3 text-center border-0 shadow-sm rounded-4">
                        <div class="display-6 fw-bold text-success">${stats.user_skills}</div>
                        <div class="small text-muted mt-1">Your Skills</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="card p-3 text-center border-0 shadow-sm rounded-4">
                        <div class="display-6 fw-bold text-warning">${stats.avg_job_skills}</div>
                        <div class="small text-muted mt-1">Avg Skills/Job</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="card p-3 text-center border-0 shadow-sm rounded-4">
                        <div class="display-6 fw-bold text-info">${stats.median_job_skills}</div>
                        <div class="small text-muted mt-1">Median Skills/Job</div>
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        if (!container) return;
        container.innerHTML = `
            <div class="alert alert-warning border-0 shadow-sm rounded-4 d-flex align-items-start gap-3">
                <i class="bi bi-info-circle-fill fs-4"></i>
                <div>
                    <div class="fw-bold mb-1">Scan your CV first</div>
                    <div class="mb-2">${e.message || 'Upload and scan your CV to see personalized statistics.'}</div>
                    <a href="/upload_page" class="btn btn-primary btn-sm rounded-pill px-3">
                        <i class="bi bi-upload me-1"></i>Scan CV
                    </a>
                </div>
            </div>
        `;
    }
}

function showToast(title, message, type = 'primary') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3 shadow-lg`;
    alertDiv.style.zIndex = '9999';

    const strong = document.createElement('strong');
    strong.textContent = title;
    alertDiv.appendChild(strong);
    alertDiv.appendChild(document.createTextNode(` ${message}`));

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'alert');
    alertDiv.appendChild(closeBtn);

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}


/* --- Mock Interview Interaction --- */
let interviewState = {
    active: false,
    history: [],
    questionCount: 0,
    detectedSkills: new Set()
};

function attachAnalysisToLatestUserTurn(analysis) {
    if (!analysis) return;
    for (let i = interviewState.history.length - 1; i >= 0; i--) {
        const turn = interviewState.history[i];
        if (turn && turn.role === 'user') {
            turn.analysis = analysis;
            return;
        }
    }
}

function normalizeInterviewHistory(history = []) {
    return history.map(turn => {
        if (!turn || typeof turn !== 'object') return turn;
        const normalized = { ...turn };
        if (normalized.role === 'user' && !Object.prototype.hasOwnProperty.call(normalized, 'analysis')) {
            normalized.analysis = null;
        }
        return normalized;
    });
}

async function startInterview() {
    // 1. Fetch user profile for context
    try {
        const response = await fetch('/api/user-profile');
        const profile = await response.json();

        if (profile.active) {
            document.getElementById('interview-role-display').textContent = profile.role;
            const statusBadge = document.getElementById('interview-status-badge');
            const statusLink = document.getElementById('interview-status-link');

            if (statusBadge) statusBadge.classList.remove('d-none');
            if (statusLink) statusLink.classList.add('d-none');

            // Update Job Fit Stats
            const jobFitBox = document.getElementById('job-fit-stats');
            if (jobFitBox) {
                jobFitBox.style.display = 'block';
                document.getElementById('target-job-name').textContent = profile.target_job;
                document.getElementById('target-match-score').textContent = profile.match_score + '%';
                document.getElementById('target-match-progress').style.width = profile.match_score + '%';
            }
        } else {
            showToast('Warning', 'Please upload a CV first for a better interview experience.', 'warning');
        }
    } catch (e) {
        console.error("Failed to fetch profile", e);
    }

    const messagesDiv = document.getElementById('chat-messages');
    messagesDiv.innerHTML = ''; // Clear start prompt

    interviewState.active = true;
    interviewState.history = [];
    interviewState.questionCount = 0;
    toggleChatControls(true);
    updateQuestionCounter(0);

    // Initial Greeting from Backend
    const typingId = showTypingIndicator();
    try {
        const response = await fetch('/interview/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'init_interview', history: [] })
        });
        const data = await response.json();
        removeTypingIndicator(typingId);
        if (data.reply) {
            addChatMessage('ai', data.reply);
            interviewState.history.push({ role: 'ai', content: data.reply });
        }
    } catch (e) {
        removeTypingIndicator(typingId);
        const fallback = "Hello! Let's start the interview. Can you introduce yourself?";
        addChatMessage('ai', fallback);
        interviewState.history.push({ role: 'ai', content: fallback });
    }
}

async function startInterviewWithTopic(topicKey, topicPrompt) {
    // Start the interview first (get greeting)
    await startInterview();
    // Then auto-send the topic as the user's first message
    if (interviewState.active && topicPrompt) {
        // Small delay so the greeting appears first
        setTimeout(async () => {
            addChatMessage('user', topicPrompt);
            interviewState.history.push({ role: 'user', content: topicPrompt });

            const typingId = showTypingIndicator();
            try {
                const response = await fetch('/interview/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: topicPrompt,
                        history: normalizeInterviewHistory(interviewState.history),
                        topic_start: topicKey
                    })
                });
                const data = await response.json();
                removeTypingIndicator(typingId);
                if (data.reply) {
                    attachAnalysisToLatestUserTurn(data.analysis);
                    addChatMessage('ai', data.reply);
                    interviewState.history.push({ role: 'ai', content: data.reply });
                    interviewState.questionCount++;
                    updateQuestionCounter(interviewState.questionCount);
                }
            } catch (e) {
                removeTypingIndicator(typingId);
                addChatMessage('ai', "Let's explore that topic. Tell me more about your experience.");
            }
        }, 800);
    }
}

function toggleChatControls(active) {
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('chat-send-btn');
    if (input) { input.disabled = !active; if (active) input.focus(); }
    if (btn) btn.disabled = !active;
}

function updateQuestionCounter(count) {
    const el = document.getElementById('interview-question-count');
    if (el) el.textContent = count;
}

async function handleChatSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message || !interviewState.active) return;

    // 1. Add User Message to DOM and history
    addChatMessage('user', message);
    interviewState.history.push({ role: 'user', content: message });
    input.value = '';
    interviewState.questionCount++;
    updateQuestionCounter(interviewState.questionCount);

    // 2. Show Typing Indicator
    const typingId = showTypingIndicator();

    // 3. Call backend with updated history
    try {
        const response = await fetch('/interview/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, history: normalizeInterviewHistory(interviewState.history) })
        });

        const data = await response.json();
        removeTypingIndicator(typingId);

        if (data.reply) {
            attachAnalysisToLatestUserTurn(data.analysis);
            addChatMessage('ai', data.reply);
            interviewState.history.push({ role: 'ai', content: data.reply });
            
            // Update Live Skills in UI
            if (data.analysis && data.analysis.mentioned_skills) {
                data.analysis.mentioned_skills.forEach(s => interviewState.detectedSkills.add(s));
                updateLiveSkillsUI();
            }

            // If backend says response was too shallow, undo the question counter increment
            if (data.shallow) {
                interviewState.questionCount = Math.max(0, interviewState.questionCount - 1);
                updateQuestionCounter(interviewState.questionCount);
            }
        } else {
            const fallback = "I'm having trouble connecting. Let's try another question.";
            addChatMessage('ai', fallback);
            interviewState.history.push({ role: 'ai', content: fallback });
        }

    } catch (err) {
        removeTypingIndicator(typingId);
        const errMsg = "Error connecting to AI service. Please try again.";
        addChatMessage('ai', errMsg);
        interviewState.history.push({ role: 'ai', content: errMsg });
    }
}

function formatInterviewText(text) {
    // Escape first, then allow minimal markdown (**bold**) only
    const escaped = escapeHtml(text);
    return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function appendFormattedInterviewText(container, text) {
    const formatted = formatInterviewText(text);
    const parts = formatted.split(/(<strong>.*?<\/strong>)/g);

    parts.forEach(part => {
        if (!part) return;
        const match = part.match(/^<strong>(.*?)<\/strong>$/);
        if (match) {
            const strong = document.createElement('strong');
            strong.textContent = decodeHtmlEntities(match[1]);
            container.appendChild(strong);
        } else {
            container.appendChild(document.createTextNode(decodeHtmlEntities(part)));
        }
    });
}

function addChatMessage(role, text) {
    const messagesDiv = document.getElementById('chat-messages');
    const bubble = document.createElement('div');
    const textNode = document.createElement('span');
    const metaNode = document.createElement('span');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    bubble.className = `chat-bubble ${role} d-flex flex-column`;
    appendFormattedInterviewText(textNode, text);
    metaNode.className = 'meta';
    metaNode.textContent = timestamp;
    bubble.appendChild(textNode);
    bubble.appendChild(metaNode);

    messagesDiv.appendChild(bubble);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    // Note: history tracking is handled explicitly by each caller
}

function showTypingIndicator() {
    const messagesDiv = document.getElementById('chat-messages');
    const id = 'typing-' + Date.now();
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ai';
    bubble.id = id;
    bubble.innerHTML = '<div class="bg-dot-pulse p-2 mx-3"></div>';
    messagesDiv.appendChild(bubble);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

async function endInterview() {
    if (!interviewState.active) return;

    if (!confirm("Are you sure you want to end the interview session?")) return;

    interviewState.active = false;
    toggleChatControls(false);

    // Fetch summary from backend
    try {
        const response = await fetch('/interview/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: normalizeInterviewHistory(interviewState.history) })
        });
        const summary = await response.json();

        // 1. Fill Overall Score
        const overallEl = document.getElementById('summary-overall-score');
        if (overallEl) {
            animateValue(overallEl, 0, summary.scores.overall, 1500);
        }

        // 2. Fill Level and Feedback
        document.getElementById('summary-level').textContent = summary.assessment;
        document.getElementById('summary-feedback').textContent = summary.feedback;
        document.getElementById('summary-topics-count').textContent = summary.questions_answered;

        // 3. Render Strengths (Skills)
        const skillsContainer = document.getElementById('summary-skills');
        if (skillsContainer) {
            skillsContainer.innerHTML = '';
            (summary.detected_skills || []).forEach(s => {
                const badge = document.createElement('span');
                badge.className = 'badge bg-primary bg-opacity-10 text-primary px-3 py-2 border border-primary border-opacity-25';
                badge.textContent = s;
                skillsContainer.appendChild(badge);
            });
        }

        // 4. Render Dimension Bars
        const barsContainer = document.getElementById('summary-scores-bars');
        if (barsContainer) {
            const scores = summary.scores;
            barsContainer.innerHTML = `
                <div class="mb-3">
                    <div class="d-flex justify-content-between small mb-1">
                        <span>Technical Fit</span>
                        <span class="fw-bold">${scores.technical}%</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-primary" style="width: ${scores.technical}%"></div>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="d-flex justify-content-between small mb-1">
                        <span>Communication</span>
                        <span class="fw-bold">${scores.communication}%</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-info" style="width: ${scores.communication}%"></div>
                    </div>
                </div>
                <div class="mb-0">
                    <div class="d-flex justify-content-between small mb-1">
                        <span>STAR Structure</span>
                        <span class="fw-bold">${scores.structure}%</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-success" style="width: ${scores.structure}%"></div>
                    </div>
                </div>
            `;
        }

        // 5. Show Modal
        const modal = new bootstrap.Modal(document.getElementById('interviewSummaryModal'));
        modal.show();

    } catch (err) {
        console.error("Summary error:", err);
        showToast('Error', 'Failed to generate interview assessment.', 'danger');
    }
}

function updateLiveSkillsUI() {
    const container = document.getElementById('live-skills-container');
    const card = document.getElementById('live-skills-card');
    if (!container || interviewState.detectedSkills.size === 0) return;
    
    card.style.display = 'block';
    container.innerHTML = '';
    Array.from(interviewState.detectedSkills).forEach(skill => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 animate__animated animate__bounceIn';
        badge.style.fontSize = '0.7rem';
        badge.textContent = skill;
        container.appendChild(badge);
    });
}


function downloadTranscript() {
    if (interviewState.history.length === 0) {
        alert("No transcript available yet.");
        return;
    }

    const text = interviewState.history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Interview_Transcript.txt';
    a.click();
}

/* --- Salary Prediction Logic (Real API) --- */
async function handleSalaryPredict(e) {
    e.preventDefault();

    const roleInput = document.getElementById('salary-role');
    const expInput = document.getElementById('salary-exp');
    const locInput = document.getElementById('salary-loc');
    const btn = e.target.querySelector('button[type="submit"]');

    const role = roleInput.value;
    const exp = expInput.value;
    const location = locInput ? locInput.value : '';

    // Collect checked skills
    const skills = [];
    ['sk1', 'sk2', 'sk3', 'sk4'].forEach(id => {
        const cb = document.getElementById(id);
        if (cb && cb.checked) {
            skills.push(cb.nextElementSibling.textContent);
        }
    });

    // UI Loading State
    const originalBtnText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Calculating...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/salary-estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, exp, location, skills })
        });

        const data = await response.json();

        // Update UI
        const placeholder = document.getElementById('salary-placeholder');
        const resultSection = document.getElementById('salary-result');

        if (placeholder && resultSection) {
            placeholder.classList.add('d-none');
            resultSection.classList.remove('d-none');

            // Animate numbers
            if (data.min && data.max) {
                animateValue(document.getElementById('salary-min'), 0, data.min, 1000);
                animateValue(document.getElementById('salary-max'), 0, data.max, 1000);
            }
        }

    } catch (error) {
        showToast('Error', 'Failed to fetch salary estimate', 'danger');
        console.error(error);
    } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
    }
}

function animateValue(obj, start, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

async function autoFillSalaryFromCV() {
    try {
        const response = await fetch('/api/user-profile');
        const profile = await response.json();

        if (profile.active) {
            // Role matching (simple select value match)
            const roleSelect = document.getElementById('salary-role');
            if (roleSelect) {
                // Try to find matching option, else add it
                let found = false;
                for (let i = 0; i < roleSelect.options.length; i++) {
                    if (roleSelect.options[i].text.toLowerCase().includes(profile.role.toLowerCase())) {
                        roleSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const opt = document.createElement('option');
                    opt.text = profile.role;
                    roleSelect.add(opt);
                    roleSelect.selectedIndex = roleSelect.options.length - 1;
                }
            }

            // Location
            const locSelect = document.getElementById('salary-loc');
            if (locSelect && profile.city) {
                for (let i = 0; i < locSelect.options.length; i++) {
                    if (locSelect.options[i].text.toLowerCase().includes(profile.city.toLowerCase())) {
                        locSelect.selectedIndex = i;
                        break;
                    }
                }
            }

            // Experience (Mocking some default since we don't have exact year extraction in state yet, but let's assume 3 for now if detected role)
            document.getElementById('salary-exp').value = 3;
            document.getElementById('exp-val').textContent = '3 years';

            showToast('Auto-filled', 'Data imported from your CV analysis.', 'success');
        } else {
            showToast('Warning', 'Analyze your CV first to use auto-fill.', 'warning');
        }
    } catch (e) {
        showToast('Error', 'Could not fetch profile data.', 'danger');
    }
}

let currentSearchOffset = 0;
const SEARCH_LIMIT = 20;
let currentSortOrder = 'newest';  // Track current sort order

// Function to change sort order and refresh search
function changeSortOrder(sortValue, displayText, element) {
    currentSortOrder = sortValue;

    // Update button text
    const btn = document.getElementById('sort-dropdown-btn');
    if (btn) btn.textContent = `Sort by: ${displayText}`;

    // Update active state in dropdown
    document.querySelectorAll('.dropdown-item[data-sort]').forEach(item => {
        item.classList.remove('active');
    });
    if (element) element.classList.add('active');

    // Trigger new search
    handleJobSearch();
}

async function handleJobSearch() {
    currentSearchOffset = 0; // Reset offset on new search
    const queryInput = document.getElementById('job-search-input');
    const locationSelect = document.getElementById('search-city-filter');
    const resultsDiv = document.getElementById('searchResults');
    const countSpan = document.getElementById('search-results-count');
    const loadMoreBtn = document.getElementById('btn-load-more');

    if (!resultsDiv || !queryInput) return;

    const query = queryInput.value;
    const location = locationSelect ? locationSelect.value : 'All Locations';

    // Collect Experience Filters
    const expArr = [];
    if (document.getElementById('exp-intern')?.checked) expArr.push('intern');
    if (document.getElementById('exp-junior')?.checked) expArr.push('junior');
    if (document.getElementById('exp-senior')?.checked) expArr.push('senior');
    if (document.getElementById('exp-lead')?.checked) expArr.push('lead');
    const expParam = expArr.join(',');

    // Collect Job Type Filters
    const typeArr = [];
    if (document.getElementById('type-full')?.checked) typeArr.push('full');
    if (document.getElementById('type-part')?.checked) typeArr.push('part');
    if (document.getElementById('type-remote')?.checked) typeArr.push('remote');
    if (document.getElementById('type-contract')?.checked) typeArr.push('contract');
    const typeParam = typeArr.join(',');

    // Collect Salary Filter
    const salaryRange = document.getElementById('search-salary-range');
    const minSalary = salaryRange ? salaryRange.value : 0;

    resultsDiv.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Searching the database...</p></div>';

    try {
        const url = `/api/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&offset=0&limit=${SEARCH_LIMIT}&exp=${expParam}&type=${typeParam}&min_salary=${minSalary}&sort=${currentSortOrder}`;
        const response = await fetch(url);
        const data = await response.json();

        if (countSpan) countSpan.textContent = `(${data.total} results)`;
        resultsDiv.innerHTML = '';

        if (data.jobs.length === 0) {
            resultsDiv.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-search fs-1 opacity-25"></i><p class="mt-2">No jobs found matching your criteria.</p></div>';
            if (loadMoreBtn) loadMoreBtn.parentElement.classList.add('d-none');
            return;
        }

        renderJobsBatch(data.jobs);

        // Toggle Load More button
        if (loadMoreBtn) {
            if (data.has_more) {
                loadMoreBtn.parentElement.classList.remove('d-none');
            } else {
                loadMoreBtn.parentElement.classList.add('d-none');
            }
        }

    } catch (e) {
        console.error("Search error:", e);
        resultsDiv.innerHTML = '<div class="col-12 text-center py-5 text-danger"><p>Error connecting to search service.</p></div>';
    }
}

async function loadMoreJobs() {
    const queryInput = document.getElementById('job-search-input');
    const locationSelect = document.getElementById('search-city-filter');
    const loadMoreBtn = document.getElementById('btn-load-more');

    if (!loadMoreBtn) return;

    currentSearchOffset += SEARCH_LIMIT;
    const query = queryInput ? queryInput.value : '';
    const location = locationSelect ? locationSelect.value : 'All Locations';

    const originalText = loadMoreBtn.innerHTML;
    loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    loadMoreBtn.disabled = true;

    try {
        const expArr = [];
        const expIds = ['exp-intern', 'exp-junior', 'exp-senior', 'exp-lead'];
        expIds.forEach(id => { if (document.getElementById(id)?.checked) expArr.push(id.replace('exp-', '')); });
        const expParam = expArr.join(',');

        const typeArr = [];
        const typeIds = ['type-full', 'type-part', 'type-remote', 'type-contract'];
        typeIds.forEach(id => { if (document.getElementById(id)?.checked) typeArr.push(id.replace('type-', '')); });
        const typeParam = typeArr.join(',');

        const minSalary = document.getElementById('search-salary-range')?.value || 0;

        const url = `/api/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&offset=${currentSearchOffset}&limit=${SEARCH_LIMIT}&exp=${expParam}&type=${typeParam}&min_salary=${minSalary}&sort=${currentSortOrder}`;
        const response = await fetch(url);
        const data = await response.json();

        renderJobsBatch(data.jobs);

        if (!data.has_more) {
            loadMoreBtn.parentElement.classList.add('d-none');
        }
    } catch (e) {
        showToast('Error', 'Failed to load more jobs', 'danger');
    } finally {
        loadMoreBtn.innerHTML = originalText;
        loadMoreBtn.disabled = false;
    }
}

function renderJobsBatch(jobs) {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;

    jobs.forEach(job => {
        const card = `
            <div class="col-md-6 mb-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 hover-lift">
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="d-flex justify-content-between mb-3">
                            <span class="badge bg-primary-soft text-primary rounded-pill px-3">${job.type}</span>
                            <span class="text-muted small"><i class="bi bi-geo-alt me-1"></i>${job.location}</span>
                        </div>
                        <h5 class="fw-bold mb-1">${job.title}</h5>
                        <p class="text-muted small mb-3">${job.company}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <div class="text-primary fw-bold">${job.salary}</div>
                            <div class="d-flex flex-column gap-2" style="min-width: 120px;">
                                <a href="/job-detail/${job.id}" class="btn btn-sm btn-outline-primary rounded-pill px-3 w-100">
                                    <i class="bi bi-info-circle me-1"></i>Details
                                </a>
                                <button class="btn btn-sm btn-light rounded-pill px-3 w-100 track-btn" 
                                    data-id="${job.id}" 
                                    data-title="${escapeHtml(job.title)}" 
                                    data-company="${escapeHtml(job.company)}" 
                                    data-loc="${escapeHtml(job.location)}" 
                                    data-url="${job.url || ''}">
                                    <i class="bi bi-bookmark-plus me-1"></i>Track
                                </button>
                                <a href="${job.url}" target="_blank" class="btn btn-sm btn-primary rounded-pill px-3 w-100">
                                    <i class="bi bi-box-arrow-up-right me-1"></i>Apply
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        resultsDiv.insertAdjacentHTML('beforeend', card);
    });
}

function resetSearchFilters() {
    const queryInput = document.getElementById('job-search-input');
    const locationSelect = document.getElementById('search-city-filter');
    const salaryRange = document.getElementById('search-salary-range');
    const expChecks = ['exp-intern', 'exp-junior', 'exp-senior', 'exp-lead'];
    const typeChecks = ['type-full', 'type-part', 'type-remote', 'type-contract'];

    if (queryInput) queryInput.value = '';
    if (locationSelect) locationSelect.selectedIndex = 0;
    if (salaryRange) {
        salaryRange.value = 0;
        document.getElementById('search-salary-val').textContent = '$0k+';
    }
    expChecks.forEach(id => {
        const cb = document.getElementById(id);
        if (cb) cb.checked = true; // Check all by default for "all" results
    });
    typeChecks.forEach(id => {
        const cb = document.getElementById(id);
        if (cb) cb.checked = true; // Check all by default
    });

    handleJobSearch();
}

// Initialize Search on startup if elements exist
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('job-search-input');
    if (searchInput) {
        // Initial search to populate
        handleJobSearch();

        // Enter key listener
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleJobSearch();
        });
    }
});

/**
 * Enhanced Skills Profile rendering for skills_page
 */
async function loadEnhancedSkillsProfile() {
    const container = document.getElementById('skillsProfile');
    if (!container) return;

    try {
        const response = await fetch('/api/cv-full');
        const data = await response.json();

        if (!data.active) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-cloud-upload empty-state-icon"></i>
                    <h2 class="empty-state-title">No Skills Profile Found</h2>
                    <p class="empty-state-text">Please upload and analyze your CV to see your detailed skills profile.</p>
                    <a href="/upload_page" class="cta-button btn-primary">
                        <i class="bi bi-upload"></i> Upload CV Now
                    </a>
                </div>
            `;
            return;
        }

        const skills = data.detailed_skills || [];
        const coreSkills = skills.filter(s => s.is_core);
        const otherSkills = skills.filter(s => !s.is_core);

        let html = `
            <div class="skills-hero">
                <div class="skills-hero-content text-center">
                    <span class="badge bg-primary bg-opacity-75 mb-3 px-3 py-2 rounded-pill text-white shadow-sm border border-white border-opacity-25">AI Professional Profile</span>
                    <h1 class="display-4 fw-bold mb-2">${data.role}</h1>
                    <div class="d-flex justify-content-center gap-3 mb-4">
                        <span class="small"><i class="bi bi-geo-alt me-1"></i>${data.city}</span>
                        <span class="small"><i class="bi bi-envelope me-1"></i>${data.email}</span>
                    </div>
                    
                    <div class="profile-summary">
                        <div class="stat-card">
                            <span class="stat-number">${data.skills_count}</span>
                            <span class="stat-label">Total Skills</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-number">${data.core_skills_count}</span>
                            <span class="stat-label">Core Skills</span>
                        </div>
                    </div>

                    <div class="skills-cta mt-4">
                        <div class="d-flex flex-wrap justify-content-center gap-3">
                            <a href="/results-page" class="btn btn-primary btn-lg px-4 py-2 text-white border border-white border-opacity-25 shadow-sm">
                                <i class="bi bi-briefcase me-2"></i>View Matched Jobs
                            </a>
                            <a href="/interview-page" class="btn btn-info btn-lg px-4 py-2 text-white border border-white border-opacity-25 shadow-sm">
                                <i class="bi bi-chat-dots me-2"></i>Start Mock Interview
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Core Skills Section -->
            <div class="skills-section">
                <h3 class="section-title"><i class="bi bi-star-fill text-warning me-2"></i>Core Skills (${coreSkills.length})</h3>
                <div class="row g-4">
                    ${coreSkills.map(s => renderSkillCard(s)).join('')}
                    ${coreSkills.length === 0 ? '<div class="col-12 text-muted">No core skills detected yet.</div>' : ''}
                </div>
            </div>

            <!-- Supporting Skills Section -->
            <div class="skills-section">
                <h3 class="section-title"><i class="bi bi-lightning-charge-fill text-info me-2"></i>Supporting Skills (${otherSkills.length})</h3>
                <div class="row g-4">
                    ${otherSkills.map(s => renderSkillCard(s)).join('')}
                    ${otherSkills.length === 0 ? '<div class="col-12 text-muted">No supporting skills detected yet.</div>' : ''}
                </div>
            </div>
        `;

        container.innerHTML = html;

    } catch (error) {
        console.error("Failed to load skills profile:", error);
        container.innerHTML = '<div class="alert alert-danger">Error loading skills profile. Please try again.</div>';
    }
}

function renderSkillCard(skill) {
    return `
        <div class="col-md-6 col-lg-4">
            <div class="skill-card">
                <div class="skill-info">
                    <span class="skill-badge ${skill.is_core ? 'badge-core' : 'badge-supporting'}">
                        ${skill.is_core ? 'Core Competency' : 'Supporting'}
                    </span>
                    <h5 class="skill-name mb-1">${skill.name}</h5>
                    <div class="d-flex align-items-center">
                        <div class="progress-container">
                            <div class="progress">
                                <div class="progress-bar bg-primary" role="progressbar" style="width: ${skill.prob}%" aria-valuenow="${skill.prob}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                        <span class="skill-confidence small">${skill.prob}%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

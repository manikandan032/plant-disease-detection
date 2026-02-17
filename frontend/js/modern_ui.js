// Role Definitions
const ROLES = {
    FARMER: 'farmer',
    SHOP_OWNER: 'shop_owner',
    ADMIN: 'admin'
};

// Current User State (will be populated from backend)
let currentUser = {
    name: 'Loading...',
    email: '',
    role: ROLES.FARMER // Default role, will be overridden by checkAuth or similar
};

// Sidebar Menu Configuration
const MENU_ITEMS = {
    [ROLES.ADMIN]: [
        { label: 'Admin Dashboard', target: 'asec-analytics', icon: 'fa-gauge-high' },
        { label: 'User Management', target: 'asec-users', icon: 'fa-users' },
        { label: 'Disease Knowledge Base', target: 'asec-database', icon: 'fa-book-medical' },
        { label: 'Reports & Trends', target: 'asec-reports', icon: 'fa-file-contract' },
        { label: 'Settings', target: 'asec-settings', icon: 'fa-gear' }
    ],
    [ROLES.FARMER]: [
        { label: 'Farmer Dashboard', target: 'fsec-diagnose', icon: 'fa-table-columns' },
        { label: 'Weather Risk Alerts', target: 'fsec-weather', icon: 'fa-cloud-bolt' },
        { label: 'Crop Health History', target: 'fsec-history', icon: 'fa-clock-rotate-left' },
        { label: 'Marketplace', target: 'fsec-market', icon: 'fa-shop' },
        { label: 'My Orders', target: 'fsec-orders', icon: 'fa-receipt' },
        { label: 'AI Chatbot', target: 'fsec-chatbot', icon: 'fa-comments' },
        { label: 'Profile', target: 'fsec-profile', icon: 'fa-user' }
    ],
    [ROLES.SHOP_OWNER]: [
        { label: 'Shop Dashboard', target: 'ssec-analytics', icon: 'fa-store' }, // Default to analytics
        { label: 'Inventory / Products', target: 'ssec-inventory', icon: 'fa-boxes-stacked' },
        { label: 'Orders & Status', target: 'ssec-orders', icon: 'fa-truck-fast' },
        { label: 'Sales Analytics', target: 'ssec-analytics', icon: 'fa-chart-line' },
        { label: 'Farmer Queries', target: 'ssec-queries', icon: 'fa-circle-question' },
        { label: 'Profile', target: 'ssec-profile', icon: 'fa-user' }
    ]
};

const COMMON_ITEMS = [
    { label: 'Help / Support', target: 'help-view', icon: 'fa-circle-info' },
    { label: 'Logout', action: 'logout', icon: 'fa-right-from-bracket' }
];

document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth check (if any)
    setTimeout(initApp, 100);
});

async function fetchCurrentUser() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const response = await fetch('http://127.0.0.1:8000/api/users/me', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const user = await response.json();
            currentUser.name = user.name || 'User';
            currentUser.email = user.email || '';
            currentUser.role = user.role || ROLES.FARMER;
            // Update sidebar with user info
            updateUserProfile();
        }
    } catch (error) {
        console.error('Error fetching current user:', error);
    }
}

function initApp() {
    // Determine role from local storage or default
    const savedRole = localStorage.getItem('user_role');
    if (savedRole && Object.values(ROLES).includes(savedRole)) {
        currentUser.role = savedRole;
    }

    // Fetch current user info from backend
    fetchCurrentUser();

    // Determine page to set active (could be based on URL or generic)
    renderSidebar();

    // Mobile toggle listener
    const mobileToggle = document.querySelector('.mobile-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }
}

function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return; // Guard clause

    // Clear existing content relative to menu (keep header maybe? No, rebuild all for simplicity)
    sidebar.innerHTML = '';

    // 1. Header
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    header.innerHTML = `
        <div class="sidebar-logo">
            <i class="fa-solid fa-leaf"></i>
            <span class="logo-text">PlantShield</span>
        </div>
        <button class="sidebar-toggle-btn" onclick="toggleSidebar()">
            <i class="fa-solid fa-bars-staggered"></i>
        </button>
    `;

    // 1.5 User Profile Section
    const userSection = document.createElement('div');
    userSection.id = 'user-profile-section';
    userSection.className = 'sidebar-user-section';
    userSection.style.cssText = 'padding: 1rem; border-bottom: 1px solid var(--glass-border); text-align: center;';
    userSection.innerHTML = `
        <div style="font-weight: 600; color: var(--primary);">${currentUser.name}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${currentUser.email}</div>
        <div style="font-size: 0.7rem; color: var(--accent); margin-top: 0.3rem; text-transform: capitalize;">${currentUser.role}</div>
    `;
    sidebar.appendChild(userSection);

    // 
    sidebar.appendChild(header);

    // 2. Menu Items Container
    const menuContainer = document.createElement('div');
    menuContainer.className = 'sidebar-menu';

    const roleItems = MENU_ITEMS[currentUser.role] || [];

    roleItems.forEach((item, index) => {
        const link = createNavLink(item);
        if (index === 0) link.classList.add('active'); // Default active
        menuContainer.appendChild(link);
    });

    sidebar.appendChild(menuContainer);

    // 3. Footer (Common Items)
    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';

    COMMON_ITEMS.forEach(item => {
        const link = createNavLink(item);
        if (item.label === 'Logout') link.classList.add('text-danger');
        footer.appendChild(link);
    });

    // Profile Section Removed as per request
    // footer.appendChild(profile);

    sidebar.appendChild(footer);

    sidebar.appendChild(footer);
    
    // Initialize default view for shop owner/farmer/admin
    const defaultItem = MENU_ITEMS[currentUser.role]?.[0];
    if (defaultItem && defaultItem.target) {
        // Find the first nav link and activate it
        setTimeout(() => {
            const firstNavLink = document.querySelector('.nav-item');
            if (firstNavLink) {
                handleNavigation(defaultItem.target, firstNavLink);
            }
        }, 100);
    }
}

function createNavLink(item) {
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'nav-item';
    if (item.target) a.dataset.target = item.target;

    a.innerHTML = `<i class="fa-solid ${item.icon}"></i><span>${item.label}</span>`;

    a.addEventListener('click', (e) => {
        e.preventDefault();

        if (item.action === 'logout') {
            logout();
            return;
        }

        handleNavigation(item.target, a);
    });

    return a;
}

function handleNavigation(targetId, activeLinkElement) {
    // 1. Update Active Link UI
    document.querySelectorAll('.nav-item').forEach(link => link.classList.remove('active'));
    activeLinkElement.classList.add('active');

    // 2. Hide all Sections
    // Note: Assuming sections are still used. If separate pages are used, this runs logic for SPA-like feel:
    // If we are strictly using one page per dashboard, we might not need this. 
    // BUT the user asked for sidebar behavior which implies switching content.
    // Existing code uses sections ids.

    // 2. Hide all Sections
    // Only hide view-sections. Do NOT hide .dashboard-grid because some are nested inside views (e.g. Help, Weather)
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden'); // Use hidden class
        section.style.display = 'none'; // Force hide for inline styles
    });

    // 3. Show Target Section
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.style.display = '';
        if (targetSection.classList.contains('dashboard-grid')) {
            targetSection.style.display = 'grid';
        }

        // Trigger Loaders
        if (targetId === 'fsec-weather') loadWeather();
        if (targetId === 'fsec-history') loadHistory();
        if (targetId === 'fsec-market') loadMarketplace();
        if (targetId === 'fsec-orders') loadMyOrders();
        if (targetId === 'fsec-notifications') loadNotifications();

        if (targetId === 'ssec-orders') loadShopOrders();
        if (targetId === 'ssec-queries') loadShopQueries();
        if (targetId === 'ssec-analytics') loadShopAnalytics();
        if (targetId === 'ssec-notifications') loadNotifications();

        if (targetId === 'asec-users') loadAllUsers();
        if (targetId === 'asec-database') loadDiseaseKB();
        if (targetId === 'asec-analytics') loadAdminAnalytics();

    } else {
        showConstructionView(targetId);
    }

    // Close mobile menu
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        window.location.href = 'index.html';
    }
}

// Helper to show a "Coming Soon" for unimplemented views
function showConstructionView(targetId) {
    // Remove existing construction view
    const existing = document.getElementById('construction-view');
    if (existing) existing.remove();

    const mainContent = document.querySelector('.main-content') || document.querySelector('.container');

    const construction = document.createElement('div');
    construction.id = 'construction-view';
    construction.className = 'glass-panel view-section';
    construction.style.textAlign = 'center';
    construction.style.padding = '4rem';
    construction.innerHTML = `
        <i class="fa-solid fa-person-digging" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
        <h2 style="color: var(--primary);">Under Construction</h2>
        <p style="color: var(--text-muted);">The <strong>${targetId}</strong> feature is coming soon.</p>
    `;

    mainContent.appendChild(construction);
}

function updateUserProfile() {
    const userSection = document.getElementById('user-profile-section');
    if (userSection) {
        userSection.innerHTML = `
            <div style="font-weight: 600; color: var(--primary);">${currentUser.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${currentUser.email}</div>
            <div style="font-size: 0.7rem; color: var(--accent); margin-top: 0.3rem; text-transform: capitalize;">${currentUser.role}</div>
        `;
    }
}


// Dashboard JavaScript
class Dashboard {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        this.currentView = 'dashboard';
        
        if (!this.token) {
            window.location.href = 'login.html';
            return;
        }
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadDashboardData();
            await this.loadDashboardSummary();
            this.setupEventListeners();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Failed to load dashboard');
        }
    }
    
    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }
        
        // Search functionality
        const searchInput = document.getElementById('tailorSearch');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchTailors();
                }
            });
        }
    }
    
    async loadDashboardData() {
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.user = data.data.user;
                this.displayDashboardData(data.data);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data');
        } finally {
            this.showLoading(false);
        }
    }
    
    async loadDashboardSummary() {
        try {
            const response = await fetch('/api/dashboard/summary', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.displaySummaryData(data.data);
            }
        } catch (error) {
            console.error('Failed to load dashboard summary:', error);
        }
    }
    
    displayDashboardData(data) {
        // Update user name in navigation
        document.getElementById('userNameNav').textContent = data.user.name;
        
        // Update welcome message
        document.getElementById('welcomeMessage').textContent = `Welcome back, ${data.user.name}!`;
        
        // Update statistics
        document.getElementById('totalTailors').textContent = data.stats.totalTailors;
        document.getElementById('availableTailors').textContent = data.stats.availableTailors;
        document.getElementById('totalOrders').textContent = data.stats.totalOrders;
        document.getElementById('pendingOrders').textContent = data.stats.pendingOrders;
        
        // Update badge counts
        document.getElementById('availableTailorsBadge').textContent = data.stats.availableTailors;
        document.getElementById('allTailorsBadge').textContent = data.stats.totalTailors;
        
        // Display quick actions
        this.displayQuickActions(data.quickActions);
    }
    
    displaySummaryData(data) {
        // Display notifications
        this.displayNotifications(data.notifications);
        
        // Display recommended tailors
        this.displayRecommendedTailors(data.recommendedTailors);
    }
    
    displayQuickActions(actions) {
        const container = document.getElementById('quickActionsContainer');
        container.innerHTML = '';
        
        actions.forEach(action => {
            const actionCard = `
                <div class="col-md-6 col-lg-3 mb-3">
                    <div class="card action-card border-0 shadow-sm" onclick="dashboard.navigateTo('${action.route.substring(1)}')">
                        <div class="card-body text-center">
                            <i class="fas fa-${action.icon} action-icon text-primary mb-3"></i>
                            <h5>${action.title}</h5>
                            <p class="text-muted mb-0">${action.description}</p>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += actionCard;
        });
    }
    
    displayNotifications(notifications) {
        const container = document.getElementById('notificationsContainer');
        container.innerHTML = '';
        
        notifications.forEach(notification => {
            const notificationCard = `
                <div class="notification ${notification.type}">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-${notification.type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                        <span>${notification.message}</span>
                    </div>
                </div>
            `;
            container.innerHTML += notificationCard;
        });
    }
    
    displayRecommendedTailors(tailors) {
        const container = document.getElementById('recommendedTailorsContainer');
        
        if (tailors.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-users mb-2"></i>
                    <p class="mb-0">No recommendations available</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        tailors.forEach(tailor => {
            const tailorCard = `
                <div class="d-flex align-items-center mb-3">
                    <div class="tailor-avatar me-3">
                        ${tailor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h6 class="mb-1">${tailor.name}</h6>
                        <small class="text-muted">${tailor.specialization.join(', ')}</small>
                        <br>
                        <small class="text-muted">${tailor.experience} years exp.</small>
                    </div>
                </div>
            `;
            container.innerHTML += tailorCard;
        });
    }
    
    // Navigation methods
    navigateTo(view) {
        // Hide all views
        document.querySelectorAll('.content-view').forEach(v => v.classList.add('d-none'));
        
        // Update sidebar active state
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show selected view
        const viewElement = document.getElementById(`${view}View`);
        if (viewElement) {
            viewElement.classList.remove('d-none');
            this.currentView = view;
        }
        
        // Set active sidebar link
        const activeLink = document.querySelector(`[onclick="show${view.charAt(0).toUpperCase() + view.slice(1)}()"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Load specific view data
        this.loadViewData(view);
    }
    
    async loadViewData(view) {
        switch (view) {
            case 'profile':
                await this.loadProfile();
                break;
            case 'tailors':
                // Load initial tailor data is handled by category selection
                break;
        }
    }
    
    // Profile methods
    async loadProfile() {
        try {
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                const user = data.data.user;
                
                // Populate form fields
                document.getElementById('profileName').value = user.name || '';
                document.getElementById('profileEmail').value = user.email || '';
                document.getElementById('profilePhone').value = user.phone || '';
                document.getElementById('profileAddress').value = user.address || '';
                document.getElementById('profileBio').value = user.bio || '';
                document.getElementById('profileDateOfBirth').value = user.dateOfBirth || '';
                
                // Update verification status
                const verificationStatus = document.getElementById('verificationStatus');
                if (user.isVerified) {
                    verificationStatus.className = 'badge bg-success';
                    verificationStatus.textContent = 'Verified';
                } else {
                    verificationStatus.className = 'badge bg-warning';
                    verificationStatus.textContent = 'Pending';
                }
                
                // Update member since
                document.getElementById('memberSince').textContent = user.memberSince;
                
                // Update profile stats
                if (user.stats) {
                    document.getElementById('profileTotalOrders').textContent = user.stats.totalOrders || 0;
                }
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            this.showError('Failed to load profile');
        }
    }
    
    async updateProfile() {
        try {
            this.showLoading(true);
            
            const formData = {
                name: document.getElementById('profileName').value,
                phone: document.getElementById('profilePhone').value,
                address: document.getElementById('profileAddress').value,
                bio: document.getElementById('profileBio').value,
                dateOfBirth: document.getElementById('profileDateOfBirth').value
            };
            
            try {
                const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok && data.status === 'success') {
                    this.showSuccess('Profile updated successfully');
                    // Update user name in navigation
                    document.getElementById('userNameNav').textContent = formData.name;
                    // Update profile data without full reload
                    if (data.data && data.data.user) {
                        document.getElementById('profileName').value = data.data.user.name || '';
                        document.getElementById('profileEmail').value = data.data.user.email || '';
                        document.getElementById('profilePhone').value = data.data.user.phone || '';
                        document.getElementById('profileAddress').value = data.data.user.address || '';
                        document.getElementById('profileBio').value = data.data.user.bio || '';
                        document.getElementById('profileDateOfBirth').value = data.data.user.dateOfBirth || '';
                        
                        const verificationStatus = document.getElementById('verificationStatus');
                        if (data.data.user.isVerified) {
                            verificationStatus.className = 'badge bg-success';
                            verificationStatus.textContent = 'Verified';
                        }
                        
                        if (data.data.user.memberSince) {
                            document.getElementById('memberSince').textContent = data.data.user.memberSince;
                        }
                    }
                    
                    // Refresh dashboard data in background
                    this.loadDashboardData();
                } else {
                    throw new Error(data.message || 'Failed to update profile');
                }
            } catch (error) {
                throw error;
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            this.showError(error.message || 'Failed to update profile');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Tailor methods
    async loadTailors(endpoint, containerId) {
        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/dashboard/tailors${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.displayTailorsList(data.data.tailors, containerId);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Failed to load tailors:', error);
            this.showError('Failed to load tailors');
        } finally {
            this.showLoading(false);
        }
    }
    
    displayTailorsList(tailors, containerId = 'tailorsListContainer') {
        const container = document.getElementById(containerId);
        
        if (tailors.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-users display-1 text-muted mb-3"></i>
                    <h4>No Tailors Found</h4>
                    <p class="text-muted">Try adjusting your search criteria.</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="row">';
        tailors.forEach(tailor => {
            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card tailor-card border-0 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="tailor-avatar me-3">
                                    ${tailor.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h5 class="mb-1">${tailor.name}</h5>
                                    <small class="text-muted">${tailor.email}</small>
                                    ${tailor.isVerified ? '<i class="fas fa-check-circle text-success ms-2"></i>' : ''}
                                </div>
                            </div>
                            <div class="mb-3">
                                <strong>Experience:</strong> ${tailor.experience} years<br>
                                <strong>Specialization:</strong><br>
                                ${tailor.specialization.map(spec => `<span class="badge bg-secondary me-1">${spec}</span>`).join('')}
                            </div>
                            <div class="d-grid">
                                <button class="btn btn-outline-primary" onclick="dashboard.viewTailorProfile('${tailor._id}')">
                                    <i class="fas fa-eye me-2"></i>View Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }
    
    async viewTailorProfile(tailorId) {
        try {
            const response = await fetch(`/api/dashboard/tailors/${tailorId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // You can implement a modal or detailed view here
                alert(`Tailor: ${data.data.tailor.name}\nExperience: ${data.data.tailor.experience} years\nSpecialization: ${data.data.tailor.specialization.join(', ')}`);
            }
        } catch (error) {
            console.error('Failed to load tailor profile:', error);
        }
    }
    
    async searchTailors() {
        const searchTerm = document.getElementById('tailorSearch').value;
        const specialization = document.getElementById('specializationFilter').value;
        
        let endpoint = '?';
        if (searchTerm) endpoint += `search=${encodeURIComponent(searchTerm)}&`;
        if (specialization) endpoint += `specialization=${encodeURIComponent(specialization)}&`;
        
        await this.loadTailors(endpoint, 'tailorsListContainer');
    }
    
    filterTailors() {
        this.searchTailors();
    }
    
    clearFilters() {
        document.getElementById('tailorSearch').value = '';
        document.getElementById('specializationFilter').value = '';
        this.loadTailors('', 'tailorsListContainer');
    }
    
    // Utility methods
    showLoading(show) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingOverlay';
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p class="mt-2">Loading...</p>
            </div>
        `;

        if (show) {
            // Remove existing overlay if any
            const existingOverlay = document.getElementById('loadingOverlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
            document.body.appendChild(loadingDiv);
        } else {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.remove();
            }
        }
    }
    
    showSuccess(message) {
        // Create and show toast notification
        const toast = document.createElement('div');
        toast.className = 'toast show position-fixed top-0 end-0 m-4';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.style.zIndex = '9999';
        
        toast.innerHTML = `
            <div class="toast-header bg-success text-white">
                <i class="fas fa-check-circle me-2"></i>
                <strong class="me-auto">Success</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    showError(message) {
        // Create and show toast notification
        const toast = document.createElement('div');
        toast.className = 'toast show position-fixed top-0 end-0 m-4';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.style.zIndex = '9999';
        
        toast.innerHTML = `
            <div class="toast-header bg-danger text-white">
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong class="me-auto">Error</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    logout() {
        localStorage.removeItem('token');
        window.location.href = 'customer-auth.html';
    }
}

// Navigation functions (called from HTML)
function showDashboard() {
    dashboard.navigateTo('dashboard');
}

function showOrderNow() {
    dashboard.navigateTo('orderNow');
}

function showItems() {
    dashboard.navigateTo('items');
}

function showTailors() {
    dashboard.navigateTo('tailors');
}

function showProfile() {
    dashboard.navigateTo('profile');
}

function loadAvailableTailors() {
    dashboard.loadTailors('/available', 'tailorsListContainer');
}

function loadBookedTailors() {
    dashboard.loadTailors('/booked', 'tailorsListContainer');
}

function loadAllTailors() {
    dashboard.loadTailors('', 'tailorsListContainer');
}

function searchTailors() {
    dashboard.searchTailors();
}

function filterTailors() {
    dashboard.filterTailors();
}

function clearFilters() {
    dashboard.clearFilters();
}

function logout() {
    dashboard.logout();
}

// Initialize dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});

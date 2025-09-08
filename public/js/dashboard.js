// Dashboard.js - Main dashboard functionality handler

var lastProfileData = null;  // Store the last profile data

function Dashboard() {
    this.currentView = 'dashboard';
    this.init();
}

Dashboard.prototype = {
    init: function() {
        this.initializeEventListeners();
        this.loadUserProfile();
        this.loadRecentActivities();
        this.setupToastNotification();
        this.setupViewHandlers();
        this.initializeQuickActions();
        this.setupURLRouting(); // Add URL routing
        this.handleInitialRoute(); // Handle initial page load
    },

    setupViewHandlers: function() {
        // Hide all views initially
        var views = document.querySelectorAll('.content-view');
        for (var i = 0; i < views.length; i++) {
            views[i].classList.add('d-none');
        }

        // Don't show default view here - let routing handle it

        // Setup navigation event listeners
        var self = this;
        var navItems = document.querySelectorAll('.nav-item');
        for (var j = 0; j < navItems.length; j++) {
            navItems[j].addEventListener('click', function(e) {
                // Don't prevent default - let the hash navigation work
                var section = this.getAttribute('data-section');
                // The hash change will trigger the route handler
            });
        }
    },

    switchView: function(viewName, updateURL = true) {
        console.log('Switching to view:', viewName);
        
        // Update URL hash if requested
        if (updateURL) {
            window.location.hash = viewName;
        }
        
        // Hide all views
        var views = document.querySelectorAll('.content-view');
        for (var i = 0; i < views.length; i++) {
            views[i].classList.add('d-none');
        }

        // Remove active class from all nav items
        var navItems = document.querySelectorAll('.nav-item');
        for (var i = 0; i < navItems.length; i++) {
            navItems[i].classList.remove('active');
        }

        // Show selected view
        var viewElement = document.getElementById(viewName + 'View');
        if (viewElement) {
            console.log('Found view element:', viewName + 'View');
            viewElement.classList.remove('d-none');
            // Add active class to nav item
            var navItem = document.querySelector('.nav-item[data-section="' + viewName + '"]');
            if (navItem) {
                console.log('Found nav item for:', viewName);
                navItem.classList.add('active');
            }
            this.currentView = viewName;

            // Special handling for profile view
            if (viewName === 'profile') {
                console.log('Loading profile data');
                this.loadUserProfile();
            }
            
            // Special handling for order view
            if (viewName === 'orderNow' && window.dashboardOrderHandler) {
                console.log('Initializing order form');
                // Reinitialize the order handler to make sure everything is set up
                window.dashboardOrderHandler.init();
            }

            // Special handling for tailors view
            if (viewName === 'tailors') {
                console.log('Loading tailors view');
                this.initializeTailorsView();
            }
            
            // Special handling for items view
            if (viewName === 'items') {
                console.log('Loading items view');
                this.loadUserOrders();
                this.startOrdersAutoRefresh();
            } else {
                // Stop auto-refresh when leaving items view
                this.stopOrdersAutoRefresh();
            }
            
            // Special handling for reviews view
            if (viewName === 'reviews') {
                console.log('Loading reviews view');
                this.loadReviewsData();
            }
        } else {
            console.error('View element not found:', viewName + 'View');
        }

        // Close profile menu if it's open
        var profileMenu = document.getElementById('profileMenu');
        if (profileMenu && profileMenu.classList.contains('show')) {
            profileMenu.classList.remove('show');
        }
    },

    // URL Routing Functions
    setupURLRouting: function() {
        var self = this;
        // Listen for hash changes
        window.addEventListener('hashchange', function() {
            self.handleRouteChange();
        });
    },

    handleInitialRoute: function() {
        var hash = window.location.hash.substring(1); // Remove the # symbol
        var validViews = ['dashboard', 'orderNow', 'items', 'tailors', 'reviews', 'profile'];
        
        // If no hash or invalid hash, default to dashboard
        if (!hash || validViews.indexOf(hash) === -1) {
            hash = 'dashboard';
            window.location.hash = hash;
        }
        
        // Switch to the view without updating URL (to avoid double update)
        this.switchView(hash, false);
    },

    handleRouteChange: function() {
        var hash = window.location.hash.substring(1); // Remove the # symbol
        var validViews = ['dashboard', 'orderNow', 'items', 'tailors', 'reviews', 'profile'];
        
        // If invalid hash, default to dashboard
        if (!hash || validViews.indexOf(hash) === -1) {
            hash = 'dashboard';
        }
        
        // Switch to the view without updating URL (to avoid infinite loop)
        this.switchView(hash, false);
    },

    // Helper function for external scripts to navigate
    navigateTo: function(viewName) {
        window.location.hash = viewName;
    },

    initializeQuickActions: function() {
        var quickActionsContainer = document.getElementById('quickActionsContainer');
        if (!quickActionsContainer) return;

        var quickActions = [
            {
                title: 'Place New Order',
                description: 'Start ordering your custom garments',
                icon: 'fas fa-plus-circle',
                color: 'primary',
                action: function() {
                    dashboard.switchView('orderNow');
                }
            },
            {
                title: 'Browse Tailors',
                description: 'Find the perfect tailor for your needs',
                icon: 'fas fa-users',
                color: 'info',
                action: function() {
                    dashboard.switchView('tailors');
                }
            },
            {
                title: 'View My Orders',
                description: 'Track your current orders',
                icon: 'fas fa-list-alt',
                color: 'success',
                action: function() {
                    dashboard.switchView('items');
                }
            },
            {
                title: 'Update Profile',
                description: 'Edit your personal information',
                icon: 'fas fa-user-edit',
                color: 'warning',
                action: function() {
                    dashboard.switchView('profile');
                }
            }
        ];

        quickActionsContainer.innerHTML = quickActions.map(function(action) {
            return `
                <div class="col-md-6 col-lg-3 mb-3">
                    <div class="card quick-action-card border-0 shadow-sm h-100" onclick="(${action.action.toString()})()">
                        <div class="card-body text-center p-4">
                            <div class="quick-action-icon text-${action.color} mb-3">
                                <i class="${action.icon} fa-2x"></i>
                            </div>
                            <h5 class="card-title">${action.title}</h5>
                            <p class="card-text text-muted">${action.description}</p>
                            <button class="btn btn-outline-${action.color} btn-sm">
                                Get Started <i class="fas fa-arrow-right ms-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    initializeEventListeners: function() {
        var self = this;
        
        // Profile dropdown toggle
        var profileBtn = document.querySelector('.profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', function(e) {
                e.preventDefault();
                var profileMenu = document.getElementById('profileMenu');
                if (profileMenu) profileMenu.classList.toggle('show');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.profile-dropdown')) {
                var profileMenu = document.getElementById('profileMenu');
                if (profileMenu && profileMenu.classList.contains('show')) {
                    profileMenu.classList.remove('show');
                }
            }
        });

        // Profile image upload handling
        var profileImageInput = document.getElementById('profile-image-input');
        if (profileImageInput) {
            profileImageInput.addEventListener('change', function(e) {
                self.handleProfileImageUpload(e);
            });
        }

        // Profile form submission
        var profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', function(e) {
                self.handleProfileUpdate(e);
            });
        }

        // Bio character count
        var bioInput = document.getElementById('profileBio');
        var bioCount = document.getElementById('bioCharCount');
        if (bioInput && bioCount) {
            bioInput.addEventListener('input', function() {
                bioCount.textContent = this.value.length;
            });
        }
    },

    loadUserProfile: function() {
        var self = this;
        fetch('/api/profile', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
        .then(function(response) {
            if (!response.ok) throw new Error('Failed to fetch profile');
            return response.json();
        })
        .then(function(profile) {
            console.log('Profile data loaded:', profile);
            self.updateProfileUI(profile);
            // Store the profile data in localStorage
            localStorage.setItem('userProfile', JSON.stringify(profile));
        })
        .catch(function(error) {
            console.error('Error loading profile:', error);
            // Try to load from localStorage if available
            var cachedProfile = localStorage.getItem('userProfile');
            if (cachedProfile) {
                console.log('Loading profile from cache');
                self.updateProfileUI(JSON.parse(cachedProfile));
            }
            self.showToast('Error loading profile', 'error');
        });
    },

    loadRecentActivities: function() {
        var self = this;
        fetch('/api/activities/user', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
        .then(function(response) {
            if (!response.ok) throw new Error('Failed to fetch activities');
            return response.json();
        })
        .then(function(result) {
            console.log('Activities loaded:', result);
            self.updateActivitiesUI(result.activities);
        })
        .catch(function(error) {
            console.error('Error loading activities:', error);
            self.updateActivitiesUI([]);
        });
    },

    updateActivitiesUI: function(activities) {
        var container = document.getElementById('recentActivityContainer');
        if (!container) return;

        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-clock text-muted fa-3x mb-3"></i>
                    <p class="text-muted">No recent activity to display</p>
                    <p class="text-muted small">Start using the platform to see your activity here!</p>
                </div>
            `;
            return;
        }

        var activitiesHTML = activities.map(function(activity) {
            var timeAgo = self.getTimeAgo(activity.createdAt);
            return `
                <div class="activity-item d-flex align-items-start mb-3 p-3 bg-white rounded shadow-sm">
                    <div class="activity-icon me-3">
                        <i class="${activity.icon} ${activity.iconColor} fa-lg"></i>
                    </div>
                    <div class="activity-content flex-grow-1">
                        <h6 class="activity-title mb-1">${activity.title}</h6>
                        <p class="activity-description mb-1 text-muted">${activity.description}</p>
                        <small class="activity-time text-muted">
                            <i class="fas fa-clock me-1"></i>${timeAgo}
                        </small>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = activitiesHTML;
    },

    getTimeAgo: function(dateString) {
        var now = new Date();
        var date = new Date(dateString);
        var diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            var minutes = Math.floor(diffInSeconds / 60);
            return minutes + ' minute' + (minutes > 1 ? 's' : '') + ' ago';
        } else if (diffInSeconds < 86400) {
            var hours = Math.floor(diffInSeconds / 3600);
            return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
        } else if (diffInSeconds < 604800) {
            var days = Math.floor(diffInSeconds / 86400);
            return days + ' day' + (days > 1 ? 's' : '') + ' ago';
        } else {
            return date.toLocaleDateString();
        }
    },

    updateProfileUI: function(profile) {
        var data = profile.data ? profile.data.user : profile;
        console.log('Updating profile UI with:', data);

        // Update header section and profile button
        var mainNameDisplay = document.getElementById('main-name-display');
        var bioDisplay = document.getElementById('bio-display');
        var dropdownProfileName = document.getElementById('dropdownProfileName');
        var dropdownProfileBio = document.getElementById('dropdownProfileBio');
        var menuProfileName = document.getElementById('menuProfileName');
        var menuProfileEmail = document.getElementById('menuProfileEmail');

        if (mainNameDisplay) {
            mainNameDisplay.textContent = data.name || 'Loading...';
        }
        if (bioDisplay) {
            bioDisplay.textContent = data.bio || 'No bio added yet';
        }
        if (dropdownProfileName) {
            dropdownProfileName.textContent = data.name || 'Loading...';
        }
        if (dropdownProfileBio) {
            dropdownProfileBio.textContent = data.bio || 'No bio added yet';
        }
        if (menuProfileName) {
            menuProfileName.textContent = data.name || 'Loading...';
        }
        if (menuProfileEmail) {
            menuProfileEmail.textContent = data.email || '';
        }

        // Update profile images
        var imageIds = ['profileAvatar', 'topNavProfileImage', 'menuProfileImage'];
        for (var i = 0; i < imageIds.length; i++) {
            var img = document.getElementById(imageIds[i]);
            if (img) {
                img.src = data.profilePicture || 'https://via.placeholder.com/150';
                img.onerror = function() {
                    this.src = 'https://via.placeholder.com/150';
                };
            }
        }

        // Update form fields
        var formElements = {
            name: document.getElementById('profileName'),
            email: document.getElementById('profileEmail'),
            phone: document.getElementById('profilePhone'),
            address: document.getElementById('profileAddress'),
            bio: document.getElementById('profileBio'),
            dateOfBirth: document.getElementById('profileDateOfBirth')
        };

        if (formElements.name) formElements.name.value = data.name || '';
        if (formElements.email) {
            formElements.email.value = data.email || '';
            formElements.email.readOnly = true; // Ensure email is readonly
        }
        if (formElements.phone) formElements.phone.value = data.phone || '';
        if (formElements.address) formElements.address.value = data.address || '';
        if (formElements.bio) {
            formElements.bio.value = data.bio || '';
            var bioCharCount = document.getElementById('bioCharCount');
            if (bioCharCount) {
                bioCharCount.textContent = (data.bio || '').length;
            }
        }
        if (formElements.dateOfBirth && data.dateOfBirth) {
            var date = new Date(data.dateOfBirth);
            formElements.dateOfBirth.value = date.toISOString().split('T')[0];
        }

        // Update member since date
        var memberSince = document.getElementById('memberSince');
        if (memberSince && data.createdAt) {
            var joinDate = new Date(data.createdAt);
            memberSince.textContent = joinDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Update verification badge
        var verificationBadge = document.getElementById('verificationBadge');
        if (verificationBadge) {
            verificationBadge.className = 'badge bg-success ms-2';
            verificationBadge.innerHTML = '<i class="fas fa-check-circle me-1"></i>Verified';
        }

        // Update account status
        var accountStatus = document.getElementById('accountStatus');
        if (accountStatus) {
            accountStatus.className = 'badge bg-success';
            accountStatus.textContent = 'Active';
        }

        // Update measurements if they exist
        if (data.measurements) {
            this.updateMeasurements(data.measurements);
        }

        // Update total orders
        var profileTotalOrders = document.getElementById('profileTotalOrders');
        if (profileTotalOrders) {
            profileTotalOrders.textContent = data.totalOrders || '0';
        }

        // Store the profile data for later use
        lastProfileData = data;
    },

    updateMeasurements: function(measurements) {
        var measurementsContainer = document.getElementById('savedMeasurements');
        if (!measurementsContainer) return;

        var measurementHTML = '';
        for (var key in measurements) {
            if (measurements.hasOwnProperty(key)) {
                measurementHTML += '<div class="measurement-item">' +
                    '<span class="measurement-label">' + key + '</span>' +
                    '<span class="measurement-value">' + measurements[key] + ' inches</span>' +
                    '</div>';
            }
        }

        measurementsContainer.innerHTML = measurementHTML;
    },

    handleProfileImageUpload: function(event) {
        var self = this;
        console.log('Profile image upload started');
        var file = event.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('File selected:', {
            type: file.type,
            size: file.size,
            name: file.name
        });

        // Check if file is an image
        if (!file.type.match(/^image\//)) {
            this.showToast('Please select an image file', 'error');
            console.log('Invalid file type:', file.type);
            return;
        }

        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('Image size should be less than 10MB', 'error');
            console.log('File too large:', file.size);
            return;
        }

        // Create loading state
        var uploadButton = document.querySelector('.avatar-upload-btn');
        var loadingOverlay = document.getElementById('loadingOverlay');
        
        if (uploadButton) {
            uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            uploadButton.style.pointerEvents = 'none';
        }
        if (loadingOverlay) loadingOverlay.classList.remove('d-none');

        // Get the authentication token if available
        var token = localStorage.getItem('token');
        var formData = new FormData();
        formData.append('profilePicture', file);

        var headers = {};
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        fetch('/api/profile/image', {
            method: 'POST',
            headers: headers,
            credentials: 'include',
            body: formData
        })
        .then(function(response) {
            return response.json().then(function(data) {
                if (!response.ok) throw new Error(data.message || 'Upload failed');
                return data;
            });
        })
        .then(function(result) {
            if (result.imageUrl) {
                // Add timestamp to bypass cache
                var imageUrl = result.imageUrl + '?t=' + new Date().getTime();
                
                // Update localStorage with new image URL
                var currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                if (currentProfile.data && currentProfile.data.user) {
                    currentProfile.data.user.profilePicture = result.imageUrl;
                    localStorage.setItem('userProfile', JSON.stringify(currentProfile));
                }

                self.updateProfileImages(imageUrl);
                self.showToast('Profile image updated successfully', 'success');
            } else {
                throw new Error('No image URL in response');
            }
        })
        .catch(function(error) {
            console.error('Upload error:', error);
            self.showToast(error.message || 'Failed to upload profile image', 'error');
            self.updateProfileImages(); // Will use default images
        })
        .finally(function() {
            if (uploadButton) {
                uploadButton.innerHTML = '<i class="fas fa-camera"></i> <span class="ms-2">Change Photo</span>';
                uploadButton.style.pointerEvents = 'auto';
            }
            if (loadingOverlay) loadingOverlay.classList.add('d-none');
            event.target.value = '';
        });
    },

    updateProfileImages: function(imageUrl) {
        var imageElements = [
            { id: 'profileAvatar', defaultUrl: 'https://via.placeholder.com/150' },
            { id: 'topNavProfileImage', defaultUrl: 'https://via.placeholder.com/32' },
            { id: 'menuProfileImage', defaultUrl: 'https://via.placeholder.com/48' }
        ];

        for (var i = 0; i < imageElements.length; i++) {
            var elem = imageElements[i];
            var imgElement = document.getElementById(elem.id);
            if (imgElement) {
                imgElement.src = imageUrl || elem.defaultUrl;
                imgElement.onerror = function() {
                    this.src = elem.defaultUrl;
                };
            }
        }
    },

    handleProfileUpdate: function(event) {
        var self = this;
        event.preventDefault();
        console.log('Handling profile update');
        
        // Show loading state
        var saveButton = event.target.querySelector('button[type="submit"]');
        var originalButtonText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;

        var formData = new FormData(event.target);
        var profileData = {};
        formData.forEach(function(value, key) {
            profileData[key] = value;
        });

        console.log('Submitting profile data:', profileData);

        // Get auth token
        var token = localStorage.getItem('token');
        var headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        };

        fetch('/api/profile', {
            method: 'PUT',
            headers: headers,
            credentials: 'include',
            body: JSON.stringify(profileData)
        })
        .then(function(response) {
            return response.json().then(function(data) {
                if (!response.ok) throw new Error(data.message || 'Failed to update profile');
                return data;
            });
        })
        .then(function(result) {
            console.log('Profile update successful:', result);
            
            // Immediately update the header and profile button
            var mainNameDisplay = document.getElementById('main-name-display');
            var bioDisplay = document.getElementById('bio-display');
            var dropdownProfileName = document.getElementById('dropdownProfileName');
            var dropdownProfileBio = document.getElementById('dropdownProfileBio');
            var menuProfileName = document.getElementById('menuProfileName');
            var menuProfileEmail = document.getElementById('menuProfileEmail');
            
            if (mainNameDisplay && profileData.name) {
                mainNameDisplay.textContent = profileData.name;
            }
            if (bioDisplay && profileData.bio) {
                bioDisplay.textContent = profileData.bio;
            }
            if (dropdownProfileName && profileData.name) {
                dropdownProfileName.textContent = profileData.name;
            }
            if (dropdownProfileBio && profileData.bio) {
                dropdownProfileBio.textContent = profileData.bio;
            }
            if (menuProfileName && profileData.name) {
                menuProfileName.textContent = profileData.name;
            }
            if (menuProfileEmail) {
                menuProfileEmail.textContent = profileData.email || '';
            }

            // Update localStorage with new data
            var currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            var updatedProfile = {
                ...currentProfile,
                data: {
                    ...currentProfile.data,
                    user: {
                        ...currentProfile.data?.user,
                        ...profileData
                    }
                }
            };
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

            // Update all profile data
            self.loadUserProfile();
            self.showToast('Profile updated successfully', 'success');
        })
        .catch(function(error) {
            console.error('Profile update error:', error);
            self.showToast(error.message || 'Failed to update profile', 'error');
        })
        .finally(function() {
            saveButton.innerHTML = originalButtonText;
            saveButton.disabled = false;
        });
    },

    logout: function() {
        var self = this;
        fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        })
        .then(function() {
            window.location.href = '/';
        })
        .catch(function(error) {
            self.showToast('Logout failed', 'error');
        });
    },

    showProfile: function() {
        this.switchView('profile');
        // Also load profile data
        this.loadUserProfile();
    },

    setupToastNotification: function() {
        var toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    },

    showToast: function(message, type) {
        type = type || 'info';
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;

        var container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        container.appendChild(toast);

        setTimeout(function() {
            toast.classList.add('fade-out');
            setTimeout(function() {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },

    // Tailors functionality
    initializeTailorsView: function() {
        this.setupTailorSearch();
        this.loadTailorsBadges();
        // Load all tailors by default
        this.loadAllTailors();
    },

    setupTailorSearch: function() {
        var self = this;
        var searchInput = document.getElementById('tailorSearch');
        var specializationFilter = document.getElementById('specializationFilter');

        if (searchInput) {
            searchInput.addEventListener('input', function() {
                self.filterTailors();
            });
        }

        if (specializationFilter) {
            specializationFilter.addEventListener('change', function() {
                self.filterTailors();
            });
        }
    },

    loadTailorsBadges: function() {
        var self = this;
        
        // Load all tailors count - public endpoint, no auth needed
        fetch('/api/tailors', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            console.log('Tailors API response status:', response.status);
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            return response.json();
        })
        .then(function(result) {
            console.log('Tailors API result:', result);
            if (result.success && result.tailors) {
                document.getElementById('allTailorsBadge').textContent = result.tailors.length;
                
                // For available tailors, show all tailors (as requested)
                document.getElementById('availableTailorsBadge').textContent = result.tailors.length;

                // Load booked tailors count (this requires auth)
                self.loadBookedTailorsCount();
            } else {
                console.error('Invalid response format:', result);
                self.showToast('Failed to load tailors', 'error');
            }
        })
        .catch(function(error) {
            console.error('Error loading tailor badges:', error);
            self.showToast('Failed to load tailors: ' + error.message, 'error');
        });
    },

    loadBookedTailorsCount: function() {
        var self = this;
        
        // Fetch orders to count unique booked tailors
        fetch('/api/orders/user', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if (result.success && result.orders) {
                // Count unique tailor IDs from orders
                var bookedTailorIds = [];
                result.orders.forEach(function(order) {
                    if (order.tailor && order.tailor._id && bookedTailorIds.indexOf(order.tailor._id) === -1) {
                        bookedTailorIds.push(order.tailor._id);
                    }
                });
                document.getElementById('bookedTailorsBadge').textContent = bookedTailorIds.length;
            } else {
                document.getElementById('bookedTailorsBadge').textContent = '0';
            }
        })
        .catch(function(error) {
            console.error('Error loading booked tailors count:', error);
            document.getElementById('bookedTailorsBadge').textContent = '0';
        });
    },

    loadAllTailors: function() {
        var self = this;
        this.currentTailorFilter = 'all';
        this.setActiveTailorCategory('all');
        
        // Public endpoint, no auth needed
        fetch('/api/tailors', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            console.log('LoadAllTailors API response status:', response.status);
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            return response.json();
        })
        .then(function(result) {
            console.log('LoadAllTailors API result:', result);
            if (result.success && result.tailors) {
                self.allTailors = result.tailors;
                self.renderTailorsList(result.tailors, 'All Tailors');
            } else {
                console.error('Invalid response format:', result);
                self.showToast('Failed to load tailors', 'error');
            }
        })
        .catch(function(error) {
            console.error('Error loading tailors:', error);
            self.showToast('Failed to load tailors: ' + error.message, 'error');
        });
    },

    loadAvailableTailors: function() {
        var self = this;
        this.currentTailorFilter = 'available';
        this.setActiveTailorCategory('available');
        
        if (this.allTailors) {
            // For now, show all tailors as available (as requested)
            var availableTailors = this.allTailors; // Show all tailors
            this.renderTailorsList(availableTailors, 'Available Tailors');
        } else {
            // Load tailors first
            fetch('/api/tailors', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                return response.json();
            })
            .then(function(result) {
                if (result.success && result.tailors) {
                    self.allTailors = result.tailors;
                    self.renderTailorsList(result.tailors, 'Available Tailors');
                } else {
                    self.showToast('Failed to load tailors', 'error');
                }
            })
            .catch(function(error) {
                console.error('Error loading available tailors:', error);
                self.showToast('Failed to load tailors: ' + error.message, 'error');
            });
        }
    },

    loadBookedTailors: function() {
        var self = this;
        this.currentTailorFilter = 'booked';
        this.setActiveTailorCategory('booked');
        
        // Fetch orders to get booked tailors
        fetch('/api/orders/user', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if (result.success && result.orders) {
                // Extract unique tailor IDs from orders
                var bookedTailorIds = [];
                result.orders.forEach(function(order) {
                    if (order.tailor && order.tailor._id && bookedTailorIds.indexOf(order.tailor._id) === -1) {
                        bookedTailorIds.push(order.tailor._id);
                    }
                });

                // Filter tailors that are in the booked list
                var bookedTailors = [];
                if (self.allTailors) {
                    bookedTailors = self.allTailors.filter(function(tailor) {
                        return bookedTailorIds.indexOf(tailor._id) !== -1;
                    });
                }

                self.renderTailorsList(bookedTailors, 'Booked Tailors');
            } else {
                self.renderTailorsList([], 'Booked Tailors');
            }
        })
        .catch(function(error) {
            console.error('Error loading booked tailors:', error);
            self.renderTailorsList([], 'Booked Tailors');
        });
    },

    setActiveTailorCategory: function(category) {
        // Remove active class from all category cards
        var categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(function(card) {
            card.classList.remove('active');
        });

        // Add active class to selected category
        var activeCard;
        if (category === 'all') {
            activeCard = document.querySelector('.category-card[onclick="loadAllTailors()"]');
        } else if (category === 'available') {
            activeCard = document.querySelector('.category-card[onclick="loadAvailableTailors()"]');
        } else if (category === 'booked') {
            activeCard = document.querySelector('.category-card[onclick="loadBookedTailors()"]');
        }

        if (activeCard) {
            activeCard.classList.add('active');
        }
    },

    renderTailorsList: function(tailors, title) {
        var container = document.getElementById('tailorsListContainer');
        if (!container) return;

        if (!tailors || tailors.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-user-times display-1 text-muted mb-3"></i>
                    <h4>No ${title} Found</h4>
                    <p class="text-muted">No tailors match your current selection.</p>
                </div>
            `;
            return;
        }

        var tailorsHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>${title} (${tailors.length})</h3>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-secondary" onclick="dashboard.toggleTailorView('grid')" id="gridViewBtn">
                        <i class="fas fa-th"></i> Grid
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="dashboard.toggleTailorView('list')" id="listViewBtn">
                        <i class="fas fa-list"></i> List
                    </button>
                </div>
            </div>
            <div class="row" id="tailorsGrid">
        `;

        tailors.forEach(function(tailor) {
            var experienceText = tailor.experience ? tailor.experience + ' years' : 'Not specified';
            var ratingStars = '';
            var rating = tailor.averageRating || 0;
            
            for (var i = 1; i <= 5; i++) {
                if (i <= rating) {
                    ratingStars += '<i class="fas fa-star text-warning"></i>';
                } else {
                    ratingStars += '<i class="far fa-star text-muted"></i>';
                }
            }

            var specializationsHtml = '';
            if (tailor.specializations && tailor.specializations.length > 0) {
                specializationsHtml = tailor.specializations.slice(0, 3).map(function(spec) {
                    return `<span class="badge bg-primary me-1 mb-1">${spec}</span>`;
                }).join('');
                if (tailor.specializations.length > 3) {
                    specializationsHtml += `<span class="badge bg-secondary me-1 mb-1">+${tailor.specializations.length - 3}</span>`;
                }
            }

            tailorsHTML += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm tailor-card" data-tailor-id="${tailor._id}">
                        <div class="card-header bg-white border-0 text-center">
                            <img src="${tailor.profilePicture || 'https://via.placeholder.com/80'}" 
                                 alt="${tailor.name}" 
                                 class="rounded-circle mb-2" 
                                 style="width: 80px; height: 80px; object-fit: cover;">
                            <h5 class="card-title mb-1">${tailor.name}</h5>
                            <div class="mb-2">${ratingStars} <small class="text-muted">(${tailor.totalReviews || 0})</small></div>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <small class="text-muted d-block">Specializations:</small>
                                ${specializationsHtml || '<span class="text-muted">Not specified</span>'}
                            </div>
                            <div class="row text-center mb-3">
                                <div class="col-6">
                                    <small class="text-muted d-block">Experience</small>
                                    <strong>${experienceText}</strong>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted d-block">Location</small>
                                    <strong>${tailor.location || 'Not specified'}</strong>
                                </div>
                            </div>
                            ${tailor.bio ? `<p class="card-text text-muted small">${tailor.bio.substring(0, 100)}${tailor.bio.length > 100 ? '...' : ''}</p>` : ''}
                        </div>
                        <div class="card-footer bg-white border-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge ${tailor.isApproved ? 'bg-success' : 'bg-warning'}">
                                    ${tailor.isApproved ? 'Verified' : 'Pending'}
                                </span>
                                <div>
                                    <button class="btn btn-sm btn-outline-primary me-1" onclick="dashboard.viewTailorProfile('${tailor._id}')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    <button class="btn btn-sm btn-primary" onclick="dashboard.selectTailorForOrder('${tailor._id}')">
                                        <i class="fas fa-plus"></i> Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        tailorsHTML += '</div>';
        container.innerHTML = tailorsHTML;

        // Set default view to grid
        this.toggleTailorView('grid');
    },

    filterTailors: function() {
        if (!this.allTailors) return;

        var searchTerm = document.getElementById('tailorSearch').value.toLowerCase();
        var selectedSpecialization = document.getElementById('specializationFilter').value;

        var filteredTailors = this.allTailors.filter(function(tailor) {
            var matchesSearch = !searchTerm || 
                tailor.name.toLowerCase().includes(searchTerm) ||
                (tailor.bio && tailor.bio.toLowerCase().includes(searchTerm)) ||
                (tailor.location && tailor.location.toLowerCase().includes(searchTerm));

            var matchesSpecialization = !selectedSpecialization || 
                (tailor.specializations && tailor.specializations.includes(selectedSpecialization));

            // Apply current filter (all/available/booked)
            var matchesCurrentFilter = true;
            if (this.currentTailorFilter === 'available') {
                // For available tailors, show all (as requested)
                matchesCurrentFilter = true;
            } else if (this.currentTailorFilter === 'booked') {
                // For booked tailors, this will be handled by the loadBookedTailors function
                // which pre-filters the tailors, so here we just return true
                matchesCurrentFilter = true;
            }

            return matchesSearch && matchesSpecialization && matchesCurrentFilter;
        }.bind(this));

        var title = this.currentTailorFilter === 'all' ? 'All Tailors' :
                   this.currentTailorFilter === 'available' ? 'Available Tailors' : 'Booked Tailors';
        
        this.renderTailorsList(filteredTailors, title);
    },

    toggleTailorView: function(viewType) {
        var gridBtn = document.getElementById('gridViewBtn');
        var listBtn = document.getElementById('listViewBtn');
        var tailorsGrid = document.getElementById('tailorsGrid');

        if (gridBtn && listBtn && tailorsGrid) {
            if (viewType === 'grid') {
                gridBtn.classList.add('btn-primary');
                gridBtn.classList.remove('btn-outline-secondary');
                listBtn.classList.add('btn-outline-secondary');
                listBtn.classList.remove('btn-primary');
                tailorsGrid.className = 'row';
            } else {
                listBtn.classList.add('btn-primary');
                listBtn.classList.remove('btn-outline-secondary');
                gridBtn.classList.add('btn-outline-secondary');
                gridBtn.classList.remove('btn-primary');
                tailorsGrid.className = 'list-group';
            }
        }
    },

    clearFilters: function() {
        document.getElementById('tailorSearch').value = '';
        document.getElementById('specializationFilter').value = '';
        this.filterTailors();
    },

    viewTailorProfile: function(tailorId) {
        // TODO: Implement tailor profile modal or page
        this.showToast('Tailor profile view will be implemented soon', 'info');
    },

    selectTailorForOrder: function(tailorId) {
        // Switch to order view and pre-select this tailor
        this.switchView('orderNow');
        
        // Wait a moment for the view to load, then select the tailor
        setTimeout(function() {
            if (window.dashboardOrderHandler && window.dashboardOrderHandler.selectTailorById) {
                window.dashboardOrderHandler.selectTailorById(tailorId);
            }
        }, 500);
    },

    // Load user orders for My Items view
    loadUserOrders: function() {
        var self = this;
        var token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No authentication token found');
            this.showOrdersError('Please log in to view your orders');
            return;
        }

        // Show loading state
        this.showOrdersLoading();

        fetch('/api/orders/user', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to load orders');
            }
            return response.json();
        })
        .then(function(data) {
            console.log('=== DASHBOARD ORDERS API RESPONSE ===');
            console.log('Full response:', data);
            console.log('Success:', data.success);
            console.log('Orders:', data.orders);
            console.log('Orders count:', data.orders ? data.orders.length : 'null');
            
            if (data.success && data.orders) {
                console.log('✅ Processing orders for display and stats update');
                self.displayOrders(data.orders, false); // false indicates this is not a filtered display
                self.updateDashboardStats(data.orders); // Update dashboard statistics
            } else {
                console.log('❌ No orders found or API unsuccessful');
                self.showOrdersError('No orders found');
                self.updateDashboardStats([]); // Update with empty array
            }
        })
        .catch(function(error) {
            console.error('Error loading orders:', error);
            self.showOrdersError('Failed to load orders: ' + error.message);
        });
    },

    showOrdersLoading: function() {
        var ordersList = document.getElementById('ordersList');
        if (ordersList) {
            ordersList.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3 text-muted">Loading your orders...</p>
                </div>
            `;
        }
    },

    showOrdersError: function(message) {
        var ordersList = document.getElementById('ordersList');
        if (ordersList) {
            ordersList.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
        }
    },

    displayOrders: function(orders, isFiltered) {
        var ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        console.log('🔍 displayOrders called with:', orders.length, 'orders, isFiltered:', isFiltered);

        if (!orders || orders.length === 0) {
            ordersList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-tshirt fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Orders Yet</h5>
                    <p class="text-muted">You haven't placed any orders yet. Start by placing your first order!</p>
                    <button class="btn btn-primary" onclick="window.dashboard.switchView('orderNow')">
                        <i class="fas fa-plus me-2"></i>Place First Order
                    </button>
                </div>
            `;
            return;
        }

        // Only store orders as allOrders if this is not a filtered display
        if (!isFiltered) {
            console.log('💾 Storing', orders.length, 'orders as allOrders');
            this.allOrders = orders;
            this.filteredOrders = orders;
        } else {
            console.log('🔍 This is a filtered display, not updating allOrders (allOrders has', this.allOrders ? this.allOrders.length : 0, 'orders)');
        }

        var ordersHtml = orders.map(function(order) {
            var statusColor = this.getStatusColor(order.status);
            var statusIcon = this.getStatusIcon(order.status);
            var tailorName = order.tailor ? order.tailor.name : 'Unknown Tailor';
            var orderDate = new Date(order.createdAt).toLocaleDateString();
            var deliveryDate = new Date(order.expectedDeliveryDate).toLocaleDateString();
            var garmentType = order.garmentType || order.clothType || 'Unknown';
            
            return `
                <div class="card border-0 shadow-sm mb-3 order-card" data-order-id="${order._id}" data-status="${order.status}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h6 class="card-title mb-1">Order #${order._id.slice(-8).toUpperCase()}</h6>
                                <p class="text-muted mb-0">
                                    <i class="fas fa-calendar me-1"></i>Placed on ${orderDate}
                                </p>
                            </div>
                            <span class="badge bg-${statusColor}">
                                <i class="${statusIcon} me-1"></i>${order.status}
                            </span>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-sm-6">
                                <small class="text-muted">Tailor:</small>
                                <div class="fw-medium">${tailorName}</div>
                            </div>
                            <div class="col-sm-6">
                                <small class="text-muted">Garment Type:</small>
                                <div class="fw-medium">${garmentType.charAt(0).toUpperCase() + garmentType.slice(1).replace('-', ' ')}</div>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-sm-6">
                                <small class="text-muted">Total Amount:</small>
                                <div class="fw-medium text-success">৳ ${order.totalAmount || order.estimatedPrice || 'N/A'}</div>
                            </div>
                            <div class="col-sm-6">
                                <small class="text-muted">Expected Delivery:</small>
                                <div class="fw-medium">${deliveryDate}</div>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-sm-6">
                                <small class="text-muted">Payment Status:</small>
                                <div class="fw-medium">
                                    <span class="badge bg-${order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'partially-paid' ? 'warning' : 'secondary'}">
                                        ${order.paymentStatus || 'pending'}
                                    </span>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <small class="text-muted">Fabric Provider:</small>
                                <div class="fw-medium">${order.fabricDetails?.provider === 'tailor' ? 'Tailor Provided' : 'Customer Provided'}</div>
                            </div>
                        </div>
                        
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="window.dashboard.showOrderDetails('${order._id}')">
                                <i class="fas fa-eye me-1"></i>View Details
                            </button>
                            ${order.status === 'pending' ? `
                                <button class="btn btn-outline-danger btn-sm" onclick="window.dashboard.cancelOrder('${order._id}')">
                                    <i class="fas fa-times me-1"></i>Cancel
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }.bind(this)).join('');

        ordersList.innerHTML = ordersHtml;
    },

    getStatusColor: function(status) {
        var statusColors = {
            'Pending': 'warning',           // Yellow/Orange - waiting
            'Accepted': 'success',          // Green - approved
            'Fabric Collection': 'info',    // Blue - in process
            'In Progress': 'primary',       // Blue - actively working
            'Ready for Trial': 'info',      // Light blue - ready to try
            'Alterations': 'warning',       // Orange - modifications needed
            'Completed': 'success',         // Green - finished
            'Delivered': 'dark',            // Dark - final stage
            'Cancelled': 'danger'           // Red - cancelled
        };
        return statusColors[status] || 'secondary';
    },

    getStatusIcon: function(status) {
        var statusIcons = {
            'Pending': 'fas fa-clock',              // Clock - waiting
            'Accepted': 'fas fa-check-circle',      // Check circle - approved
            'Fabric Collection': 'fas fa-hand-paper', // Hand - collecting
            'In Progress': 'fas fa-cogs',           // Gears - working
            'Ready for Trial': 'fas fa-user-check', // User check - ready to try
            'Alterations': 'fas fa-edit',           // Edit - modifications
            'Completed': 'fas fa-check-double',     // Double check - finished
            'Delivered': 'fas fa-shipping-fast',    // Shipping - delivered
            'Cancelled': 'fas fa-times-circle'      // X circle - cancelled
        };
        return statusIcons[status] || 'fas fa-question-circle';
    },

    filterOrdersByStatus: function(status) {
        if (!this.allOrders) return;

        console.log('🔍 Filtering orders by status:', status);
        console.log('📊 Total orders available:', this.allOrders.length);

        // Update filter button active state
        var filterButtons = document.querySelectorAll('#itemsView .list-group-item');
        filterButtons.forEach(function(btn) {
            btn.classList.remove('active');
        });

        // Find and activate the clicked button
        var clickedButton = null;
        filterButtons.forEach(function(btn) {
            var buttonText = btn.textContent.trim();
            var buttonStatus = status;
            
            if (status === 'all' && buttonText.includes('All Orders')) {
                clickedButton = btn;
            } else if (buttonText.includes(status)) {
                clickedButton = btn;
            }
        });

        if (clickedButton) {
            clickedButton.classList.add('active');
        }

        // Filter orders
        if (status === 'all') {
            this.filteredOrders = this.allOrders;
            console.log('📋 Showing all orders:', this.filteredOrders.length);
        } else {
            this.filteredOrders = this.allOrders.filter(function(order) {
                return order.status === status;
            });
            console.log(`📋 Showing ${status} orders:`, this.filteredOrders.length);
        }

        this.displayOrders(this.filteredOrders, true); // true indicates this is a filtered display
    },

    showOrderDetails: function(orderId) {
        var order = this.allOrders ? this.allOrders.find(function(o) { return o._id === orderId; }) : null;
        if (!order) {
            console.error('Order not found:', orderId);
            return;
        }

        var modal = document.getElementById('orderDetailsModal');
        var modalContent = document.getElementById('orderDetailsContent');
        
        if (!modal || !modalContent) {
            console.error('Order details modal not found');
            return;
        }

        // Format order details
        var tailorName = order.tailor ? order.tailor.name : 'Unknown Tailor';
        var orderDate = new Date(order.createdAt).toLocaleDateString();
        var deliveryDate = new Date(order.expectedDeliveryDate).toLocaleDateString();
        var garmentType = order.garmentType || order.clothType || 'Unknown';

        // Format measurements
        var measurementsHtml = '';
        if (order.measurements) {
            measurementsHtml = Object.entries(order.measurements).map(function([key, value]) {
                return `
                    <div class="col-md-6 mb-2">
                        <small class="text-muted">${key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</small>
                        <div class="fw-medium">${value}"</div>
                    </div>
                `;
            }).join('');
        }

        modalContent.innerHTML = `
            <div class="order-details">
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6>Order Information</h6>
                        <table class="table table-borderless table-sm">
                            <tr><td><strong>Order ID:</strong></td><td>#${order._id.slice(-8).toUpperCase()}</td></tr>
                            <tr><td><strong>Order Date:</strong></td><td>${orderDate}</td></tr>
                            <tr><td><strong>Status:</strong></td><td><span class="badge bg-${this.getStatusColor(order.status)}">${order.status}</span></td></tr>
                            <tr><td><strong>Expected Delivery:</strong></td><td>${deliveryDate}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Tailor Information</h6>
                        <table class="table table-borderless table-sm">
                            <tr><td><strong>Tailor Name:</strong></td><td>${tailorName}</td></tr>
                            <tr><td><strong>Total Amount:</strong></td><td class="text-success">৳ ${order.totalAmount || order.estimatedPrice || 'N/A'}</td></tr>
                            <tr><td><strong>Payment Status:</strong></td><td><span class="badge bg-${order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'partially-paid' ? 'warning' : 'secondary'}">${order.paymentStatus || 'pending'}</span></td></tr>
                        </table>
                    </div>
                </div>

                <div class="row mb-4">
                    <div class="col-12">
                        <h6>Garment Details</h6>
                        <table class="table table-borderless table-sm">
                            <tr><td><strong>Garment Type:</strong></td><td>${garmentType.charAt(0).toUpperCase() + garmentType.slice(1).replace('-', ' ')}</td></tr>
                            <tr><td><strong>Fabric Provider:</strong></td><td>${order.fabricDetails?.provider === 'tailor' ? 'Tailor Provided' : 'Customer Provided'}</td></tr>
                            ${order.fabricDetails?.type ? `<tr><td><strong>Fabric Type:</strong></td><td>${order.fabricDetails.type}</td></tr>` : ''}
                            ${order.fabricDetails?.color ? `<tr><td><strong>Fabric Color:</strong></td><td>${order.fabricDetails.color}</td></tr>` : ''}
                            ${order.fabricDetails?.pattern ? `<tr><td><strong>Pattern:</strong></td><td>${order.fabricDetails.pattern}</td></tr>` : ''}
                        </table>
                    </div>
                </div>

                ${measurementsHtml ? `
                    <div class="row mb-4">
                        <div class="col-12">
                            <h6>Measurements</h6>
                            <div class="row">
                                ${measurementsHtml}
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${order.specialInstructions ? `
                    <div class="row mb-4">
                        <div class="col-12">
                            <h6>Special Instructions</h6>
                            <p class="border rounded p-3 bg-light">${order.specialInstructions}</p>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Show modal using Bootstrap
        var bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    },

    cancelOrder: function(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        var token = localStorage.getItem('token');
        var self = this;

        fetch('/api/orders/' + orderId, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'cancelled' })
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to cancel order');
            }
            return response.json();
        })
        .then(function(data) {
            console.log('Order cancelled:', data);
            self.showToast('Order cancelled successfully', 'success');
            // Reload orders
            self.loadUserOrders();
        })
        .catch(function(error) {
            console.error('Error cancelling order:', error);
            self.showToast('Failed to cancel order: ' + error.message, 'error');
        });
    },

    // Update dashboard statistics based on orders data
    updateDashboardStats: function(orders) {
        console.log('=== UPDATE DASHBOARD STATS DEBUG ===');
        console.log('Input orders:', orders);
        console.log('Is array:', Array.isArray(orders));
        console.log('Length:', orders ? orders.length : 'null');
        
        if (!orders) {
            console.log('⚠️ No orders provided, using empty array');
            orders = [];
        }

        console.log('📊 Updating dashboard stats with', orders.length, 'orders');

        // Update total orders count
        var totalOrdersElement = document.getElementById('totalOrders');
        console.log('Total orders element:', totalOrdersElement ? 'found' : 'not found');
        if (totalOrdersElement) {
            totalOrdersElement.textContent = orders.length;
            console.log('✅ Updated total orders to:', orders.length);
        }

        // Update profile total orders count
        var profileTotalOrdersElement = document.getElementById('profileTotalOrders');
        console.log('Profile total orders element:', profileTotalOrdersElement ? 'found' : 'not found');
        if (profileTotalOrdersElement) {
            profileTotalOrdersElement.textContent = orders.length;
            console.log('✅ Updated profile total orders to:', orders.length);
        }

        // Calculate other statistics
        var pendingOrders = orders.filter(function(order) {
            return order.status === 'Pending';
        }).length;

        var completedOrders = orders.filter(function(order) {
            return order.status === 'Completed' || order.status === 'Delivered';
        }).length;

        var totalAmount = orders.reduce(function(sum, order) {
            return sum + (order.estimatedPrice || order.amount || 0);
        }, 0);

        // Update pending orders (if element exists)
        var pendingOrdersElement = document.getElementById('pendingOrders');
        if (pendingOrdersElement) {
            pendingOrdersElement.textContent = pendingOrders;
        }

        // Update completed orders (if element exists)
        var completedOrdersElement = document.getElementById('completedOrders');
        if (completedOrdersElement) {
            completedOrdersElement.textContent = completedOrders;
        }

        // Update total spending (if element exists)
        var totalSpendingElement = document.getElementById('totalSpending');
        if (totalSpendingElement) {
            totalSpendingElement.textContent = '৳' + totalAmount.toLocaleString();
        }

        console.log('📈 Dashboard stats updated - Total:', orders.length, 'Pending:', pendingOrders, 'Completed:', completedOrders);
    },

    // Auto-refresh functionality for My Items view
    startOrdersAutoRefresh: function() {
        var self = this;
        
        // Clear any existing refresh interval
        this.stopOrdersAutoRefresh();
        
        // Set up auto-refresh every 30 seconds
        this.ordersRefreshInterval = setInterval(function() {
            console.log('🔄 Auto-refreshing orders...');
            self.loadUserOrders();
        }, 30000); // 30 seconds
        
        console.log('✅ Auto-refresh started for My Items (every 30 seconds)');
    },

    stopOrdersAutoRefresh: function() {
        if (this.ordersRefreshInterval) {
            clearInterval(this.ordersRefreshInterval);
            this.ordersRefreshInterval = null;
            console.log('🛑 Auto-refresh stopped for My Items');
        }
    },

    loadReviewsData: function() {
        console.log('📊 Loading reviews data...');
        console.log('🔍 Reviews view activated - checking for delivered orders');
        
        // Load eligible orders for review
        this.loadEligibleOrders();
        
        // Load user's reviews
        this.loadUserReviews();
    },

    loadEligibleOrders: function() {
        var token = localStorage.getItem('token');
        console.log('📋 Fetching user orders to find delivered ones...');
        
        fetch('/api/orders/user', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log('📡 Orders API response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📦 Orders API response:', data);
            if (data.status === 'success') {
                var allOrders = data.data.orders;
                console.log('📊 Total orders found:', allOrders.length);
                
                // Filter for delivered orders only
                var deliveredOrders = allOrders.filter(order => order.status === 'Delivered');
                console.log('✅ Delivered orders found:', deliveredOrders.length);
                console.log('📋 Delivered orders:', deliveredOrders);
                
                if (deliveredOrders.length === 0) {
                    console.log('ℹ️ No delivered orders found');
                    this.displayEligibleOrders([]);
                    this.updateReviewStats(0, 0, 0);
                } else {
                    // Check which orders can be reviewed
                    this.checkReviewEligibility(deliveredOrders);
                }
            } else {
                console.error('❌ Orders API error:', data.message);
                this.showToast('Failed to load orders for review: ' + (data.message || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('💥 Error loading orders:', error);
            this.showToast('Failed to load orders for review', 'error');
        });
    },

    checkReviewEligibility: function(orders) {
        var token = localStorage.getItem('token');
        var eligibleOrders = [];
        var reviewedOrders = [];
        var completed = 0;
        var total = orders.length;

        if (total === 0) {
            this.displayEligibleOrders([]);
            this.updateReviewStats(0, 0, 0);
            return;
        }

        orders.forEach(order => {
            fetch(`/api/reviews/check-eligibility/${order._id}`, {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                completed++;
                
                if (data.status === 'success' && data.data.eligible) {
                    eligibleOrders.push(order);
                } else {
                    reviewedOrders.push(order);
                }
                
                if (completed === total) {
                    this.displayEligibleOrders(eligibleOrders);
                    this.updateReviewStats(reviewedOrders.length, eligibleOrders.length, total);
                }
            })
            .catch(error => {
                completed++;
                console.error('Error checking eligibility for order:', order._id, error);
                
                if (completed === total) {
                    this.displayEligibleOrders(eligibleOrders);
                    this.updateReviewStats(reviewedOrders.length, eligibleOrders.length, total);
                }
            });
        });
    },

    updateReviewStats: function(totalReviews, pendingReviews, eligibleOrders) {
        var totalReviewsEl = document.getElementById('totalReviewsCount');
        var pendingReviewsEl = document.getElementById('pendingReviewsCount');
        var eligibleOrdersEl = document.getElementById('eligibleOrdersCount');
        
        if (totalReviewsEl) totalReviewsEl.textContent = totalReviews;
        if (pendingReviewsEl) pendingReviewsEl.textContent = pendingReviews;
        if (eligibleOrdersEl) eligibleOrdersEl.textContent = eligibleOrders;
    },

    displayEligibleOrders: function(orders) {
        var container = document.getElementById('eligibleOrdersList');
        var loading = document.getElementById('eligibleOrdersLoading');
        
        if (loading) loading.style.display = 'none';
        
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-star fa-3x mb-3 opacity-50"></i>
                    <h5>No Orders Ready for Review</h5>
                    <p class="mb-0">Complete some orders to leave reviews for your tailors</p>
                </div>
            `;
            return;
        }
        
        var html = '';
        orders.forEach(order => {
            var orderDate = new Date(order.createdAt).toLocaleDateString();
            var tailorName = order.tailor && order.tailor.name ? order.tailor.name : 'Unknown Tailor';
            
            html += `
                <div class="eligible-order-item">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-tshirt text-primary me-2"></i>
                                <strong class="me-3">${order.garmentType || 'Custom Garment'}</strong>
                                <span class="badge bg-success">Delivered</span>
                            </div>
                            <div class="row text-muted small">
                                <div class="col-sm-6">
                                    <i class="fas fa-user me-1"></i>
                                    <strong>Tailor:</strong> ${tailorName}
                                </div>
                                <div class="col-sm-6">
                                    <i class="fas fa-calendar me-1"></i>
                                    <strong>Order Date:</strong> ${orderDate}
                                </div>
                                <div class="col-sm-6">
                                    <i class="fas fa-tag me-1"></i>
                                    <strong>Price:</strong> ৳${order.totalPrice || 0}
                                </div>
                                <div class="col-sm-6">
                                    <i class="fas fa-receipt me-1"></i>
                                    <strong>Order ID:</strong> #${order._id.slice(-6)}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-primary" onclick="openReviewModal('${order._id}')">
                                <i class="fas fa-star me-2"></i>Write Review
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },

    loadUserReviews: function() {
        var token = localStorage.getItem('token');
        
        fetch('/api/reviews/my-reviews', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                this.displayUserReviews(data.data.reviews);
            } else {
                throw new Error(data.message || 'Failed to load reviews');
            }
        })
        .catch(error => {
            console.error('Error loading user reviews:', error);
            this.showToast('Failed to load your reviews', 'error');
        });
    },

    displayUserReviews: function(reviews) {
        var container = document.getElementById('myReviewsList');
        var loading = document.getElementById('myReviewsLoading');
        
        if (loading) loading.style.display = 'none';
        
        if (!container) return;
        
        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-comment fa-3x mb-3 opacity-50"></i>
                    <h5>No Reviews Yet</h5>
                    <p class="mb-0">You haven't written any reviews yet. Complete some orders and share your experience!</p>
                </div>
            `;
            return;
        }
        
        var html = '';
        reviews.forEach(review => {
            var reviewDate = new Date(review.createdAt).toLocaleDateString();
            var tailorName = review.tailorId && review.tailorId.name ? review.tailorId.name : 'Unknown Tailor';
            var garmentType = review.orderId && review.orderId.garmentType ? review.orderId.garmentType : 'Custom Garment';
            
            var starsHtml = '';
            for (var i = 1; i <= 5; i++) {
                starsHtml += `<i class="fas fa-star ${i <= review.rating ? 'text-warning' : 'text-muted'}"></i>`;
            }
            
            html += `
                <div class="review-item">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <div class="d-flex align-items-center mb-1">
                                <strong class="me-2">${garmentType}</strong>
                                <span class="badge bg-light text-dark">${tailorName}</span>
                            </div>
                            <div class="review-stars mb-2">
                                ${starsHtml}
                                <span class="ms-2 text-muted">${review.rating}/5</span>
                            </div>
                        </div>
                        <small class="text-muted">${reviewDate}</small>
                    </div>
                    ${review.feedback ? `<p class="mb-0">${review.feedback}</p>` : '<p class="mb-0 text-muted"><em>No written feedback provided</em></p>'}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
};

// Global functions for HTML onclick events
function loadAllTailors() {
    if (window.dashboard) {
        window.dashboard.loadAllTailors();
    }
}

function loadAvailableTailors() {
    if (window.dashboard) {
        window.dashboard.loadAvailableTailors();
    }
}

function loadBookedTailors() {
    if (window.dashboard) {
        window.dashboard.loadBookedTailors();
    }
}

function searchTailors() {
    if (window.dashboard) {
        window.dashboard.filterTailors();
    }
}

function filterTailors() {
    if (window.dashboard) {
        window.dashboard.filterTailors();
    }
}

function clearFilters() {
    if (window.dashboard) {
        window.dashboard.clearFilters();
    }
}

function showDashboard() {
    if (window.dashboard) {
        window.dashboard.switchView('dashboard');
    }
}

// Order filtering functions for My Items view
function filterOrders(status) {
    if (window.dashboard) {
        window.dashboard.filterOrdersByStatus(status);
    }
}

function showOrderDetails(orderId) {
    if (window.dashboard) {
        window.dashboard.showOrderDetails(orderId);
    }
}

// Global functions for review functionality
function openReviewModal(orderId) {
    console.log('🌟 Opening review modal for order:', orderId);
    console.log('🔐 Checking authentication...');
    
    var token = localStorage.getItem('token');
    
    if (!token) {
        console.error('❌ No authentication token found');
        alert('Please log in to submit reviews');
        return;
    }
    
    console.log('✅ Token found, fetching order details...');
    
    // Get order details
    fetch(`/api/orders/user`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('📡 Order fetch response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📦 Orders data received:', data);
        if (data.status === 'success') {
            var order = data.data.orders.find(o => o._id === orderId);
            console.log('🔍 Found order:', order);
            if (order) {
                populateReviewModal(order);
                var modal = new bootstrap.Modal(document.getElementById('reviewModal'));
                console.log('🎭 Opening modal...');
                modal.show();
            } else {
                console.error('❌ Order not found with ID:', orderId);
                alert('Order not found');
            }
        } else {
            console.error('❌ API error:', data.message);
            alert('Failed to load order details: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('💥 Error loading order details:', error);
        alert('Failed to load order details');
    });
}

function populateReviewModal(order) {
    document.getElementById('reviewOrderId').value = order._id;
    document.getElementById('reviewOrderGarment').textContent = order.garmentType || 'Custom Garment';
    document.getElementById('reviewTailorName').textContent = order.tailor && order.tailor.name ? order.tailor.name : 'Unknown Tailor';
    document.getElementById('reviewOrderDate').textContent = new Date(order.createdAt).toLocaleDateString();
    document.getElementById('reviewOrderPrice').textContent = `৳${order.totalPrice || 0}`;
    
    // Reset rating
    document.getElementById('rating').value = '';
    document.querySelectorAll('.star').forEach(star => star.classList.remove('active'));
    document.getElementById('feedback').value = '';
    
    // Setup rating stars
    setupRatingStars();
}

function setupRatingStars() {
    console.log('⭐ Setting up star rating system...');
    var stars = document.querySelectorAll('.star');
    
    if (stars.length === 0) {
        console.warn('⚠️ No star elements found');
        return;
    }
    
    console.log('✅ Found', stars.length, 'stars');
    
    stars.forEach(function(star, index) {
        star.addEventListener('click', function() {
            var rating = this.getAttribute('data-rating');
            console.log('⭐ Star clicked, rating:', rating);
            document.getElementById('rating').value = rating;
            
            // Update star display
            stars.forEach(function(s, i) {
                if (i < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
        
        star.addEventListener('mouseenter', function() {
            var rating = this.getAttribute('data-rating');
            stars.forEach(function(s, i) {
                if (i < rating) {
                    s.style.color = '#ffc107';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });
    });
    
    // Reset on mouse leave
    var ratingContainer = document.getElementById('ratingStars');
    if (ratingContainer) {
        ratingContainer.addEventListener('mouseleave', function() {
            var currentRating = document.getElementById('rating').value;
            stars.forEach(function(s, i) {
                if (i < currentRating) {
                    s.style.color = '#ffc107';
                    s.classList.add('active');
                } else {
                    s.style.color = '#ddd';
                    s.classList.remove('active');
                }
            });
        });
    }
}

function submitReview() {
    var form = document.getElementById('reviewForm');
    var formData = new FormData(form);
    var rating = formData.get('rating');
    
    if (!rating) {
        alert('Please select a rating');
        return;
    }
    
    var token = localStorage.getItem('token');
    var data = {
        orderId: formData.get('orderId'),
        rating: parseInt(rating),
        feedback: formData.get('feedback')
    };
    
    fetch('/api/reviews/create', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Review submitted successfully!');
            
            // Close modal
            var modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
            modal.hide();
            
            // Refresh reviews data
            if (window.dashboard) {
                window.dashboard.loadReviewsData();
            }
        } else {
            alert(data.message || 'Failed to submit review');
        }
    })
    .catch(error => {
        console.error('Error submitting review:', error);
        alert('Failed to submit review');
    });
}

function cancelOrder(orderId) {
    if (window.dashboard) {
        window.dashboard.cancelOrder(orderId);
    }
}

function refreshOrders() {
    if (window.dashboard) {
        console.log('🔄 Manual refresh triggered');
        window.dashboard.loadUserOrders();
        
        // Show a brief feedback to user
        var refreshBtn = document.querySelector('button[onclick="refreshOrders()"]');
        if (refreshBtn) {
            var originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Refreshing...';
            refreshBtn.disabled = true;
            
            setTimeout(function() {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
            }, 2000);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new Dashboard();
});

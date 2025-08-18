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
        this.setupToastNotification();
        this.setupViewHandlers();
    },

    setupViewHandlers: function() {
        // Hide all views initially
        var views = document.querySelectorAll('.content-view');
        for (var i = 0; i < views.length; i++) {
            views[i].classList.add('d-none');
        }

        // Show dashboard view by default
        var defaultView = document.getElementById('dashboardView');
        if (defaultView) defaultView.classList.remove('d-none');

        // Setup navigation event listeners
        var self = this;
        var navItems = document.querySelectorAll('.nav-item');
        for (var j = 0; j < navItems.length; j++) {
            navItems[j].addEventListener('click', function(e) {
                e.preventDefault();
                var section = this.getAttribute('data-section');
                self.switchView(section);
            });
        }
    },

    switchView: function(viewName) {
        console.log('Switching to view:', viewName);
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
        } else {
            console.error('View element not found:', viewName + 'View');
        }

        // Close profile menu if it's open
        var profileMenu = document.getElementById('profileMenu');
        if (profileMenu && profileMenu.classList.contains('show')) {
            profileMenu.classList.remove('show');
        }
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
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new Dashboard();
});

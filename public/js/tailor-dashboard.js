document.addEventListener('DOMContentLoaded', async function() {
    // Constants
    const API_URL = '/api';  // Use relative URL instead of absolute
    const TOKEN_KEY = 'token';
    const USER_TYPE_KEY = 'userType';
    const TAILOR_DATA_KEY = 'tailorData';

    // Initialize variables
    const token = localStorage.getItem(TOKEN_KEY);
    let tailorData = null;

    // Check authentication
    if (!token || localStorage.getItem(USER_TYPE_KEY) !== 'tailor') {
        window.location.href = '/tailor-auth.html';
        return;
    }

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // API response handler
    async function handleApiResponse(response) {
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            window.location.href = '/tailor-auth.html';
            return;
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }
            return data;
        } else {
            // If not JSON, throw error with status text
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            console.error('Unexpected response:', text);
            throw new Error('Unexpected response from server');
        }
    }

    // Navigation handling
    document.querySelectorAll('[data-section]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                console.log('Switching to section:', section);
                switchSection(section);
            }
        });
    });

    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', function() {
        document.querySelector('.dashboard-container').classList.toggle('sidebar-collapsed');
    });

    // Logout handling
    document.querySelectorAll('[data-action="logout"], #logout, .profile-menu-item:has(i.fa-sign-out-alt)').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    });

    // Profile image upload handling
    document.getElementById('profileImageUpload').addEventListener('change', handleProfileImageUpload);

    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);

    // Initialize the dashboard
    try {
        await initializeDashboard();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showNotification('Failed to load dashboard. Please try refreshing the page.', 'error');
    }

    // Functions
    async function initializeDashboard() {
        try {
            showLoadingState(true);
            await loadTailorProfile();
            await loadDashboardData();
            
            // Get last active section from localStorage or default to overview
            const lastActiveSection = localStorage.getItem('activeSection') || 'overview';
            switchSection(lastActiveSection);
        } catch (error) {
            console.error('Error in initializeDashboard:', error);
            throw error;
        } finally {
            showLoadingState(false);
        }
    }

    function showLoadingState(loading) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loading) {
            if (!loadingOverlay) {
                const overlay = document.createElement('div');
                overlay.id = 'loadingOverlay';
                overlay.innerHTML = `
                    <div class="loading-spinner">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);
            }
        } else {
            if (loadingOverlay) {
                loadingOverlay.remove();
            }
        }
    }

    async function loadTailorProfile() {
        try {
            showLoadingState(true);
            const response = await fetch(`${API_URL}/tailors/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
            
            const data = await handleApiResponse(response);
            if (data.status === 'success') {
                tailorData = data.data.tailor;
                console.log('Loaded tailor data:', tailorData); // Debug log
                
                // Set isVerified to true (or based on your actual verification logic)
                tailorData.isVerified = true;
                
                // Save to localStorage
                localStorage.setItem('tailorData', JSON.stringify(tailorData));
                
                updateProfileDisplay(tailorData);
                
                // Check for saved form data
                const savedProfileData = localStorage.getItem('tailorProfileData');
                if (savedProfileData) {
                    const formData = JSON.parse(savedProfileData);
                    // Update form with saved data if it exists
                    Object.assign(tailorData, formData);
                    updateProfileDisplay(tailorData);
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            if (error.message === 'The user belonging to this token no longer exists.') {
                handleLogout();
            } else {
                showNotification(error.message || 'Error loading profile', 'error');
            }
        } finally {
            showLoadingState(false);
        }
    }

    function updateProfileDisplay(tailor) {
        // Update header profile
        document.getElementById('tailorName').textContent = tailor.name || '';
        
        // Update profile image and basic info
        const profileImage = document.getElementById('profileImage');
        const headerProfilePic = document.getElementById('profilePic');
        const topNavProfileImage = document.getElementById('topNavProfileImage');
        const menuProfileImage = document.getElementById('menuProfileImage');
        
        console.log('Tailor data for display:', tailor);
        
        function updateImage(imgElement, profilePicture) {
            if (!imgElement) return;

            let imageUrl;
            if (profilePicture) {
                // Add timestamp to prevent caching
                const timestamp = new Date().getTime();
                
                console.log('Original profilePicture path:', profilePicture);
                console.log('API_URL:', API_URL);
                
                // Handle different profile picture path formats
                if (profilePicture.startsWith('http')) {
                    imageUrl = `${profilePicture}?t=${timestamp}`;
                } else if (profilePicture.startsWith('/uploads/')) {
                    // Backend returns '/uploads/profiles/filename.jpg'
                    // Static files are served from root, not from /api
                    imageUrl = `http://localhost:3000${profilePicture}?t=${timestamp}`;
                } else if (profilePicture.startsWith('uploads/')) {
                    imageUrl = `http://localhost:3000/${profilePicture}?t=${timestamp}`;
                } else if (profilePicture.startsWith('/')) {
                    imageUrl = `http://localhost:3000${profilePicture}?t=${timestamp}`;
                } else {
                    imageUrl = `http://localhost:3000/uploads/profiles/${profilePicture}?t=${timestamp}`;
                }
                
                console.log(`Final image URL for ${imgElement.id}:`, imageUrl);
            } else {
                imageUrl = `https://via.placeholder.com/150?text=No+Image`;
            }

            console.log(`Setting ${imgElement.id} URL:`, imageUrl);

            // Create a new Image object to test loading
            const testImg = new Image();
            testImg.onload = () => {
                imgElement.src = imageUrl;
                console.log(`Successfully loaded image for ${imgElement.id}`);
            };
            testImg.onerror = () => {
                console.error(`Failed to load image for ${imgElement.id}:`, imageUrl);
                imgElement.src = `${window.location.origin}/images/default-profile.png`;
            };
            testImg.src = imageUrl;
        }

        // Update both profile and header images
        updateImage(profileImage, tailor.profilePicture);
        updateImage(headerProfilePic, tailor.profilePicture);
        updateImage(topNavProfileImage, tailor.profilePicture);
        updateImage(menuProfileImage, tailor.profilePicture);

        // Update verification status
        const verificationStatus = document.getElementById('verificationStatus');
        if (verificationStatus) {
            verificationStatus.innerHTML = `<span class="badge bg-success">
                <i class="fas fa-check-circle"></i> Verified
            </span>`;
        }

        // Update profile form
        document.getElementById('fullName').value = tailor.name;
        document.getElementById('phoneNumber').value = tailor.phoneNumber || '';
        document.getElementById('shopName').value = tailor.shopName || '';
        document.getElementById('experience').value = tailor.experience || '';
        document.getElementById('bio').value = tailor.bio || '';

        // Update specializations
        const specializationSelect = document.getElementById('specialization');
        if (tailor.specialization) {
            tailor.specialization.forEach(spec => {
                const option = specializationSelect.querySelector(`option[value="${spec}"]`);
                if (option) option.selected = true;
            });
        }

        // Update shop address
        if (tailor.shopAddress) {
            document.getElementById('street').value = tailor.shopAddress.street || '';
            document.getElementById('city').value = tailor.shopAddress.city || '';
            document.getElementById('state').value = tailor.shopAddress.state || '';
            document.getElementById('postalCode').value = tailor.shopAddress.postalCode || '';
        }

        // Update business hours
        if (tailor.businessHours) {
            document.getElementById('startTime').value = tailor.businessHours.start || '';
            document.getElementById('endTime').value = tailor.businessHours.end || '';

            // Update working days
            // First uncheck all days
            document.querySelectorAll('input[name="workingDays"]').forEach(cb => {
                cb.checked = false;
            });
            
            // Then check the saved days
            if (tailor.businessHours && tailor.businessHours.daysOpen) {
                tailor.businessHours.daysOpen.forEach(day => {
                    const checkbox = document.querySelector(`input[name="workingDays"][value="${day}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }
        }

        // Update profile header info
        document.getElementById('profileName').textContent = tailor.name || '';
        document.getElementById('profileEmail').textContent = tailor.email || '';
        document.getElementById('email').value = tailor.email || '';
        document.getElementById('profileSpecialization').textContent = tailor.specialization ? tailor.specialization.join(', ') : '';
        document.getElementById('profileLocation').textContent = tailor.shopAddress ? 
            `${tailor.shopAddress.city}, ${tailor.shopAddress.state}` : 'Location not set';
    }

    async function loadDashboardData() {
        try {
            // Load stats
            const statsResponse = await fetch(`${API_URL}/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const statsData = await statsResponse.json();

            if (statsData.status === 'success') {
                updateDashboardStats(statsData.data);
            }

            // Load recent orders
            const ordersResponse = await fetch(`${API_URL}/dashboard/recent-orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const ordersData = await ordersResponse.json();

            if (ordersData.status === 'success') {
                updateRecentOrders(ordersData.data.orders);
            }

            // Load recent reviews
            const reviewsResponse = await fetch(`${API_URL}/dashboard/recent-reviews`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const reviewsData = await reviewsResponse.json();

            if (reviewsData.status === 'success') {
                updateRecentReviews(reviewsData.data.reviews);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showNotification('Error loading dashboard data', 'error');
        }
    }

    function updateDashboardStats(stats) {
        document.getElementById('pendingOrders').textContent = stats.pendingOrders || 0;
        document.getElementById('completedOrders').textContent = stats.completedOrders || 0;
        document.getElementById('rating').textContent = stats.averageRating?.toFixed(1) || '0.0';
        document.getElementById('earnings').textContent = `৳${stats.totalEarnings || 0}`;

        // Update earnings summary
        document.getElementById('todayEarnings').textContent = `৳${stats.todayEarnings || 0}`;
        document.getElementById('weekEarnings').textContent = `৳${stats.weekEarnings || 0}`;
        document.getElementById('monthEarnings').textContent = `৳${stats.monthEarnings || 0}`;
        document.getElementById('yearEarnings').textContent = `৳${stats.yearEarnings || 0}`;

        // Update earnings chart if it exists
        updateEarningsChart(stats.earningsData);
    }

    function updateRecentOrders(orders) {
        console.log('Updating recent orders with:', orders);
        // Use the same format as Orders section but without edit functionality
        updateRecentOrdersTable(orders);
    }

    function updateRecentOrdersTable(orders) {
        const tbody = document.getElementById('recentOrdersBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No recent orders found</td></tr>';
            return;
        }

        // Show only the latest 10 orders for Recent Orders section
        const recentOrders = orders.slice(0, 10);

        recentOrders.forEach(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');
            const dueDate = new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB');
            const amount = order.totalAmount || order.price || order.estimatedPrice || 0;
            const garmentType = order.garmentType || order.clothType || 'Custom';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="order-id-badge" title="${order._id}">#${order._id.slice(-8).toUpperCase()}</span>
                </td>
                <td>
                    <div class="customer-info">
                        <strong>${order.user?.name || 'Customer'}</strong>
                        <br><small class="text-muted">${order.user?.email || ''}</small>
                    </div>
                </td>
                <td>
                    <span class="service-badge">${garmentType}</span>
                </td>
                <td>
                    <span class="date-badge">${orderDate}</span>
                </td>
                <td>
                    <span class="date-badge ${isOverdue(order.expectedDeliveryDate) ? 'text-danger' : ''}">${dueDate}</span>
                    ${isOverdue(order.expectedDeliveryDate) ? '<br><small class="text-danger">Overdue</small>' : ''}
                </td>
                <td>
                    <span class="badge bg-${getStatusColor(order.status)} status-badge">
                        <i class="${getStatusIcon(order.status)} me-1"></i>${order.status}
                    </span>
                </td>
                <td>
                    <strong class="amount-display">৳${amount.toLocaleString()}</strong>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails('${order._id}')" 
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="viewMeasurements('${order._id}')" 
                                title="View Measurements">
                            <i class="fas fa-ruler"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }



    function updateRecentReviews(reviews) {
        const container = document.getElementById('recentReviews');
        container.innerHTML = '';

        reviews.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review-item';
            reviewElement.innerHTML = `
                <div class="review-header">
                    <span class="reviewer-name">${review.customerName}</span>
                    <span class="review-rating">
                        ${getStarRating(review.rating)}
                    </span>
                </div>
                <p class="review-text">${review.comment}</p>
                <small class="review-date">${new Date(review.date).toLocaleDateString()}</small>
            `;
            container.appendChild(reviewElement);
        });
    }

    function updateEarningsChart(data) {
        const ctx = document.getElementById('earningsChart');
        if (!ctx || !data || !data.labels || !data.values) return;

        try {
            if (window.earningsChart) {
                window.earningsChart.destroy();
            }

            window.earningsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Earnings',
                        data: data.values,
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '৳' + value;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating earnings chart:', error);
        }
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        showLoadingState(true);

        try {
            // Validate required fields
            const fullName = document.getElementById('fullName').value.trim();
            if (!fullName) {
                showNotification('Full name is required', 'error');
                return;
            }

            const experience = parseInt(document.getElementById('experience').value);
            if (isNaN(experience) || experience < 0) {
                showNotification('Please enter valid years of experience', 'error');
                return;
            }

            // Get existing email from tailorData
            const existingEmail = tailorData ? tailorData.email : '';

            // Build update object
            const updates = {
                name: fullName,
                email: existingEmail, // Keep the existing email
                phoneNumber: document.getElementById('phoneNumber').value.trim(),
                shopName: document.getElementById('shopName').value.trim(),
                experience: experience,
                specialization: Array.from(document.getElementById('specialization').selectedOptions).map(opt => opt.value),
                shopAddress: {
                    street: document.getElementById('street').value.trim(),
                    city: document.getElementById('city').value.trim(),
                    state: document.getElementById('state').value.trim(),
                    postalCode: document.getElementById('postalCode').value.trim()
                },
                businessHours: {
                    start: document.getElementById('startTime').value,
                    end: document.getElementById('endTime').value,
                    daysOpen: Array.from(document.querySelectorAll('input[name="workingDays"]:checked')).map(cb => cb.value)
                },
                bio: document.getElementById('bio').value.trim()
            };
            
            // Save form data to localStorage as backup
            localStorage.setItem('tailorProfileData', JSON.stringify(updates));

            console.log('Sending updates:', updates);
            console.log('Sending profile update:', updates);
            const response = await fetch(`${API_URL}/tailors/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const data = await response.json();
            if (data.status === 'success') {
                showNotification('Profile updated successfully', 'success');
                await loadTailorProfile();
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification(error.message || 'Error updating profile', 'error');
        } finally {
            showLoadingState(false);
        }
    }

    async function handleProfileImageUpload(e) {
        e.preventDefault();
        const file = e.target.files[0];
        if (!file) return;

        // Clear the input
        e.target.value = '';

        // Basic check that it's some kind of image
        if (!file.type.startsWith('image/')) {
            showNotification('Please upload an image file', 'error');
            return;
        }

        // Validate file size only (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image must be smaller than 5MB', 'error');
            return;
        }

            // Size already checked above        // Validate image dimensions
        try {
            const dimensions = await getImageDimensions(file);
            if (dimensions.width > 2000 || dimensions.height > 2000) {
                showNotification('Image dimensions must be less than 2000x2000 pixels', 'error');
                return;
            }
        } catch (error) {
            showNotification('Invalid image file', 'error');
            return;
        }

        showLoadingState(true);

        try {
            console.log('Uploading image to server...');
            
            // Create FormData and append file with specific name
            const formData = new FormData();
            formData.append('profilePicture', file, file.name);
            
            console.log('File being uploaded:', {
                name: file.name,
                type: file.type,
                size: file.size
            });
            
            const response = await fetch(`${API_URL}/tailors/profile/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type header, let browser set it with boundary
                },
                body: formData,
                credentials: 'include'
            });
            
            // Log the response details
            console.log('Upload response status:', response.status);
            console.log('Upload response headers:', Object.fromEntries(response.headers));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw new Error(`Failed to upload image: ${response.statusText}`);
            }

            let data;
            try {
                const responseText = await response.text();
                console.log('Raw response:', responseText);
                
                // Try to parse as JSON
                data = JSON.parse(responseText);
                console.log('Parsed response:', data);
            } catch (e) {
                console.error('Error parsing response:', e);
                throw new Error('Server response was not in the expected format');
            }

            if (!response.ok) {
                console.error('Upload error:', data);
                throw new Error(data.message || 'Failed to upload image');
            }

            if (!data.status || data.status !== 'success') {
                console.error('Upload failed:', data);
                throw new Error(data.message || 'Failed to upload image');
            }
            
            if (data.status === 'success') {
                showNotification('Profile picture updated successfully', 'success');
                
                // Immediately update the image with the new URL
                if (data.data && data.data.profilePicture) {
                    const timestamp = new Date().getTime();
                    let imageUrl;
                    
                    console.log('Profile picture path:', data.data.profilePicture);
                    
                    // Handle both full URLs and relative paths
                    if (data.data.profilePicture.startsWith('http')) {
                        imageUrl = `${data.data.profilePicture}?t=${timestamp}`;
                    } else if (data.data.profilePicture.startsWith('/uploads/')) {
                        // Backend returns '/uploads/profiles/filename.jpg'
                        // Static files are served from root, not from /api
                        imageUrl = `http://localhost:3000${data.data.profilePicture}?t=${timestamp}`;
                    } else if (data.data.profilePicture.startsWith('uploads/')) {
                        imageUrl = `http://localhost:3000/${data.data.profilePicture}?t=${timestamp}`;
                    } else {
                        imageUrl = `http://localhost:3000/uploads/profiles/${data.data.profilePicture}?t=${timestamp}`;
                    }
                    
                    console.log('Setting new image URL:', imageUrl); // Debug log
                    
                    const profileImage = document.getElementById('profileImage');
                    const headerProfilePic = document.getElementById('profilePic');
                    const topNavProfileImage = document.getElementById('topNavProfileImage');
                    const menuProfileImage = document.getElementById('menuProfileImage');
                    
                    if (profileImage) {
                        profileImage.src = imageUrl;
                        // Force image reload
                        profileImage.onload = () => console.log('Profile image loaded successfully');
                        profileImage.onerror = (e) => console.error('Error loading profile image:', e);
                    }
                    
                    if (headerProfilePic) {
                        headerProfilePic.src = imageUrl;
                        // Force image reload
                        headerProfilePic.onload = () => console.log('Header image loaded successfully');
                        headerProfilePic.onerror = (e) => console.error('Error loading header image:', e);
                    }
                    
                    if (topNavProfileImage) {
                        topNavProfileImage.src = imageUrl;
                        // Force image reload
                        topNavProfileImage.onload = () => console.log('Top nav image loaded successfully');
                        topNavProfileImage.onerror = (e) => console.error('Error loading top nav image:', e);
                    }
                    
                    if (menuProfileImage) {
                        menuProfileImage.src = imageUrl;
                        // Force image reload
                        menuProfileImage.onload = () => console.log('Menu image loaded successfully');
                        menuProfileImage.onerror = (e) => console.error('Error loading menu image:', e);
                    }
                }
                
                // Refresh tailor data
                await loadTailorProfile();
            } else {
                console.error('Upload failed:', data);
                throw new Error(data.message || 'Failed to update profile picture');
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            showNotification(error.message || 'Error uploading profile picture', 'error');
        } finally {
            showLoadingState(false);
        }
    }

    function switchSection(sectionId) {
        console.log('Switching to section:', sectionId);
        
        // Save current section to localStorage
        localStorage.setItem('activeSection', sectionId);
        
        // Update navigation
        document.querySelectorAll('[data-section]').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });

        // Update content visibility
        document.querySelectorAll('.content-view').forEach(view => {
            view.style.display = 'none';
            view.classList.add('d-none');
        });

        const viewId = `${sectionId}View`;
        const activeView = document.getElementById(viewId);
        console.log('Looking for view:', viewId);
        
        if (activeView) {
            activeView.style.display = 'block';
            activeView.classList.remove('d-none');
            console.log('View found and displayed:', viewId);
        } else {
            console.error('View not found:', viewId);
        }

        // Update section title
        const sectionTitle = document.getElementById('sectionTitle');
        if (sectionTitle) {
            sectionTitle.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
        }

        // Load section-specific data
        switch(sectionId) {
            case 'orders':
                loadOrders();
                break;
            case 'reviews':
                loadReviews();
                break;
            case 'earnings':
                loadEarnings();
                break;
            case 'measurements':
                loadMeasurements();
                break;
        }
    }

    async function loadOrders() {
        try {
            console.log('Fetching orders from:', `${API_URL}/tailors/orders`);
            console.log('Using token:', token ? 'Token exists' : 'No token');
            
            const response = await fetch(`${API_URL}/tailors/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            const data = await response.json();
            console.log('Response data:', data);

            if (data.status === 'success') {
                updateOrdersTable(data.data.orders);
                updateRecentOrders(data.data.orders); // Also update recent orders with same data
            } else {
                console.error('API returned error:', data);
                showNotification(data.message || 'Error loading orders', 'error');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            showNotification('Error loading orders', 'error');
        }
    }

    function updateOrdersTable(orders) {
        const tbody = document.getElementById('allOrdersBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No orders found</td></tr>';
            return;
        }

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');
            const dueDate = new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB');
            const amount = order.totalAmount || order.price || order.estimatedPrice || 0;
            const garmentType = order.garmentType || order.clothType || 'Custom';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="order-id-badge" title="${order._id}">#${order._id.slice(-8).toUpperCase()}</span>
                </td>
                <td>
                    <div class="customer-info">
                        <strong>${order.user?.name || 'Customer'}</strong>
                        <br><small class="text-muted">${order.user?.email || ''}</small>
                    </div>
                </td>
                <td>
                    <span class="service-badge">${garmentType}</span>
                </td>
                <td>
                    <span class="date-badge">${orderDate}</span>
                </td>
                <td>
                    <span class="date-badge ${isOverdue(order.expectedDeliveryDate) ? 'text-danger' : ''}">${dueDate}</span>
                    ${isOverdue(order.expectedDeliveryDate) ? '<br><small class="text-danger">Overdue</small>' : ''}
                </td>
                <td>
                    <span class="badge bg-${getStatusColor(order.status)} status-badge">
                        <i class="${getStatusIcon(order.status)} me-1"></i>${order.status}
                    </span>
                </td>
                <td>
                    <strong class="amount-display">৳${amount.toLocaleString()}</strong>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails('${order._id}')" 
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="updateOrderStatus('${order._id}', '${order.status}')" 
                                title="Update Status">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="viewMeasurements('${order._id}')" 
                                title="View Measurements">
                            <i class="fas fa-ruler"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Helper function to check if order is overdue
    function isOverdue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        return due < today;
    }

    function getStatusColor(status) {
        switch (status) {
            case 'Pending': return 'warning';           // Orange - waiting for action
            case 'Accepted': return 'success';          // Green - approved
            case 'Fabric Collection': return 'info';    // Teal - collection phase
            case 'In Progress': return 'primary';       // Blue - actively working
            case 'Ready for Trial': return 'info';      // Teal - ready to try
            case 'Alterations': return 'warning';       // Orange - modifications needed
            case 'Completed': return 'success';         // Green - finished
            case 'Delivered': return 'dark';            // Dark - final completion
            case 'Cancelled': return 'danger';          // Red - cancelled
            default: return 'secondary';                // Gray - unknown
        }
    }

    function getStatusIcon(status) {
        switch (status) {
            case 'Pending': return 'fas fa-clock';              // Clock - waiting
            case 'Accepted': return 'fas fa-check-circle';      // Check circle - approved
            case 'Fabric Collection': return 'fas fa-hand-paper'; // Hand - collecting
            case 'In Progress': return 'fas fa-cogs';           // Gears - working
            case 'Ready for Trial': return 'fas fa-user-check'; // User check - ready to try
            case 'Alterations': return 'fas fa-edit';           // Edit - modifications
            case 'Completed': return 'fas fa-check-double';     // Double check - finished
            case 'Delivered': return 'fas fa-shipping-fast';    // Shipping - delivered
            case 'Cancelled': return 'fas fa-times-circle';     // X circle - cancelled
            default: return 'fas fa-question-circle';           // Question - unknown
        }
    }

    async function viewOrderDetails(orderId) {
        console.log('🔍 Debug: viewOrderDetails function called with orderId:', orderId);
        try {
            // Fetch order details from tailor-specific API
            const response = await fetch(`${API_URL}/tailors/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await handleApiResponse(response);
            
            if (data.status === 'success') {
                displayOrderDetailsModal(data.data.order);
            } else {
                showNotification('Error loading order details', 'error');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            showNotification('Error loading order details', 'error');
        }
    }

    function displayOrderDetailsModal(order) {
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');
        const dueDate = new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB');
        const amount = order.totalAmount || order.price || order.estimatedPrice || 0;
        
        // Format measurements
        const measurementsHtml = formatMeasurements(order.measurements);
        
        // Format fabric details
        const fabricHtml = formatFabricDetails(order.fabricDetails);
        
        // Format status history
        const statusHistoryHtml = formatStatusHistory(order.statusHistory);
        
        const modalContent = `
            <div class="order-details-container">
                <!-- Order Header -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6 class="text-muted">Order Information</h6>
                        <div class="info-item">
                            <strong>Order ID:</strong> #${order._id.slice(-8).toUpperCase()}
                        </div>
                        <div class="info-item">
                            <strong>Order Date:</strong> ${orderDate}
                        </div>
                        <div class="info-item">
                            <strong>Due Date:</strong> <span class="${isOverdue(order.expectedDeliveryDate) ? 'text-danger' : ''}">${dueDate}</span>
                        </div>
                        <div class="info-item">
                            <strong>Garment Type:</strong> ${order.garmentType || order.clothType || 'Custom'}
                        </div>
                        <div class="info-item">
                            <strong>Amount:</strong> <span class="fw-bold text-success">৳${amount.toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <strong>Status:</strong> 
                            <span class="badge bg-${getStatusColor(order.status)} ms-2 status-badge">
                                <i class="${getStatusIcon(order.status)} me-1"></i>${order.status}
                            </span>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-muted">Customer Information</h6>
                        <div class="info-item">
                            <strong>Name:</strong> ${order.user?.name || 'Customer'}
                        </div>
                        <div class="info-item">
                            <strong>Email:</strong> ${order.user?.email || 'N/A'}
                        </div>
                        <div class="info-item">
                            <strong>Phone:</strong> ${order.user?.phoneNumber || order.user?.phone || 'N/A'}
                        </div>
                        ${order.specialInstructions ? `
                        <div class="info-item">
                            <strong>Special Instructions:</strong>
                            <div class="special-instructions">${order.specialInstructions}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Measurements Section -->
                <div class="mb-4">
                    <h6 class="text-muted">Measurements</h6>
                    <div class="measurements-grid">
                        ${measurementsHtml}
                    </div>
                </div>

                <!-- Fabric Details Section -->
                <div class="mb-4">
                    <h6 class="text-muted">Fabric Details</h6>
                    <div class="fabric-details">
                        ${fabricHtml}
                    </div>
                </div>

                <!-- Status History Section -->
                ${statusHistoryHtml ? `
                <div class="mb-4">
                    <h6 class="text-muted">Status History</h6>
                    <div class="status-history">
                        ${statusHistoryHtml}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('orderDetailsContent').innerHTML = modalContent;
        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        modal.show();
    }

    function formatMeasurements(measurements) {
        if (!measurements) return '<p class="text-muted">No measurements available</p>';
        
        let html = '<div class="row">';
        const measurementEntries = Object.entries(measurements);
        
        measurementEntries.forEach(([key, value], index) => {
            if (value && value !== '' && value !== '0') {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                html += `
                    <div class="col-md-4 mb-2">
                        <div class="measurement-item">
                            <span class="measurement-label">${label}:</span>
                            <span class="measurement-value">${value}"</span>
                        </div>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        return html;
    }

    function formatFabricDetails(fabricDetails) {
        if (!fabricDetails) return '<p class="text-muted">No fabric details available</p>';
        
        let html = '<div class="row">';
        
        if (fabricDetails.provided) {
            html += `
                <div class="col-md-6 mb-2">
                    <strong>Fabric Provided By:</strong> ${fabricDetails.provided === 'customer' ? 'Customer' : 'Tailor'}
                </div>
            `;
        }
        
        if (fabricDetails.type) {
            html += `
                <div class="col-md-6 mb-2">
                    <strong>Fabric Type:</strong> ${fabricDetails.type}
                </div>
            `;
        }
        
        if (fabricDetails.color) {
            html += `
                <div class="col-md-6 mb-2">
                    <strong>Color:</strong> ${fabricDetails.color}
                </div>
            `;
        }
        
        if (fabricDetails.pattern) {
            html += `
                <div class="col-md-6 mb-2">
                    <strong>Pattern:</strong> ${fabricDetails.pattern}
                </div>
            `;
        }
        
        if (fabricDetails.quantity) {
            html += `
                <div class="col-md-6 mb-2">
                    <strong>Quantity:</strong> ${fabricDetails.quantity}
                </div>
            `;
        }
        
        if (fabricDetails.description) {
            html += `
                <div class="col-12 mb-2">
                    <strong>Description:</strong> ${fabricDetails.description}
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    function formatStatusHistory(statusHistory) {
        if (!statusHistory || statusHistory.length === 0) return '';
        
        let html = '<div class="timeline">';
        
        statusHistory.forEach((entry, index) => {
            const date = new Date(entry.date).toLocaleDateString('en-GB');
            const time = new Date(entry.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            
            html += `
                <div class="timeline-item">
                    <div class="timeline-marker bg-${getStatusColor(entry.status)}">
                        <i class="${getStatusIcon(entry.status)}"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-status">
                            <span class="badge bg-${getStatusColor(entry.status)} status-badge">
                                <i class="${getStatusIcon(entry.status)} me-1"></i>${entry.status}
                            </span>
                        </div>
                        <div class="timeline-date">${date} at ${time}</div>
                        ${entry.notes ? `<div class="timeline-notes">${entry.notes}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    async function viewMeasurements(orderId) {
        try {
            // Fetch order details to get measurements using tailor-specific endpoint
            const response = await fetch(`${API_URL}/tailors/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await handleApiResponse(response);
            
            if (data.status === 'success') {
                displayMeasurementsModal(data.data.order);
            } else {
                showNotification('Error loading measurements', 'error');
            }
        } catch (error) {
            console.error('Error fetching measurements:', error);
            showNotification('Error loading measurements', 'error');
        }
    }

    function displayMeasurementsModal(order) {
        const measurementsHtml = formatDetailedMeasurements(order.measurements);
        
        const modalContent = `
            <div class="measurements-container">
                <div class="mb-3">
                    <h6>Order: #${order._id.slice(-8).toUpperCase()}</h6>
                    <p class="text-muted">Customer: ${order.user?.name || 'Customer'}</p>
                    <p class="text-muted">Garment: ${order.garmentType || order.clothType || 'Custom'}</p>
                </div>
                
                <div class="measurements-detailed">
                    ${measurementsHtml}
                </div>
            </div>
        `;
        
        document.getElementById('measurementDetailsContent').innerHTML = modalContent;
        const modal = new bootstrap.Modal(document.getElementById('measurementDetailsModal'));
        modal.show();
    }

    function formatDetailedMeasurements(measurements) {
        if (!measurements) return '<p class="text-muted">No measurements available</p>';
        
        let html = '<div class="measurements-grid">';
        const measurementEntries = Object.entries(measurements);
        
        measurementEntries.forEach(([key, value]) => {
            if (value && value !== '' && value !== '0') {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                html += `
                    <div class="measurement-card">
                        <div class="measurement-label">${label}</div>
                        <div class="measurement-value">${value}"</div>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        return html;
    }

    async function updateOrderStatus(orderId, currentStatus) {
        // Create a simple status update modal
        const statuses = [
            'Pending',
            'Accepted', 
            'Fabric Collection',
            'In Progress',
            'Ready for Trial',
            'Alterations',
            'Completed',
            'Delivered',
            'Cancelled'
        ];

        const statusSelect = statuses.map(status => 
            `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${status}</option>`
        ).join('');

        const modalHtml = `
            <div class="modal fade" id="statusModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Update Order Status</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Order ID: #${orderId.slice(-8).toUpperCase()}</label>
                                <div class="text-muted">Current Status: 
                                    <span class="badge bg-${getStatusColor(currentStatus)} status-badge">
                                        <i class="${getStatusIcon(currentStatus)} me-1"></i>${currentStatus}
                                    </span>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="statusSelect" class="form-label">New Status</label>
                                <select class="form-select" id="statusSelect">
                                    ${statusSelect}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="statusNotes" class="form-label">Notes (optional)</label>
                                <textarea class="form-control" id="statusNotes" rows="3" placeholder="Add any notes about this status update..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="submitStatusUpdate('${orderId}')">Update Status</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('statusModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('statusModal'));
        modal.show();
    }

    async function submitStatusUpdate(orderId) {
        try {
            const status = document.getElementById('statusSelect').value;
            const notes = document.getElementById('statusNotes').value;

            console.log('🔍 Frontend DEBUG: Submitting status update');
            console.log('   Order ID:', orderId);
            console.log('   Status:', status);
            console.log('   Notes:', notes);
            console.log('   API URL:', `${API_URL}/tailors/orders/${orderId}/status`);
            console.log('   Token exists:', !!token);

            const response = await fetch(`${API_URL}/tailors/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, notes })
            });

            console.log('🔍 Response status:', response.status);
            console.log('🔍 Response ok:', response.ok);

            const data = await response.json();
            console.log('🔍 Response data:', data);

            if (data.status === 'success') {
                showNotification('Order status updated successfully', 'success');
                
                // Hide modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('statusModal'));
                modal.hide();
                
                // Reload orders
                loadOrders();
            } else {
                throw new Error(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('❌ Frontend Error updating order status:', error);
            console.error('   Error message:', error.message);
            console.error('   Full error:', error);
            showNotification(error.message || 'Error updating order status', 'error');
        }
    }

    async function loadReviews() {
        try {
            if (!tailorData || !tailorData._id) {
                console.error('Tailor data not available');
                return;
            }

            console.log('Loading reviews for tailor:', tailorData._id);
            
            const response = await fetch(`${API_URL}/reviews/tailor/${tailorData._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Reviews API response status:', response.status);
            
            const data = await response.json();
            console.log('Reviews data:', data);

            if (data.status === 'success') {
                updateReviewsStats(data.data);
                updateReviewsList(data.data.reviews);
                updateRatingDistribution(data.data.reviews);
            } else {
                console.error('Error loading reviews:', data.message);
                showNotification(data.message || 'Error loading reviews', 'error');
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            showNotification('Error loading reviews', 'error');
        }
    }

    function updateReviewsStats(data) {
        const averageRating = data.averageRating || 0;
        const totalReviews = data.totalReviews || 0;
        const reviews = data.reviews || [];
        
        // Calculate stats
        const fiveStarCount = reviews.filter(r => r.rating === 5).length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyReviews = reviews.filter(r => {
            const reviewDate = new Date(r.createdAt);
            return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear;
        }).length;

        // Update DOM elements
        const avgRatingEl = document.getElementById('averageRating');
        const totalReviewsEl = document.getElementById('totalReviewsCount');
        const fiveStarEl = document.getElementById('fiveStarCount');
        const monthlyEl = document.getElementById('monthlyReviewsCount');

        if (avgRatingEl) avgRatingEl.textContent = averageRating.toFixed(1);
        if (totalReviewsEl) totalReviewsEl.textContent = totalReviews;
        if (fiveStarEl) fiveStarEl.textContent = fiveStarCount;
        if (monthlyEl) monthlyEl.textContent = monthlyReviews;
    }

    function updateRatingDistribution(reviews) {
        const container = document.getElementById('ratingDistribution');
        if (!container) return;

        const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        const total = reviews.length;

        reviews.forEach(review => {
            if (ratingCounts[review.rating] !== undefined) {
                ratingCounts[review.rating]++;
            }
        });

        let html = '';
        for (let i = 5; i >= 1; i--) {
            const count = ratingCounts[i];
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            
            html += `
                <div class="rating-bar-item d-flex align-items-center mb-2">
                    <div class="rating-label me-3" style="min-width: 80px;">
                        <span class="fw-bold">${i} star${i > 1 ? 's' : ''}</span>
                    </div>
                    <div class="progress flex-grow-1 me-3" style="height: 20px;">
                        <div class="progress-bar bg-warning" role="progressbar" 
                             style="width: ${percentage}%" aria-valuenow="${percentage}" 
                             aria-valuemin="0" aria-valuemax="100">
                        </div>
                    </div>
                    <div class="rating-count text-muted" style="min-width: 60px;">
                        ${count} (${percentage}%)
                    </div>
                </div>
            `;
        }

        if (total === 0) {
            html = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-star fa-2x mb-3 opacity-50"></i>
                    <p class="mb-0">No reviews yet. Complete some orders to start receiving customer feedback!</p>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    function updateReviewsList(reviews) {
        const container = document.getElementById('reviewsList');
        const loading = document.getElementById('reviewsLoading');
        
        if (loading) loading.style.display = 'none';
        
        if (!container) return;

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-comment fa-3x mb-3 opacity-50"></i>
                    <h5>No Reviews Yet</h5>
                    <p class="mb-0">You haven't received any reviews yet. Complete some orders to start getting customer feedback!</p>
                </div>
            `;
            return;
        }

        let html = '';
        reviews.forEach(review => {
            const reviewDate = new Date(review.createdAt).toLocaleDateString();
            const customerName = review.customerId && review.customerId.name ? review.customerId.name : 'Anonymous Customer';
            const garmentType = review.orderId && review.orderId.garmentType ? review.orderId.garmentType : 'Custom Garment';
            
            const starsHtml = Array.from({length: 5}, (_, i) => 
                `<i class="fas fa-star ${i < review.rating ? 'text-warning' : 'text-muted'}"></i>`
            ).join('');
            
            html += `
                <div class="review-item border-bottom pb-3 mb-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="review-header">
                            <div class="d-flex align-items-center mb-1">
                                <div class="review-stars me-2">
                                    ${starsHtml}
                                </div>
                                <span class="fw-bold text-warning">${review.rating}.0</span>
                            </div>
                            <div class="review-meta">
                                <span class="text-primary fw-semibold">${customerName}</span>
                                <span class="text-muted mx-2">•</span>
                                <span class="text-muted">${garmentType}</span>
                                <span class="text-muted mx-2">•</span>
                                <span class="text-muted">${reviewDate}</span>
                            </div>
                        </div>
                    </div>
                    ${review.feedback ? 
                        `<div class="review-feedback">
                            <p class="mb-0">"${review.feedback}"</p>
                        </div>` : 
                        '<div class="review-feedback text-muted"><em>No written feedback provided</em></div>'
                    }
                </div>
            `;
        });

        container.innerHTML = html;
    }

    async function loadEarnings() {
        try {
            const period = document.getElementById('earningsPeriod').value;
            const response = await fetch(`${API_URL}/earnings?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.status === 'success') {
                updateEarningsData(data.data);
            }
        } catch (error) {
            console.error('Error loading earnings:', error);
            showNotification('Error loading earnings', 'error');
        }
    }

    async function loadMeasurements() {
        try {
            const response = await fetch(`${API_URL}/measurements/tailor`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.status === 'success') {
                updateMeasurementsTable(data.data.measurements);
            }
        } catch (error) {
            console.error('Error loading measurements:', error);
            showNotification('Error loading measurements', 'error');
        }
    }

    async function handleLogout() {
        try {
            // First try to logout from the server
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Keep only the profile data and remove authentication data
            const profileData = localStorage.getItem('tailorProfileData');
            localStorage.clear(); // Clear all localStorage
            if (profileData) {
                localStorage.setItem('tailorProfileData', profileData); // Restore profile data
            }
            window.location.href = '/tailor-auth.html';
        }
    }

    // Utility functions
    function getStatusBadgeColor(status) {
        switch(status.toLowerCase()) {
            case 'pending':
                return 'warning';
            case 'completed':
                return 'success';
            case 'in-progress':
                return 'info';
            case 'cancelled':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    function getStarRating(rating) {
        const fullStar = '<i class="fas fa-star text-warning"></i>';
        const halfStar = '<i class="fas fa-star-half-alt text-warning"></i>';
        const emptyStar = '<i class="far fa-star text-warning"></i>';
        
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < fullStars; i++) {
            stars += fullStar;
        }
        if (hasHalfStar) {
            stars += halfStar;
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += emptyStar;
        }
        
        return stars;
    }

    // Helper function to get image dimensions
    function getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            img.src = URL.createObjectURL(file);
        });
    }

    // Expose functions globally for HTML onclick handlers
    window.viewOrderDetails = viewOrderDetails;
    window.viewMeasurements = viewMeasurements;
    window.updateOrderStatus = updateOrderStatus;
    window.submitStatusUpdate = submitStatusUpdate;
    window.loadOrders = loadOrders;
    
    // Debug: Confirm functions are exposed
    console.log('✅ Debug: Functions exposed globally');
    console.log('✅ Debug: window.viewOrderDetails exists:', typeof window.viewOrderDetails);
    console.log('✅ Debug: window.viewMeasurements exists:', typeof window.viewMeasurements);
    console.log('✅ Debug: window.updateOrderStatus exists:', typeof window.updateOrderStatus);

    function showNotification(message, type = 'info') {
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        toast.setAttribute('role', 'alert');
        toast.style.position = 'fixed';
        toast.style.top = '1rem';
        toast.style.right = '1rem';
        toast.style.zIndex = '9999';
        toast.style.minWidth = '250px';

        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // Global filter function for reviews
    window.filterReviews = function() {
        const filterValue = document.getElementById('reviewRatingFilter').value;
        const reviewItems = document.querySelectorAll('.review-item');
        
        reviewItems.forEach(item => {
            const ratingStars = item.querySelectorAll('.review-stars .fa-star.text-warning').length;
            
            if (filterValue === 'all' || ratingStars == filterValue) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    };
}).catch(error => {
    console.error('Error initializing tailor dashboard:', error);
    // Show error message in the UI
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger m-3';
    errorDiv.innerHTML = `
        <h4 class="alert-heading">Error Loading Dashboard</h4>
        <p>There was an error loading the dashboard. Please try refreshing the page.</p>
        <hr>
        <p class="mb-0">If the problem persists, please log out and log in again.</p>
    `;
    document.body.insertBefore(errorDiv, document.body.firstChild);
});
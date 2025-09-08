document.addEventListener('DOMContentLoaded', async function() {
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api'
        : 'https://tailor-craft.vercel.app/api';
    const TOKEN_KEY = 'token';
    const MEASUREMENTS_KEY = 'savedMeasurements';
    
    // Global variable to store all tailors for filtering
    let allTailors = [];
    
    // Get user token
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        window.location.href = '/customer-auth.html';
        return;
    }

    // Initialize components
    initializeEventListeners();
    await loadAvailableTailors();
    initializeFabricSelection();

    function initializeEventListeners() {
        // Form submission
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', handleOrderSubmission);
        }

        // Garment type change handler
        const garmentType = document.getElementById('garmentType');
        if (garmentType) {
            garmentType.addEventListener('change', updateMeasurementsForm);
        }
        
        // Measurements handling
        const loadMeasurementsBtn = document.getElementById('loadSavedMeasurements');
        if (loadMeasurementsBtn) {
            loadMeasurementsBtn.addEventListener('click', () => {
                loadMeasurementProfiles();
                const measurementsModal = new bootstrap.Modal(document.getElementById('measurementsModal'));
                measurementsModal.show();
            });
        }
        
        const useSavedMeasurements = document.getElementById('useSavedMeasurements');
        if (useSavedMeasurements) {
            useSavedMeasurements.addEventListener('change', function() {
                if (this.checked) {
                    loadSavedMeasurements();
                }
            });
        }
        
        // Fabric provider change handler
        const fabricProviderRadios = document.querySelectorAll('input[name="fabricProvider"]');
        fabricProviderRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const fabricDetailsSection = document.getElementById('fabricDetailsSection');
                if (fabricDetailsSection) {
                    fabricDetailsSection.style.display = this.value === 'customer' ? 'block' : 'none';
                }
            });
        });

        // Initialize Bootstrap tooltips if any
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    }
    
    // Initialize components first
    await initializeMeasurements();

    async function initializeMeasurements() {
        // Load saved measurements if they exist
        try {
            const response = await fetch(`${API_URL}/measurements/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.status === 'success' && data.data.measurements) {
                document.getElementById('useSavedMeasurements').disabled = false;
            }
        } catch (error) {
            console.error('Error loading saved measurements:', error);
        }
    }

    async function loadAvailableTailors() {
        try {
            const response = await fetch(`${API_URL}/tailors`);
            const data = await response.json();
            
            if (data.status === 'success') {
                // Store all tailors for filtering
                allTailors = data.data.tailors;
                
                // Update count display
                updateTailorsCount(allTailors.length, allTailors.length);
                
                // Render all tailors initially
                renderTailors(allTailors);
            }
        } catch (error) {
            console.error('Error loading tailors:', error);
            showNotification('Error loading available tailors', 'error');
            
            // Show error message in the tailors list
            const tailorsList = document.getElementById('tailorsList');
            tailorsList.innerHTML = `
                <div class="col-12 text-center text-danger">
                    <p>Failed to load tailors. Please try refreshing the page.</p>
                    <button class="btn btn-outline-primary" onclick="location.reload()">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }

    function renderTailors(tailors) {
        const tailorsList = document.getElementById('tailorsList');
        tailorsList.innerHTML = '';

        if (tailors.length === 0) {
            tailorsList.innerHTML = '<div class="col-12"><div class="alert alert-info">No tailors match your filters.</div></div>';
            return;
        }

        tailors.forEach(tailor => {
            const tailorCard = document.createElement('div');
            tailorCard.className = 'col-md-4 mb-3';
            
            // Safely handle missing properties
            const shopName = tailor.shopName || 'Not specified';
            const experience = tailor.experience || 'Not specified';
            const specialization = Array.isArray(tailor.specialization) ? tailor.specialization.join(', ') : 'Not specified';
            const rating = tailor.rating ? tailor.rating.toFixed(1) : 'New';
            const city = tailor.shopAddress?.city || '';
            const state = tailor.shopAddress?.state || '';
            const location = city && state ? `${city}, ${state}` : (city || state || 'Location not specified');
            
            tailorCard.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="selectedTailor" 
                                   value="${tailor._id}" id="tailor_${tailor._id}" required>
                            <label class="form-check-label" for="tailor_${tailor._id}">
                                <h5 class="card-title mb-1">${tailor.name}</h5>
                                <p class="card-text mb-2">
                                    <small class="text-muted">Shop: ${shopName}</small><br>
                                    <small class="text-muted">Experience: ${experience} years</small><br>
                                    <small class="text-muted">Specialization: ${specialization}</small><br>
                                    <small class="text-muted">Rating: ${rating} ⭐</small>
                                </p>
                                <div class="text-muted">
                                    <small>Location: ${location}</small>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            `;
            tailorsList.appendChild(tailorCard);

            // Add click handler for the whole card
            const card = tailorCard.querySelector('.card');
            card.addEventListener('click', () => {
                const radio = tailorCard.querySelector('input[type="radio"]');
                radio.checked = true;
                // Remove selected class from all cards
                document.querySelectorAll('#tailorsList .card').forEach(c => {
                    c.classList.remove('selected');
                });
                // Add selected class to clicked card
                card.classList.add('selected');
            });
        });
    }

    function updateTailorsCount(showing, total) {
        const countElement = document.getElementById('tailorsCount');
        if (countElement) {
            if (showing === total) {
                countElement.textContent = `Showing ${total} tailor${total !== 1 ? 's' : ''}`;
            } else {
                countElement.textContent = `Showing ${showing} of ${total} tailors`;
            }
        }
    }

    // Make filter functions global so HTML can access them
    window.filterTailors = function() {
        const nameSearch = document.getElementById('tailorNameSearch').value.toLowerCase().trim();
        const specializationFilter = document.getElementById('specializationFilter').value;
        const experienceFilter = document.getElementById('experienceFilter').value;
        const locationFilter = document.getElementById('locationFilter').value.toLowerCase().trim();

        const filteredTailors = allTailors.filter(tailor => {
            // Name filter
            const nameMatch = !nameSearch || tailor.name.toLowerCase().includes(nameSearch);
            
            // Specialization filter
            let specializationMatch = true;
            if (specializationFilter) {
                specializationMatch = Array.isArray(tailor.specialization) && 
                                    tailor.specialization.includes(specializationFilter);
            }
            
            // Experience filter
            let experienceMatch = true;
            if (experienceFilter && tailor.experience) {
                const exp = parseInt(tailor.experience);
                switch (experienceFilter) {
                    case '1-5':
                        experienceMatch = exp >= 1 && exp <= 5;
                        break;
                    case '6-10':
                        experienceMatch = exp >= 6 && exp <= 10;
                        break;
                    case '11-15':
                        experienceMatch = exp >= 11 && exp <= 15;
                        break;
                    case '16+':
                        experienceMatch = exp >= 16;
                        break;
                }
            }
            
            // Location filter
            let locationMatch = true;
            if (locationFilter) {
                const city = tailor.shopAddress?.city?.toLowerCase() || '';
                const state = tailor.shopAddress?.state?.toLowerCase() || '';
                const shopName = tailor.shopName?.toLowerCase() || '';
                locationMatch = city.includes(locationFilter) || 
                              state.includes(locationFilter) || 
                              shopName.includes(locationFilter);
            }
            
            return nameMatch && specializationMatch && experienceMatch && locationMatch;
        });

        renderTailors(filteredTailors);
        updateTailorsCount(filteredTailors.length, allTailors.length);
    };

    window.clearFilters = function() {
        document.getElementById('tailorNameSearch').value = '';
        document.getElementById('specializationFilter').value = '';
        document.getElementById('experienceFilter').value = '';
        document.getElementById('locationFilter').value = '';
        
        renderTailors(allTailors);
        updateTailorsCount(allTailors.length, allTailors.length);
    };

    async function loadSavedMeasurements() {
        try {
            const response = await fetch(`${API_URL}/measurements/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                const measurements = data.data.measurements;
                // Populate measurement fields
                Object.keys(measurements).forEach(key => {
                    const input = document.getElementById(key);
                    if (input) input.value = measurements[key];
                });
            }
        } catch (error) {
            console.error('Error loading saved measurements:', error);
            showNotification('Error loading saved measurements', 'error');
        }
    }

    function initializeFabricSelection() {
        // Initialize fabric provider selection handlers
        const fabricProviderRadios = document.querySelectorAll('input[name="fabricProvider"]');
        fabricProviderRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                toggleFabricSections(this.value);
            });
        });
        
        // Initialize fabric type change handler for recommendations
        const fabricType = document.getElementById('fabricType');
        if (fabricType) {
            fabricType.addEventListener('change', function() {
                updateFabricRecommendations(this.value);
            });
        }
        
        // Set initial state
        const checkedProvider = document.querySelector('input[name="fabricProvider"]:checked');
        if (checkedProvider) {
            toggleFabricSections(checkedProvider.value);
        }
    }
    
    function toggleFabricSections(providerType) {
        const fabricDetailsSection = document.getElementById('fabricDetailsSection');
        const fabricBudgetSection = document.getElementById('fabricBudgetSection');
        const fabricSourceSection = document.getElementById('fabricSourceSection');
        
        if (providerType === 'customer') {
            // Customer provides fabric - show fabric details, hide budget/source
            if (fabricDetailsSection) fabricDetailsSection.style.display = 'block';
            if (fabricBudgetSection) fabricBudgetSection.style.display = 'none';
            if (fabricSourceSection) fabricSourceSection.style.display = 'none';
            
            // Make fabric fields required
            const requiredFields = ['fabricType', 'fabricColor', 'fabricPattern', 'fabricQuantity'];
            requiredFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.required = true;
            });
        } else {
            // Tailor provides fabric - show all sections
            if (fabricDetailsSection) fabricDetailsSection.style.display = 'block';
            if (fabricBudgetSection) fabricBudgetSection.style.display = 'block';
            if (fabricSourceSection) fabricSourceSection.style.display = 'block';
            
            // Make fabric fields optional when tailor provides
            const optionalFields = ['fabricType', 'fabricColor', 'fabricPattern', 'fabricQuantity'];
            optionalFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.required = false;
            });
        }
    }
    
    function updateFabricRecommendations(fabricType) {
        // Provide fabric-specific recommendations
        const quantityField = document.getElementById('fabricQuantity');
        const recommendations = {
            'cotton': { quantity: '2.5', width: '44' },
            'silk': { quantity: '3', width: '44' },
            'chiffon': { quantity: '3.5', width: '44' },
            'georgette': { quantity: '3', width: '44' },
            'linen': { quantity: '2.5', width: '42' },
            'velvet': { quantity: '2', width: '58' },
            'brocade': { quantity: '2.5', width: '44' }
        };
        
        if (fabricType && recommendations[fabricType] && quantityField) {
            quantityField.placeholder = `Recommended: ${recommendations[fabricType].quantity} meters`;
        }
    }

    async function handleOrderSubmission(e) {
        e.preventDefault();
        
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        
        try {
            // Validate form
            if (!validateForm()) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                return;
            }

            // Get selected tailor
            const selectedTailor = document.querySelector('input[name="selectedTailor"]:checked');
            
            // Get measurements
            const measurementInputs = document.querySelectorAll('#measurementsForm input[type="number"]');
            const measurements = {};
            measurementInputs.forEach(input => {
                measurements[input.name] = parseFloat(input.value);
            });

            // Get fabric details
            const fabricProvider = document.querySelector('input[name="fabricProvider"]:checked');
            
            // Collect finishing options
            const finishingOptions = [];
            const finishingCheckboxes = document.querySelectorAll('input[name="finishing"]:checked');
            finishingCheckboxes.forEach(checkbox => {
                finishingOptions.push(checkbox.value);
            });
            
            const fabricDetails = {
                provider: fabricProvider?.value || 'customer',
                type: document.getElementById('fabricType')?.value || '',
                color: document.getElementById('fabricColor')?.value || '',
                secondaryColor: document.getElementById('secondaryColor')?.value || '',
                pattern: document.getElementById('fabricPattern')?.value || '',
                weight: document.getElementById('fabricWeight')?.value || '',
                texture: document.getElementById('fabricTexture')?.value || '',
                quantity: parseFloat(document.getElementById('fabricQuantity')?.value) || 0,
                width: document.getElementById('fabricWidth')?.value || '',
                finishing: finishingOptions,
                careInstructions: document.getElementById('fabricCareInstructions')?.value || '',
                budget: parseFloat(document.getElementById('fabricBudget')?.value) || 0,
                source: document.getElementById('fabricSource')?.value || ''
            };

            // Prepare order data
            const orderData = {
                tailorId: selectedTailor.value,
                garmentType: document.getElementById('garmentType')?.value,
                estimatedPrice: parseFloat(document.getElementById('estimatedPrice')?.value) || 0,
                measurements,
                fabricDetails,
                specialInstructions: document.getElementById('specialInstructions')?.value || '',
                expectedDeliveryDate: document.getElementById('expectedDeliveryDate')?.value,
                saveMeasurements: document.getElementById('saveMeasurements')?.checked || false
            };

            // Submit order
            console.log('🚀 Submitting order data:', orderData);
            console.log('📍 API URL:', `${API_URL}/orders`);
            console.log('🔐 Token:', token ? 'Present' : 'Missing');
            
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            
            const data = await response.json();
            console.log('📊 Response data:', data);
            
            if (data.status === 'success') {
                // Save measurements if requested
                if (orderData.saveMeasurements) {
                    await saveMeasurements(orderData.measurements);
                }

                // Show success message with order details modal
                const successModal = new bootstrap.Modal(document.getElementById('orderSuccessModal'));
                document.getElementById('orderSuccessDetails').innerHTML = `
                    <p class="text-success"><i class="bi bi-check-circle-fill"></i> Order placed successfully!</p>
                    <p>Order ID: <strong>${data.data.orderId}</strong></p>
                    <p>Selected Tailor: <strong>${selectedTailor.closest('label').querySelector('.card-title').textContent}</strong></p>
                    <p>Expected Delivery: <strong>${new Date(orderData.expectedDeliveryDate).toLocaleDateString()}</strong></p>
                    ${orderData.saveMeasurements ? '<p><small class="text-success"><i class="bi bi-save"></i> Measurements saved to your profile</small></p>' : ''}
                `;
                successModal.show();

                // Add event listener to the "View Order" button in the modal
                document.getElementById('viewOrderButton').onclick = () => {
                    window.location.href = `/order-tracking.html?orderId=${data.data.orderId}`;
                };
            } else {
                throw new Error(data.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            showNotification('Error placing order: ' + (error.message || 'Please try again later'), 'error');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }

    async function saveMeasurements(measurements) {
        try {
            const response = await fetch(`${API_URL}/measurements`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    measurements,
                    label: `Measurements from ${new Date().toLocaleDateString()}`
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                showNotification('Measurements saved to your profile', 'success');
            } else {
                throw new Error(data.message || 'Failed to save measurements');
            }
        } catch (error) {
            console.error('Error saving measurements:', error);
            showNotification('Failed to save measurements to profile: ' + error.message, 'warning');
        }
    }

    // Function to load saved measurements from profile
    async function loadMeasurementProfiles() {
        try {
            const response = await fetch(`${API_URL}/measurements/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.status === 'success' && data.data.measurements.length > 0) {
                const measurementsList = document.getElementById('savedMeasurementsList');
                measurementsList.innerHTML = ''; // Clear existing list

                data.data.measurements.forEach(profile => {
                    // Get the first few measurements for display
                    const measurementEntries = Object.entries(profile.measurements);
                    const displayMeasurements = measurementEntries.slice(0, 3).map(([key, value]) => 
                        `${key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}"`
                    ).join(', ');
                    
                    const profileCard = document.createElement('div');
                    profileCard.className = 'card mb-2';
                    profileCard.innerHTML = `
                        <div class="card-body">
                            <h6 class="card-title">${profile.label}</h6>
                            <p class="text-muted small mb-1">${profile.garmentType.charAt(0).toUpperCase() + profile.garmentType.slice(1).replace('-', ' ')}</p>
                            <div class="measurements-summary">
                                <small class="text-muted">
                                    ${displayMeasurements}
                                    ${measurementEntries.length > 3 ? `... +${measurementEntries.length - 3} more` : ''}
                                </small>
                            </div>
                            <button class="btn btn-sm btn-outline-primary mt-2" 
                                    onclick="useMeasurementProfile('${profile._id}')">
                                Use These Measurements
                            </button>
                        </div>
                    `;
                    measurementsList.appendChild(profileCard);
                });
            } else {
                document.getElementById('savedMeasurementsList').innerHTML = `
                    <div class="alert alert-info">
                        No saved measurements found. Complete your first order to save your measurements!
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading measurement profiles:', error);
            showNotification('Error loading saved measurements', 'error');
        }
    }

    // Function to apply selected measurement profile
    async function useMeasurementProfile(profileId) {
        try {
            const response = await fetch(`${API_URL}/measurements/${profileId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                const measurement = data.data.measurement; // Fixed: should be singular
                
                // First, set the garment type to match the saved measurement
                const garmentTypeSelect = document.getElementById('garmentType');
                if (garmentTypeSelect) {
                    garmentTypeSelect.value = measurement.garmentType;
                    // Trigger change event to update measurement fields
                    updateMeasurementsForm();
                }
                
                // Wait a bit for the fields to be generated, then populate them
                setTimeout(() => {
                    Object.entries(measurement.measurements).forEach(([key, value]) => {
                        const input = document.querySelector(`input[name="${key}"]`);
                        if (input) {
                            input.value = value;
                            input.classList.add('is-valid');
                        }
                    });
                }, 100);
                
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('measurementsModal'));
                modal.hide();
                
                showNotification('Measurements loaded successfully', 'success');
            }
        } catch (error) {
            console.error('Error loading measurement profile:', error);
            showNotification('Error loading measurements', 'error');
        }
    }

    function validateForm() {
        let isValid = true;
        const errorMessages = [];

        // Validate garment type
        const garmentType = document.getElementById('garmentType');
        if (!garmentType || !garmentType.value) {
            errorMessages.push('Please select a garment type');
            isValid = false;
        }

        // Validate expected delivery date
        const expectedDeliveryDate = document.getElementById('expectedDeliveryDate');
        if (!expectedDeliveryDate || !expectedDeliveryDate.value) {
            errorMessages.push('Please select expected delivery date');
            isValid = false;
        }

        // Validate tailor selection
        const selectedTailor = document.querySelector('input[name="selectedTailor"]:checked');
        if (!selectedTailor) {
            errorMessages.push('Please select a tailor');
            isValid = false;
        }

        // Validate measurements
        const measurementInputs = document.querySelectorAll('#measurementsForm input[type="number"]');
        measurementInputs.forEach(input => {
            if (!input.value) {
                input.classList.add('is-invalid');
                errorMessages.push(`${input.getAttribute('data-measurement')} measurement is required`);
                isValid = false;
            } else {
                input.classList.remove('is-invalid');
            }
        });

        // Validate fabric details
        const fabricProvider = document.querySelector('input[name="fabricProvider"]:checked');
        if (!fabricProvider) {
            errorMessages.push('Please select fabric provider');
            isValid = false;
        }

        if (fabricProvider && fabricProvider.value === 'customer') {
            // When customer provides fabric, these fields are required
            const requiredFabricFields = [
                { id: 'fabricType', name: 'Fabric type' },
                { id: 'fabricColor', name: 'Fabric color' },
                { id: 'fabricPattern', name: 'Fabric pattern' },
                { id: 'fabricQuantity', name: 'Fabric quantity' }
            ];

            requiredFabricFields.forEach(field => {
                const element = document.getElementById(field.id);
                if (!element || !element.value || (field.id === 'fabricQuantity' && parseFloat(element.value) <= 0)) {
                    if (element) element.classList.add('is-invalid');
                    errorMessages.push(`${field.name} is required when you provide the fabric`);
                    isValid = false;
                } else {
                    if (element) element.classList.remove('is-invalid');
                }
            });
        }

        // Show all error messages if any
        if (!isValid) {
            showNotification(errorMessages.join('<br>'), 'error');
        }

        return isValid;
    }

    // Add missing functions
    function updateMeasurementsForm() {
        const garmentType = document.getElementById('garmentType').value;
        const measurementsForm = document.getElementById('measurementsForm');
        
        if (!garmentType) {
            measurementsForm.innerHTML = `
                <div class="col-12 text-center text-muted">
                    Please select a garment type to see required measurements
                </div>
            `;
            return;
        }

        const measurementFields = getMeasurementFields(garmentType);
        measurementsForm.innerHTML = measurementFields.map(field => `
            <div class="col-md-4">
                <label class="form-label">${field.label} (cm)</label>
                <input type="number" class="form-control" name="${field.name}" 
                       id="${field.name}" min="1" step="0.5" required
                       data-measurement="${field.label}">
            </div>
        `).join('');
    }

    function getMeasurementFields(garmentType) {
        const garmentSpecific = {
            'kurti': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'hips', label: 'Hips' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'armhole', label: 'Armhole' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'kurti_length', label: 'Kurti Length' },
                { name: 'neck_depth', label: 'Neck Depth' }
            ],
            'salwar-kameez': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'hips', label: 'Hips' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'armhole', label: 'Armhole' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'kameez_length', label: 'Kameez Length' },
                { name: 'salwar_length', label: 'Salwar Length' },
                { name: 'salwar_bottom', label: 'Salwar Bottom' },
                { name: 'neck_depth', label: 'Neck Depth' }
            ],
            'sharee-blouse': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'armhole', label: 'Armhole' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'blouse_length', label: 'Blouse Length' },
                { name: 'neck_depth', label: 'Neck Depth' },
                { name: 'back_neck_depth', label: 'Back Neck Depth' }
            ],
            'lehenga': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'hips', label: 'Hips' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'armhole', label: 'Armhole' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'choli_length', label: 'Choli Length' },
                { name: 'lehenga_length', label: 'Lehenga Length' },
                { name: 'lehenga_waist', label: 'Lehenga Waist' }
            ],
            'burkha': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'hips', label: 'Hips' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'burkha_length', label: 'Burkha Length' },
                { name: 'neck_round', label: 'Neck Round' },
                { name: 'armhole', label: 'Armhole' }
            ],
            'three-piece': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'hips', label: 'Hips' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'armhole', label: 'Armhole' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'shirt_length', label: 'Shirt Length' },
                { name: 'trouser_length', label: 'Trouser Length' },
                { name: 'trouser_waist', label: 'Trouser Waist' }
            ],
            'anarkali': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'hips', label: 'Hips' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'armhole', label: 'Armhole' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'anarkali_length', label: 'Anarkali Length' },
                { name: 'flair', label: 'Flair (Bottom Width)' },
                { name: 'neck_depth', label: 'Neck Depth' }
            ],
            'palazzo-set': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'hips', label: 'Hips' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'armhole', label: 'Armhole' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'top_length', label: 'Top Length' },
                { name: 'palazzo_length', label: 'Palazzo Length' },
                { name: 'palazzo_waist', label: 'Palazzo Waist' }
            ],
            'gharara': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'hips', label: 'Hips' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'armhole', label: 'Armhole' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'shirt_length', label: 'Shirt Length' },
                { name: 'gharara_length', label: 'Gharara Length' },
                { name: 'gharara_waist', label: 'Gharara Waist' },
                { name: 'knee_round', label: 'Knee Round' }
            ],
            'sharara': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'hips', label: 'Hips' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'armhole', label: 'Armhole' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'shirt_length', label: 'Shirt Length' },
                { name: 'sharara_length', label: 'Sharara Length' },
                { name: 'sharara_waist', label: 'Sharara Waist' }
            ],
            'churidar': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'hips', label: 'Hips' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'armhole', label: 'Armhole' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'kameez_length', label: 'Kameez Length' },
                { name: 'churidar_length', label: 'Churidar Length' },
                { name: 'thigh_round', label: 'Thigh Round' },
                { name: 'ankle_round', label: 'Ankle Round' }
            ],
            'frock': [
                { name: 'chest', label: 'Chest' },
                { name: 'waist', label: 'Waist' },
                { name: 'hips', label: 'Hips' },
                { name: 'shoulder', label: 'Shoulder Width' },
                { name: 'armhole', label: 'Armhole' },
                { name: 'sleeve_length', label: 'Sleeve Length' },
                { name: 'frock_length', label: 'Frock Length' },
                { name: 'neck_depth', label: 'Neck Depth' }
            ]
        };

        return garmentSpecific[garmentType] || [
            { name: 'chest', label: 'Chest' },
            { name: 'waist', label: 'Waist' },
            { name: 'hips', label: 'Hips' },
            { name: 'shoulder', label: 'Shoulder Width' }
        ];
    }

    // Make functions globally available
    window.useMeasurementProfile = useMeasurementProfile;

    function showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.getElementById('notifications').appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
});

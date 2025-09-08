// Dashboard Order Form Handler
// This handles the order form within the customer dashboard

class DashboardOrderHandler {
    constructor() {
        this.API_URL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api'
            : 'https://tailor-craft.vercel.app/api';
        this.TOKEN_KEY = 'token';
        this.token = localStorage.getItem(this.TOKEN_KEY);
        this.allTailors = []; // Store all tailors for filtering
        
        // Check if token exists
        if (!this.token) {
            console.warn('No authentication token found');
            this.showNotification('Please log in to access this feature', 'warning');
        }
        
        this.init();
    }

    init() {
        // Only initialize if we're on the dashboard page
        if (!document.getElementById('dashboardOrderForm')) {
            console.log('Dashboard order form not found, skipping initialization');
            return;
        }
        
        console.log('Initializing dashboard order handler...');
        this.setupEventListeners();
        
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
            console.log('Loading tailors after DOM ready...');
            this.loadAvailableTailors();
        }, 100);
        
        this.initializeFabricSelection();
        this.setMinDeliveryDate();
    }

    setupEventListeners() {
        // Form submission
        const orderForm = document.getElementById('dashboardOrderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => this.handleOrderSubmission(e));
        }

        // Garment type change handler
        const garmentType = document.getElementById('dashboardGarmentType');
        if (garmentType) {
            garmentType.addEventListener('change', () => this.updateMeasurementsForm());
        }
        
        // Load saved measurements button
        const loadMeasurementsBtn = document.getElementById('dashboardLoadSavedMeasurements');
        if (loadMeasurementsBtn) {
            loadMeasurementsBtn.addEventListener('click', async () => {
                console.log('Load measurements button clicked');
                
                // First load the measurements, then show modal
                await this.loadMeasurementProfiles();
                
                // Show modal after data is loaded
                try {
                    const modalElement = document.getElementById('dashboardMeasurementsModal');
                    if (modalElement) {
                        let measurementsModal;
                        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                            measurementsModal = new bootstrap.Modal(modalElement);
                            measurementsModal.show();
                        } else if (typeof Bootstrap !== 'undefined' && Bootstrap.Modal) {
                            measurementsModal = new Bootstrap.Modal(modalElement);
                            measurementsModal.show();
                        } else {
                            // Fallback: manually show modal
                            modalElement.style.display = 'block';
                            modalElement.classList.add('show');
                            modalElement.setAttribute('aria-modal', 'true');
                            modalElement.setAttribute('role', 'dialog');
                            modalElement.removeAttribute('aria-hidden');
                            
                            // Add backdrop
                            const backdrop = document.createElement('div');
                            backdrop.className = 'modal-backdrop fade show';
                            backdrop.id = 'modal-backdrop-measurements';
                            document.body.appendChild(backdrop);
                            document.body.classList.add('modal-open');
                        }
                    } else {
                        console.error('Modal element not found');
                    }
                } catch (error) {
                    console.error('Error showing modal:', error);
                    this.showNotification('Error opening measurements modal: ' + error.message, 'error');
                }
            });
        }
        
        // Add fallback modal close handlers
        const modalCloseButtons = document.querySelectorAll('#dashboardMeasurementsModal .btn-close, #dashboardMeasurementsModal [data-bs-dismiss="modal"]');
        modalCloseButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeMeasurementsModal();
            });
        });
        
        // Fabric provider change handler
        const fabricProviderRadios = document.querySelectorAll('input[name="dashboardFabricProvider"]');
        fabricProviderRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.toggleDashboardFabricSections(radio.value);
            });
        });
    }

    setMinDeliveryDate() {
        // Set minimum delivery date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const deliveryDateInput = document.getElementById('dashboardExpectedDeliveryDate');
        if (deliveryDateInput) {
            deliveryDateInput.min = tomorrow.toISOString().split('T')[0];
        }
    }

    async loadAvailableTailors() {
        try {
            console.log('Loading tailors...');
            console.log('API URL:', this.API_URL);
            
            // Show loading state
            const tailorsList = document.getElementById('dashboardTailorsList');
            if (tailorsList) {
                tailorsList.innerHTML = '<div class="col-12"><div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p>Loading tailors...</p></div></div>';
            }
            
            const response = await fetch(`${this.API_URL}/tailors`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Tailors data:', data);
            
            if (data.status === 'success' && data.data && data.data.tailors && Array.isArray(data.data.tailors)) {
                if (!tailorsList) {
                    console.error('Element dashboardTailorsList not found');
                    return;
                }
                
                tailorsList.innerHTML = ''; // Clear loading spinner
                
                console.log('Number of tailors:', data.data.tailors.length);
                
                // Store all tailors for filtering
                this.allTailors = data.data.tailors;
                
                // Update count display
                this.updateTailorsCount(this.allTailors.length, this.allTailors.length);
                
                if (data.data.tailors.length === 0) {
                    tailorsList.innerHTML = '<div class="col-12"><div class="alert alert-warning">No tailors are currently available. Please try again later or contact support.</div></div>';
                    return;
                }

                this.renderTailors(this.allTailors);
            } else {
                console.error('API returned invalid format:', data);
                throw new Error(data.message || 'Invalid response format from server');
            }
        } catch (error) {
            console.error('Error loading tailors:', error);
            
            // Show detailed error in the tailors list
            const tailorsList = document.getElementById('dashboardTailorsList');
            if (tailorsList) {
                tailorsList.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger">
                            <h6>Failed to load tailors</h6>
                            <p>Error: ${error.message}</p>
                            <div class="mt-3">
                                <button class="btn btn-primary me-2" onclick="window.dashboardOrderHandler.loadAvailableTailors()">
                                    <i class="fas fa-refresh"></i> Retry
                                </button>
                                <button class="btn btn-outline-secondary" onclick="location.reload()">
                                    <i class="fas fa-redo"></i> Refresh Page
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Don't show the notification popup if we're already showing the error in the list
            // this.showNotification('Error loading available tailors', 'error');
        }
    }

    renderTailors(tailors) {
        const tailorsList = document.getElementById('dashboardTailorsList');
        tailorsList.innerHTML = '';

        if (tailors.length === 0) {
            tailorsList.innerHTML = '<div class="col-12"><div class="alert alert-info">No tailors match your filters.</div></div>';
            return;
        }

        tailors.forEach(tailor => {
            console.log('Rendering tailor:', tailor); // Debug log to see tailor structure
            
            const tailorCard = document.createElement('div');
            tailorCard.className = 'col-md-4 mb-3';
            tailorCard.setAttribute('data-tailor-id', tailor._id);
            
            // Safely handle missing properties with fallbacks
            const tailorName = tailor.name || tailor.fullName || tailor.firstName || 'Unknown Tailor';
            const shopName = tailor.shopName || 'Not specified';
            const experience = tailor.experience || 'Not specified';
            
            console.log('Tailor name extracted:', tailorName); // Debug log
            
            // Handle specialization array - could be different formats
            let specialization = 'Not specified';
            if (tailor.specialization && Array.isArray(tailor.specialization)) {
                specialization = tailor.specialization.join(', ');
            } else if (tailor.specializations && Array.isArray(tailor.specializations)) {
                specialization = tailor.specializations.join(', ');
            }
            
            // Handle location - could be in shopAddress or location field
            let location = 'Location not specified';
            if (tailor.shopAddress && tailor.shopAddress.city) {
                const city = tailor.shopAddress.city || '';
                const state = tailor.shopAddress.state || '';
                location = city && state ? `${city}, ${state}` : (city || state || 'Location not specified');
            } else if (tailor.location) {
                location = tailor.location;
            }
            
            // Show "New" for all tailors since it's the beginning
            const rating = 'New';
            
            tailorCard.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="dashboardSelectedTailor" 
                                   value="${tailor._id}" id="dashboard_tailor_${tailor._id}" 
                                   data-tailor-name="${tailorName}" data-shop-name="${shopName}" required>
                            <label class="form-check-label" for="dashboard_tailor_${tailor._id}">
                                <h5 class="card-title mb-1">${tailorName}</h5>
                                <p class="card-text mb-2">
                                    <small class="text-muted">Shop: ${shopName}</small><br>
                                    <small class="text-muted">Experience: ${experience} years</small><br>
                                    <small class="text-muted">Specialization: ${specialization}</small><br>
                                    <small class="text-muted">Rating: ${rating}</small>
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
                document.querySelectorAll('#dashboardTailorsList .card').forEach(c => {
                    c.classList.remove('selected');
                });
                // Add selected class to clicked card
                card.classList.add('selected');
            });
        });
    }

    updateTailorsCount(showing, total) {
        const countElement = document.getElementById('dashboardTailorsCount');
        if (countElement) {
            if (showing === total) {
                countElement.textContent = `Showing ${total} tailor${total !== 1 ? 's' : ''}`;
            } else {
                countElement.textContent = `Showing ${showing} of ${total} tailors`;
            }
        }
    }

    filterTailors() {
        const nameSearch = document.getElementById('dashboardTailorNameSearch').value.toLowerCase().trim();
        const specializationFilter = document.getElementById('dashboardSpecializationFilter').value;
        const experienceFilter = document.getElementById('dashboardExperienceFilter').value;
        const locationFilter = document.getElementById('dashboardLocationFilter').value.toLowerCase().trim();

        const filteredTailors = this.allTailors.filter(tailor => {
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

        this.renderTailors(filteredTailors);
        this.updateTailorsCount(filteredTailors.length, this.allTailors.length);
    }

    clearFilters() {
        document.getElementById('dashboardTailorNameSearch').value = '';
        document.getElementById('dashboardSpecializationFilter').value = '';
        document.getElementById('dashboardExperienceFilter').value = '';
        document.getElementById('dashboardLocationFilter').value = '';
        
        this.renderTailors(this.allTailors);
        this.updateTailorsCount(this.allTailors.length, this.allTailors.length);
    }

    updateMeasurementsForm() {
        const garmentType = document.getElementById('dashboardGarmentType').value;
        const measurementsForm = document.getElementById('dashboardMeasurementsForm');
        
        if (!garmentType) {
            measurementsForm.innerHTML = `
                <div class="col-12 text-center text-muted">
                    Please select a garment type to see required measurements
                </div>
            `;
            return;
        }

        const measurementFields = this.getMeasurementFields(garmentType);
        measurementsForm.innerHTML = measurementFields.map(field => `
            <div class="col-md-4">
                <label class="form-label">${field.label} (cm)</label>
                <input type="number" class="form-control" name="${field.name}" 
                       id="dashboard_${field.name}" min="1" step="0.5" required
                       data-measurement="${field.label}">
            </div>
        `).join('');
    }

    getMeasurementFields(garmentType) {
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

    initializeFabricSelection() {
        // Initialize fabric provider selection handlers
        const fabricProviderRadios = document.querySelectorAll('input[name="dashboardFabricProvider"]');
        fabricProviderRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.toggleDashboardFabricSections(radio.value);
            });
        });
        
        // Initialize fabric type change handler for recommendations
        const fabricType = document.getElementById('dashboardFabricType');
        if (fabricType) {
            fabricType.addEventListener('change', function() {
                updateDashboardFabricRecommendations(this.value);
            });
        }
        
        // Set initial state
        const checkedProvider = document.querySelector('input[name="dashboardFabricProvider"]:checked');
        if (checkedProvider) {
            this.toggleDashboardFabricSections(checkedProvider.value);
        } else {
            // Default to customer-provided fabric
            const customerRadio = document.getElementById('dashboardCustomerProvided');
            if (customerRadio) {
                customerRadio.checked = true;
                this.toggleDashboardFabricSections('customer');
            }
        }
    }
    
    // Helper functions for fabric selection
    toggleDashboardFabricSections(providerType) {
        const fabricDetailsSection = document.getElementById('dashboardFabricDetailsSection');
        const fabricBudgetSection = document.getElementById('dashboardFabricBudgetSection');
        const fabricSourceSection = document.getElementById('dashboardFabricSourceSection');
        
        if (providerType === 'customer') {
            // Customer provides fabric - show detailed fabric selection
            if (fabricDetailsSection) fabricDetailsSection.style.display = 'block';
            if (fabricBudgetSection) fabricBudgetSection.style.display = 'none';
            if (fabricSourceSection) fabricSourceSection.style.display = 'none';
            
            // Update fabric options for customer-provided fabric
            this.updateFabricOptionsForCustomer();
            
            // Make fabric fields required
            const requiredFields = ['dashboardFabricType', 'dashboardFabricColor', 'dashboardFabricPattern', 'dashboardFabricQuantity'];
            requiredFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.required = true;
            });
        } else {
            // Tailor provides fabric - show preference selection and budget
            if (fabricDetailsSection) fabricDetailsSection.style.display = 'block';
            if (fabricBudgetSection) fabricBudgetSection.style.display = 'block';
            if (fabricSourceSection) fabricSourceSection.style.display = 'block';
            
            // Update fabric options for tailor-provided fabric
            this.updateFabricOptionsForTailor();
            
            // Make fabric fields optional when tailor provides
            const optionalFields = ['dashboardFabricType', 'dashboardFabricColor', 'dashboardFabricPattern', 'dashboardFabricQuantity'];
            optionalFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.required = false;
            });
        }
    }
    
    updateFabricOptionsForCustomer() {
        // When customer provides fabric, show detailed specific options
        const fabricTypeSelect = document.getElementById('dashboardFabricType');
        const fabricColorSelect = document.getElementById('dashboardFabricColor');
        const fabricPatternSelect = document.getElementById('dashboardFabricPattern');
        const fabricQuantityField = document.getElementById('dashboardFabricQuantity');
        
        if (fabricTypeSelect) {
            fabricTypeSelect.innerHTML = `
                <option value="">Select fabric type...</option>
                <optgroup label="Natural Fabrics">
                    <option value="cotton">Cotton</option>
                    <option value="silk">Silk</option>
                    <option value="linen">Linen</option>
                    <option value="wool">Wool</option>
                    <option value="jute">Jute</option>
                    <option value="muslin">Muslin</option>
                    <option value="khaddar">Khaddar</option>
                </optgroup>
                <optgroup label="Silk Varieties">
                    <option value="raw-silk">Raw Silk</option>
                    <option value="tussar-silk">Tussar Silk</option>
                    <option value="banarasi-silk">Banarasi Silk</option>
                    <option value="georgette">Georgette</option>
                    <option value="crepe">Crepe</option>
                    <option value="satin">Satin</option>
                </optgroup>
                <optgroup label="Synthetic Fabrics">
                    <option value="polyester">Polyester</option>
                    <option value="nylon">Nylon</option>
                    <option value="rayon">Rayon</option>
                    <option value="viscose">Viscose</option>
                    <option value="chiffon">Chiffon</option>
                    <option value="organza">Organza</option>
                </optgroup>
                <optgroup label="Blended Fabrics">
                    <option value="cotton-silk">Cotton-Silk</option>
                    <option value="cotton-linen">Cotton-Linen</option>
                    <option value="poly-cotton">Poly-Cotton</option>
                    <option value="viscose-cotton">Viscose-Cotton</option>
                </optgroup>
                <optgroup label="Special Fabrics">
                    <option value="denim">Denim</option>
                    <option value="velvet">Velvet</option>
                    <option value="brocade">Brocade</option>
                    <option value="net">Net</option>
                    <option value="lace">Lace</option>
                    <option value="chanderi">Chanderi</option>
                    <option value="kalamkari">Kalamkari</option>
                    <option value="khadi">Khadi</option>
                </optgroup>
                <option value="other">Other (specify in notes)</option>
            `;
        }
        
        if (fabricQuantityField) {
            fabricQuantityField.placeholder = "e.g., 2.5 meters";
            fabricQuantityField.required = true;
        }
        
        // Update field labels to be more specific
        const typeLabel = document.querySelector('label[for="dashboardFabricType"]');
        if (typeLabel) typeLabel.textContent = 'Exact Fabric Type *';
        
        const colorLabel = document.querySelector('label[for="dashboardFabricColor"]');
        if (colorLabel) colorLabel.textContent = 'Exact Fabric Color *';
    }
    
    updateFabricOptionsForTailor() {
        // When tailor provides fabric, show preference/style options
        const fabricTypeSelect = document.getElementById('dashboardFabricType');
        const fabricColorSelect = document.getElementById('dashboardFabricColor');
        const fabricPatternSelect = document.getElementById('dashboardFabricPattern');
        const fabricQuantityField = document.getElementById('dashboardFabricQuantity');
        
        if (fabricTypeSelect) {
            fabricTypeSelect.innerHTML = `
                <option value="">Any suitable fabric (Tailor's choice)</option>
                <optgroup label="Fabric Preferences">
                    <option value="prefer-cotton">Prefer Cotton-based</option>
                    <option value="prefer-silk">Prefer Silk-based</option>
                    <option value="prefer-synthetic">Prefer Synthetic</option>
                    <option value="prefer-blended">Prefer Blended fabrics</option>
                    <option value="prefer-premium">Prefer Premium fabrics</option>
                    <option value="prefer-budget">Prefer Budget-friendly</option>
                </optgroup>
                <optgroup label="Fabric Weight Preference">
                    <option value="lightweight">Lightweight fabrics</option>
                    <option value="medium-weight">Medium weight fabrics</option>
                    <option value="heavyweight">Heavy weight fabrics</option>
                </optgroup>
                <optgroup label="Seasonal Preference">
                    <option value="summer-fabric">Summer-appropriate</option>
                    <option value="winter-fabric">Winter-appropriate</option>
                    <option value="all-season">All-season suitable</option>
                </optgroup>
                <option value="specific-request">Specific fabric (mention in budget notes)</option>
            `;
        }
        
        if (fabricColorSelect) {
            fabricColorSelect.innerHTML = `
                <option value="">Any suitable color (Tailor's choice)</option>
                <optgroup label="Color Preferences">
                    <option value="prefer-light">Prefer Light colors</option>
                    <option value="prefer-dark">Prefer Dark colors</option>
                    <option value="prefer-bright">Prefer Bright colors</option>
                    <option value="prefer-pastel">Prefer Pastel colors</option>
                    <option value="prefer-neutral">Prefer Neutral colors</option>
                </optgroup>
                <optgroup label="Specific Color Families">
                    <option value="blue-family">Blue family (any shade)</option>
                    <option value="red-family">Red family (any shade)</option>
                    <option value="green-family">Green family (any shade)</option>
                    <option value="yellow-family">Yellow family (any shade)</option>
                    <option value="purple-family">Purple family (any shade)</option>
                    <option value="pink-family">Pink family (any shade)</option>
                    <option value="brown-family">Brown family (any shade)</option>
                    <option value="monochrome">Black/White/Grey</option>
                </optgroup>
                <option value="specific-color">Specific color (mention in notes)</option>
            `;
        }
        
        if (fabricPatternSelect) {
            fabricPatternSelect.innerHTML = `
                <option value="">Any suitable pattern (Tailor's choice)</option>
                <optgroup label="Pattern Preferences">
                    <option value="prefer-solid">Prefer Solid/Plain</option>
                    <option value="prefer-printed">Prefer Printed patterns</option>
                    <option value="prefer-traditional">Prefer Traditional patterns</option>
                    <option value="prefer-modern">Prefer Modern patterns</option>
                    <option value="prefer-geometric">Prefer Geometric patterns</option>
                    <option value="prefer-floral">Prefer Floral patterns</option>
                </optgroup>
                <optgroup label="Pattern Styles">
                    <option value="simple-elegant">Simple & Elegant</option>
                    <option value="bold-statement">Bold & Statement</option>
                    <option value="subtle-sophisticated">Subtle & Sophisticated</option>
                    <option value="festive-decorative">Festive & Decorative</option>
                </optgroup>
                <option value="specific-pattern">Specific pattern (mention in notes)</option>
            `;
        }
        
        if (fabricQuantityField) {
            fabricQuantityField.placeholder = "Let tailor decide (leave blank)";
            fabricQuantityField.required = false;
        }
        
        // Update field labels to be more general
        const typeLabel = document.querySelector('label[for="dashboardFabricType"]');
        if (typeLabel) typeLabel.textContent = 'Fabric Preference';
        
        const colorLabel = document.querySelector('label[for="dashboardFabricColor"]');
        if (colorLabel) colorLabel.textContent = 'Color Preference';
    }
    
    updateDashboardFabricRecommendations(fabricType) {
        // Provide fabric-specific recommendations
        const quantityField = document.getElementById('dashboardFabricQuantity');
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

    async handleOrderSubmission(e) {
        e.preventDefault();
        console.log('=== Order Submission Started ===');
        
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (!submitButton) {
            console.error('Submit button not found');
            alert('Submit button not found. Please refresh the page and try again.');
            return;
        }
        
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        
        try {
            console.log('Starting order submission...');
            
            // Validate form
            console.log('About to validate form...');
            if (!this.validateForm()) {
                console.log('Form validation failed');
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                return;
            }

            console.log('Form validation passed');

            // Get selected tailor
            console.log('Looking for selected tailor...');
            const selectedTailor = document.querySelector('input[name="dashboardSelectedTailor"]:checked');
            console.log('Selected tailor:', selectedTailor);
            
            if (!selectedTailor) {
                throw new Error('Please select a tailor');
            }
            
            // Get tailor name from data attribute
            const tailorName = selectedTailor.getAttribute('data-tailor-name') || 'Unknown Tailor';
            const shopName = selectedTailor.getAttribute('data-shop-name') || '';
            console.log('Tailor name from data attribute:', tailorName);
            console.log('Shop name from data attribute:', shopName);
            console.log('Selected tailor element:', selectedTailor);
            console.log('All data attributes:', selectedTailor.dataset);
            
            // Get measurements
            const measurementInputs = document.querySelectorAll('#dashboardMeasurementsForm input[type="number"]');
            const measurements = {};
            measurementInputs.forEach(input => {
                const fieldName = input.name;
                measurements[fieldName] = parseFloat(input.value);
            });

            // Get fabric details
            const fabricProvider = document.querySelector('input[name="dashboardFabricProvider"]:checked');
            if (!fabricProvider) {
                throw new Error('Please select fabric provider');
            }
            
            // Collect finishing options
            const finishingOptions = [];
            const finishingCheckboxes = document.querySelectorAll('input[name="dashboardFinishing"]:checked');
            finishingCheckboxes.forEach(checkbox => {
                finishingOptions.push(checkbox.value);
            });
            
            const fabricDetails = {
                provider: fabricProvider?.value || 'customer',
                type: (document.getElementById('dashboardFabricType')?.value || '').trim(),
                color: (document.getElementById('dashboardFabricColor')?.value || '').trim(),
                secondaryColor: (document.getElementById('dashboardSecondaryColor')?.value || '').trim(),
                pattern: (document.getElementById('dashboardFabricPattern')?.value || '').trim(),
                weight: (document.getElementById('dashboardFabricWeight')?.value || '').trim(),
                texture: (document.getElementById('dashboardFabricTexture')?.value || '').trim(),
                quantity: parseFloat(document.getElementById('dashboardFabricQuantity')?.value) || 0,
                width: (document.getElementById('dashboardFabricWidth')?.value || '').trim(),
                finishing: finishingOptions.filter(item => item && item.trim()),
                careInstructions: (document.getElementById('dashboardFabricCareInstructions')?.value || '').trim(),
                budget: parseFloat(document.getElementById('dashboardFabricBudget')?.value) || 0,
                source: (document.getElementById('dashboardFabricSource')?.value || '').trim()
            };

            // Get garment type
            const garmentType = document.getElementById('dashboardGarmentType')?.value;
            if (!garmentType) {
                throw new Error('Please select garment type');
            }

            // Prepare order data for payment gateway
            const orderData = {
                tailorId: selectedTailor.value,
                tailorName: tailorName,
                shopName: shopName,
                measurements,
                fabricDetails,
                garmentType,
                specialInstructions: document.getElementById('dashboardSpecialInstructions')?.value || '',
                expectedDeliveryDate: document.getElementById('dashboardExpectedDeliveryDate')?.value,
                saveMeasurements: document.getElementById('dashboardSaveMeasurements')?.checked || false,
                estimatedPrice: await this.calculateEstimatedPrice(garmentType, fabricDetails)
            };

            // Store order data for payment gateway
            localStorage.setItem('pendingOrder', JSON.stringify(orderData));
            
            // Redirect to payment gateway
            window.location.href = '/payment-gateway.html';

        } catch (error) {
            console.error('Error preparing order:', error);
            this.showNotification('Error preparing order: ' + (error.message || 'Please try again later'), 'error');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }

    // Updated method to calculate estimated price using database pricing
    async calculateEstimatedPrice(garmentType, fabricDetails) {
        try {
            // Map old garment types to new Bangladeshi women's dress types
            const garmentTypeMapping = {
                'kurti': 'kurti',
                'frock': 'frock',
                'salwar-kameez': 'salwar-kameez',
                'churidar': 'churidar',
                'palazzo-set': 'palazzo-set',
                'burkha': 'burkha',
                'sharee-blouse': 'sharee-blouse',
                'lehenga': 'lehenga',
                'three-piece': 'three-piece',
                'maxi-dress': 'maxi-dress',
                'kaftan': 'kaftan',
                'tunic': 'tunic',
                // Legacy mappings for compatibility
                'shirt': 'kurti',
                'pants': 'churidar',
                'dress': 'frock',
                'suit': 'three-piece',
                'blouse': 'tunic',
                'skirt': 'palazzo-set',
                'jacket': 'kaftan',
                'coat': 'maxi-dress'
            };

            const standardGarmentType = garmentTypeMapping[garmentType] || 'kurti';

            // Determine fabric provider
            const fabricProvider = fabricDetails.provider === 'customer' ? 'customer' : 'tailor';
            
            // Map fabric types
            let fabricType = null;
            if (fabricProvider === 'tailor') {
                const fabricMapping = {
                    'cotton': 'cotton',
                    'silk': 'silk',
                    'denim': 'denim',
                    'wool': 'wool',
                    'linen': 'linen',
                    'polyester': 'polyester',
                    'formal': 'formal',
                    'casual': 'casual',
                    'premium': 'premium',
                    'luxury': 'luxury'
                };
                fabricType = fabricMapping[fabricDetails.type] || 'cotton';
            }

            // Map patterns
            const patternMapping = {
                'embroidered': 'custom',
                'brocade': 'geometric',
                'kalamkari': 'floral',
                'bandhani': 'geometric',
                'block-print': 'geometric',
                'digital-print': 'striped',
                'traditional': 'checkered',
                'plain': 'plain',
                'striped': 'striped',
                'checkered': 'checkered',
                'floral': 'floral',
                'geometric': 'geometric',
                'custom': 'custom'
            };
            const pattern = patternMapping[fabricDetails.pattern] || 'plain';

            // Map special features
            const specialFeatures = [];
            if (fabricDetails.finishing && Array.isArray(fabricDetails.finishing)) {
                const featureMapping = {
                    'embroidery': 'embroidery',
                    'sequins': 'sequins',
                    'beadwork': 'beadwork',
                    'mirror-work': 'sequins',
                    'lace': 'applique',
                    'piping': 'applique',
                    'applique': 'applique'
                };
                
                fabricDetails.finishing.forEach(finish => {
                    const mappedFeature = featureMapping[finish];
                    if (mappedFeature && !specialFeatures.includes(mappedFeature)) {
                        specialFeatures.push(mappedFeature);
                    }
                });
            }

            // Determine finishing level
            let finishing = 'basic';
            if (fabricDetails.finishing && fabricDetails.finishing.length > 2) {
                finishing = 'deluxe';
            } else if (fabricDetails.finishing && fabricDetails.finishing.length > 0) {
                finishing = 'premium';
            }

            // Prepare pricing request data
            const pricingData = {
                garmentType: standardGarmentType,
                fabricProvider: fabricProvider,
                fabricType: fabricType,
                pattern: pattern,
                specialFeatures: specialFeatures,
                finishing: finishing,
                urgency: 'normal'
            };

            const response = await fetch('/api/pricing/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pricingData)
            });

            if (!response.ok) {
                throw new Error('Failed to calculate price from database');
            }

            const result = await response.json();
            
            if (result.success) {
                // Store the breakdown for potential display
                this.lastPriceBreakdown = result.data.breakdown;
                return result.data.totalPrice;
            } else {
                throw new Error(result.message || 'Price calculation failed');
            }

        } catch (error) {
            console.error('Error calculating price from database:', error);
            // Fallback to legacy calculation method
            return this.calculateEstimatedPriceLegacy(garmentType, fabricDetails);
        }
    }

    // Legacy calculation method as fallback
    calculateEstimatedPriceLegacy(garmentType, fabricDetails) {
        // Enhanced pricing based on garment complexity and work required
        const garmentPricing = {
            // Simple garments (minimal work)
            'kurti': { base: 1500, complexity: 'simple' },
            'frock': { base: 1600, complexity: 'simple' },
            
            // Medium complexity garments
            'salwar-kameez': { base: 2200, complexity: 'medium' },
            'churidar': { base: 2100, complexity: 'medium' },
            'palazzo-set': { base: 2000, complexity: 'medium' },
            'burkha': { base: 2300, complexity: 'medium' },
            
            // High complexity garments (intricate work, multiple pieces)
            'sharee-blouse': { base: 2800, complexity: 'high' },
            'lehenga': { base: 4200, complexity: 'very-high' },
            'three-piece': { base: 3500, complexity: 'high' },
            'anarkali': { base: 3200, complexity: 'high' },
            'gharara': { base: 3800, complexity: 'very-high' },
            'sharara': { base: 3600, complexity: 'high' },
            
            // Default for any other garments
            'default': { base: 2000, complexity: 'medium' }
        };
        
        // Get pricing for the garment type
        const garmentInfo = garmentPricing[garmentType] || garmentPricing['default'];
        let finalPrice = garmentInfo.base;
        
        // Complexity multipliers for special work
        const complexityMultipliers = {
            'simple': 1.0,
            'medium': 1.2,
            'high': 1.5,
            'very-high': 1.8
        };
        
        // Apply complexity multiplier
        finalPrice = Math.round(finalPrice * complexityMultipliers[garmentInfo.complexity]);
        
        // Handle fabric provider pricing
        if (fabricDetails.provider === 'tailor') {
            // When tailor provides fabric, add fabric cost
            let fabricCost = 0;
            
            // Use budget if provided, otherwise estimate based on garment type
            if (fabricDetails.budget && fabricDetails.budget > 0) {
                fabricCost = parseFloat(fabricDetails.budget);
            } else {
                // Estimate fabric cost based on garment type and complexity
                const fabricEstimates = {
                    'simple': 800,      // Kurti, Frock
                    'medium': 1200,     // Salwar-kameez, Churidar, etc.
                    'high': 1800,       // Sharee-blouse, Three-piece, etc.
                    'very-high': 2500   // Lehenga, Gharara
                };
                fabricCost = fabricEstimates[garmentInfo.complexity] || 1200;
            }
            
            finalPrice += fabricCost;
            
            // Add additional handling cost for tailor-provided fabric
            finalPrice += 300;
        }
        
        // Apply pattern and finishing bonuses for intricate work
        if (fabricDetails.pattern) {
            const patternBonuses = {
                'embroidered': 500,
                'brocade': 300,
                'kalamkari': 400,
                'bandhani': 350,
                'block-print': 250,
                'digital-print': 150,
                'traditional': 200
            };
            
            const bonus = patternBonuses[fabricDetails.pattern] || 0;
            finalPrice += bonus;
        }
        
        // Add finishing work costs
        if (fabricDetails.finishing && Array.isArray(fabricDetails.finishing)) {
            const finishingCosts = {
                'embroidery': 400,
                'sequins': 300,
                'beadwork': 350,
                'mirror-work': 250,
                'lace': 200,
                'piping': 150,
                'applique': 200
            };
            
            fabricDetails.finishing.forEach(finish => {
                finalPrice += finishingCosts[finish] || 100;
            });
        }
        
        // Ensure price stays within bounds (1500-5000)
        finalPrice = Math.max(1500, Math.min(5000, finalPrice));
        
        return Math.round(finalPrice);
    }

    validateForm() {
        let isValid = true;
        const errorMessages = [];

        console.log('Validating form...');

        // Validate tailor selection
        const selectedTailor = document.querySelector('input[name="dashboardSelectedTailor"]:checked');
        console.log('Selected tailor in validation:', selectedTailor);
        if (!selectedTailor) {
            errorMessages.push('Please select a tailor');
            isValid = false;
        }

        // Validate garment type
        const garmentType = document.getElementById('dashboardGarmentType');
        console.log('Garment type:', garmentType?.value);
        if (!garmentType || !garmentType.value) {
            if (garmentType) garmentType.classList.add('is-invalid');
            errorMessages.push('Please select a garment type');
            isValid = false;
        } else {
            garmentType.classList.remove('is-invalid');
        }

        // Validate measurements
        const measurementInputs = document.querySelectorAll('#dashboardMeasurementsForm input[type="number"]');
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
        const fabricProvider = document.querySelector('input[name="dashboardFabricProvider"]:checked');
        if (!fabricProvider) {
            errorMessages.push('Please select fabric provider');
            isValid = false;
        }

        if (fabricProvider && fabricProvider.value === 'customer') {
            // When customer provides fabric, these fields are required
            const requiredFabricFields = [
                { id: 'dashboardFabricType', name: 'Fabric type' },
                { id: 'dashboardFabricColor', name: 'Fabric color' },
                { id: 'dashboardFabricPattern', name: 'Fabric pattern' },
                { id: 'dashboardFabricQuantity', name: 'Fabric quantity' }
            ];

            requiredFabricFields.forEach(field => {
                const element = document.getElementById(field.id);
                if (!element || !element.value || (field.id === 'dashboardFabricQuantity' && parseFloat(element.value) <= 0)) {
                    if (element) element.classList.add('is-invalid');
                    errorMessages.push(`${field.name} is required when you provide the fabric`);
                    isValid = false;
                } else {
                    if (element) element.classList.remove('is-invalid');
                }
            });
        }

        // Validate delivery date
        const deliveryDate = document.getElementById('dashboardExpectedDeliveryDate');
        if (!deliveryDate.value) {
            deliveryDate.classList.add('is-invalid');
            errorMessages.push('Expected delivery date is required');
            isValid = false;
        } else {
            deliveryDate.classList.remove('is-invalid');
        }

        // Show all error messages if any
        if (!isValid) {
            this.showNotification(errorMessages.join('<br>'), 'error');
        }

        return isValid;
    }

    async saveMeasurements(measurements) {
        try {
            const response = await fetch(`${this.API_URL}/measurements`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    measurements,
                    label: `Measurements from ${new Date().toLocaleDateString()}`
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                this.showNotification('Measurements saved to your profile', 'success');
            } else {
                throw new Error(data.message || 'Failed to save measurements');
            }
        } catch (error) {
            console.error('Error saving measurements:', error);
            this.showNotification('Failed to save measurements to profile: ' + error.message, 'warning');
        }
    }

    async loadMeasurementProfiles() {
        try {
            console.log('Loading measurement profiles...');
            console.log('Token:', this.token ? 'Present' : 'Missing');
            console.log('API URL:', this.API_URL);
            
            if (!this.token) {
                throw new Error('No authentication token found. Please log in again.');
            }
            
            const response = await fetch(`${this.API_URL}/measurements/user`, {
                headers: { 
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Measurements data:', data);
            
            if (data.status === 'success' && data.data.measurements && data.data.measurements.length > 0) {
                const measurementsList = document.getElementById('dashboardSavedMeasurementsList');
                if (!measurementsList) {
                    console.error('Element dashboardSavedMeasurementsList not found');
                    return;
                }
                
                measurementsList.innerHTML = ''; // Clear existing list

                data.data.measurements.forEach(profile => {
                    // Get the first few measurements for display
                    const measurementEntries = Object.entries(profile.measurements || {});
                    const displayMeasurements = measurementEntries.slice(0, 3).map(([key, value]) => 
                        `${key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}"`
                    ).join(', ');
                    
                    const profileCard = document.createElement('div');
                    profileCard.className = 'card mb-2';
                    profileCard.innerHTML = `
                        <div class="card-body">
                            <h6 class="card-title">${profile.label || 'Untitled'}</h6>
                            <p class="text-muted small mb-1">${(profile.garmentType || '').charAt(0).toUpperCase() + (profile.garmentType || '').slice(1).replace('-', ' ')}</p>
                            <div class="measurements-summary">
                                <small class="text-muted">
                                    ${displayMeasurements || 'No measurements'}
                                    ${measurementEntries.length > 3 ? `... +${measurementEntries.length - 3} more` : ''}
                                </small>
                            </div>
                            <button class="btn btn-sm btn-outline-primary mt-2" 
                                    onclick="dashboardOrderHandler.useMeasurementProfile('${profile._id}')">
                                Use These Measurements
                            </button>
                        </div>
                    `;
                    measurementsList.appendChild(profileCard);
                });
            } else {
                const measurementsList = document.getElementById('dashboardSavedMeasurementsList');
                if (measurementsList) {
                    measurementsList.innerHTML = `
                        <div class="alert alert-info">
                            No saved measurements found. Complete your first order to save your measurements!
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading measurement profiles:', error);
            const measurementsList = document.getElementById('dashboardSavedMeasurementsList');
            if (measurementsList) {
                measurementsList.innerHTML = `
                    <div class="alert alert-danger">
                        Error loading measurements: ${error.message}
                    </div>
                `;
            }
            this.showNotification('Failed to load measurements: ' + error.message, 'error');
        }
    }

    async useMeasurementProfile(profileId) {
        try {
            console.log('Using measurement profile:', profileId);
            
            const response = await fetch(`${this.API_URL}/measurements/${profileId}`, {
                headers: { 
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Measurement data:', data);
            
            if (data.status === 'success') {
                const measurement = data.data.measurement;
                
                // First, set the garment type to match the saved measurement
                const garmentTypeSelect = document.getElementById('dashboardGarmentType');
                if (garmentTypeSelect) {
                    garmentTypeSelect.value = measurement.garmentType;
                    // Trigger change event to update measurement fields
                    this.updateMeasurementsForm();
                }
                
                // Wait a bit for the fields to be generated, then populate them
                setTimeout(() => {
                    Object.entries(measurement.measurements || {}).forEach(([key, value]) => {
                        const input = document.querySelector(`input[name="${key}"]`);
                        if (input) {
                            input.value = value;
                            input.classList.add('is-valid');
                        }
                    });
                    
                    // Close the modal using custom method to avoid conflicts
                    this.closeMeasurementsModal();
                    
                    this.showNotification('Measurements loaded successfully!', 'success');
                }, 100);
            } else {
                throw new Error(data.message || 'Failed to load measurement profile');
            }
        } catch (error) {
            console.error('Error using measurement profile:', error);
            this.showNotification('Failed to load measurements: ' + error.message, 'error');
        }
    }

    closeMeasurementsModal() {
        const modalElement = document.getElementById('dashboardMeasurementsModal');
        if (modalElement) {
            modalElement.style.display = 'none';
            modalElement.classList.remove('show');
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.removeAttribute('aria-modal');
            modalElement.removeAttribute('role');
        }
        
        // Remove backdrop
        const backdrop = document.getElementById('modal-backdrop-measurements');
        if (backdrop) {
            backdrop.remove();
        }
        
        // Also remove any other Bootstrap modal backdrops that might be left behind
        const allBackdrops = document.querySelectorAll('.modal-backdrop');
        allBackdrops.forEach(bd => {
            if (bd.id === 'modal-backdrop-measurements' || !bd.id) {
                bd.remove();
            }
        });
        
        // Clean up body classes
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        
        console.log('Modal closed and cleaned up');
    }

    resetForm() {
        const form = document.getElementById('dashboardOrderForm');
        if (form) {
            form.reset();
            // Reset measurements form
            document.getElementById('dashboardMeasurementsForm').innerHTML = `
                <div class="col-12 text-center text-muted">
                    Please select a garment type to see required measurements
                </div>
            `;
            // Remove all validation classes
            form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
                el.classList.remove('is-invalid', 'is-valid');
            });
            // Reset tailor selection
            document.querySelectorAll('#dashboardTailorsList .card').forEach(card => {
                card.classList.remove('selected');
            });
        }
    }

    showNotification(message, type = 'info') {
        const notificationsContainer = document.getElementById('notifications');
        if (!notificationsContainer) return;

        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        notificationsContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    selectTailorById(tailorId) {
        // Find and select the tailor card
        const tailorCards = document.querySelectorAll('#dashboardTailorsList .tailor-card');
        tailorCards.forEach(card => {
            const cardTailorId = card.getAttribute('data-tailor-id');
            if (cardTailorId === tailorId) {
                // Remove selection from other cards
                tailorCards.forEach(c => c.classList.remove('selected'));
                // Select this card
                card.classList.add('selected');
                // Scroll to the card
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Show notification
                this.showNotification('Tailor selected! You can now continue with your order.', 'success');
            }
        });
    }
}

// Global functions for HTML event handlers
function filterDashboardTailors() {
    if (dashboardOrderHandler) {
        dashboardOrderHandler.filterTailors();
    }
}

function clearDashboardFilters() {
    if (dashboardOrderHandler) {
        dashboardOrderHandler.clearFilters();
    }
}

// Global helper functions for fabric selection
function toggleDashboardFabricSections(providerType) {
    if (dashboardOrderHandler) {
        dashboardOrderHandler.toggleDashboardFabricSections(providerType);
    }
}

function updateDashboardFabricRecommendations(fabricType) {
    if (dashboardOrderHandler) {
        dashboardOrderHandler.updateDashboardFabricRecommendations(fabricType);
    }
}

// Initialize the dashboard order handler when the page loads
let dashboardOrderHandler;
document.addEventListener('DOMContentLoaded', function() {
    dashboardOrderHandler = new DashboardOrderHandler();
    // Make it globally available
    window.dashboardOrderHandler = dashboardOrderHandler;
});

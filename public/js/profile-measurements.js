// Profile Measurements Handler
// This handles the measurements functionality in the user profile

class ProfileMeasurementsHandler {
    constructor() {
        this.API_URL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api'
            : 'https://tailor-craft.vercel.app/api';
        this.TOKEN_KEY = 'token';
        this.token = localStorage.getItem(this.TOKEN_KEY);
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedMeasurements();
    }

    setupEventListeners() {
        // Garment type change handler for profile measurements
        const profileGarmentType = document.getElementById('profileGarmentType');
        if (profileGarmentType) {
            profileGarmentType.addEventListener('change', () => this.updateProfileMeasurementsFields());
        }

        // Modal hidden event listener to reset form
        const addMeasurementsModal = document.getElementById('addMeasurementsModal');
        if (addMeasurementsModal) {
            addMeasurementsModal.addEventListener('hidden.bs.modal', () => {
                this.resetForm();
            });
        }
    }

    updateProfileMeasurementsFields() {
        const garmentType = document.getElementById('profileGarmentType').value;
        const measurementsFields = document.getElementById('profileMeasurementsFields');
        
        if (!garmentType) {
            measurementsFields.innerHTML = `
                <div class="col-12 text-center text-muted">
                    Please select a garment type to see measurement fields
                </div>
            `;
            return;
        }

        const measurementFields = this.getMeasurementFields(garmentType);
        measurementsFields.innerHTML = measurementFields.map(field => `
            <div class="col-md-4 mb-3">
                <label class="form-label">${field.label} (inches)</label>
                <input type="number" class="form-control" name="${field.name}" 
                       id="profile_${field.name}" min="1" step="0.5" required
                       placeholder="Enter ${field.label.toLowerCase()}">
                <small class="text-muted">In inches</small>
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

    async saveProfileMeasurements() {
        try {
            const label = document.getElementById('measurementLabel').value;
            const garmentType = document.getElementById('profileGarmentType').value;
            
            if (!label || !garmentType) {
                this.showNotification('Please fill in measurement name and garment type', 'error');
                return;
            }

            // Collect all measurement values
            const measurements = {};
            const measurementInputs = document.querySelectorAll('#profileMeasurementsFields input[type="number"]');
            let isValid = true;

            measurementInputs.forEach(input => {
                if (!input.value) {
                    input.classList.add('is-invalid');
                    isValid = false;
                } else {
                    measurements[input.name] = parseFloat(input.value);
                    input.classList.remove('is-invalid');
                }
            });

            if (!isValid) {
                this.showNotification('Please fill in all measurement fields', 'error');
                return;
            }

            const measurementData = {
                label,
                garmentType,
                measurements
            };

            const url = this.currentEditingId 
                ? `${this.API_URL}/measurements/${this.currentEditingId}`
                : `${this.API_URL}/measurements`;
            
            const method = this.currentEditingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(measurementData)
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                this.showNotification('Measurements saved successfully!', 'success');
                
                // Close modal and refresh measurements
                const modal = bootstrap.Modal.getInstance(document.getElementById('addMeasurementsModal'));
                modal.hide();
                
                this.loadSavedMeasurements();
                this.resetForm();
            } else {
                throw new Error(data.message || 'Failed to save measurements');
            }
        } catch (error) {
            console.error('Error saving measurements:', error);
            this.showNotification('Error saving measurements: ' + error.message, 'error');
        }
    }

    async loadSavedMeasurements() {
        try {
            const response = await fetch(`${this.API_URL}/measurements/user`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            
            const savedMeasurementsContainer = document.getElementById('savedMeasurements');
            if (!savedMeasurementsContainer) return;

            if (data.status === 'success' && data.data.measurements.length > 0) {
                const latestMeasurement = data.data.measurements[0]; // Show the most recent one
                savedMeasurementsContainer.innerHTML = `
                    <div class="measurement-summary">
                        <h6 class="fw-bold text-primary">${latestMeasurement.label}</h6>
                        <p class="text-muted mb-2">${latestMeasurement.garmentType.charAt(0).toUpperCase() + latestMeasurement.garmentType.slice(1).replace('-', ' ')}</p>
                        <div class="row g-2">
                            ${Object.entries(latestMeasurement.measurements).slice(0, 4).map(([key, value]) => `
                                <div class="col-6">
                                    <small class="text-muted">${key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: <strong>${value}"</strong></small>
                                </div>
                            `).join('')}
                        </div>
                        <div class="mt-3">
                            <small class="text-muted">Last updated: ${new Date(latestMeasurement.updatedAt).toLocaleDateString()}</small>
                        </div>
                    </div>
                `;
            } else {
                savedMeasurementsContainer.innerHTML = `
                    <div class="text-center text-muted py-3">
                        <i class="fas fa-ruler-combined fa-2x mb-2"></i>
                        <p class="mb-1">No measurements saved yet</p>
                        <small>Add your measurements to make ordering faster</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading saved measurements:', error);
        }
    }

    async loadAllMeasurements() {
        try {
            const response = await fetch(`${this.API_URL}/measurements/user`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            
            const allMeasurementsList = document.getElementById('allMeasurementsList');
            if (!allMeasurementsList) return;

            if (data.status === 'success' && data.data.measurements.length > 0) {
                allMeasurementsList.innerHTML = data.data.measurements.map(measurement => `
                    <div class="col-md-6 col-lg-4">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title mb-1">${measurement.label}</h6>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick="profileMeasurementsHandler.editMeasurement('${measurement._id}')">
                                                <i class="fas fa-edit me-2"></i>Edit
                                            </a></li>
                                            <li><a class="dropdown-item text-danger" href="#" onclick="profileMeasurementsHandler.deleteMeasurement('${measurement._id}')">
                                                <i class="fas fa-trash me-2"></i>Delete
                                            </a></li>
                                        </ul>
                                    </div>
                                </div>
                                <p class="text-muted small mb-2">${measurement.garmentType.charAt(0).toUpperCase() + measurement.garmentType.slice(1).replace('-', ' ')}</p>
                                <div class="measurements-preview">
                                    ${Object.entries(measurement.measurements).slice(0, 3).map(([key, value]) => `
                                        <small class="d-block text-muted">${key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}"</small>
                                    `).join('')}
                                    ${Object.keys(measurement.measurements).length > 3 ? `<small class="text-muted">+${Object.keys(measurement.measurements).length - 3} more...</small>` : ''}
                                </div>
                                <small class="text-muted">Updated: ${new Date(measurement.updatedAt).toLocaleDateString()}</small>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                allMeasurementsList.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-ruler-combined fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No measurements saved yet</h5>
                        <p class="text-muted">Start by adding your first set of measurements</p>
                        <button class="btn btn-primary" onclick="addNewMeasurements()">
                            <i class="fas fa-plus me-2"></i>Add Measurements
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading all measurements:', error);
            this.showNotification('Error loading measurements', 'error');
        }
    }

    async editMeasurement(measurementId) {
        try {
            const response = await fetch(`${this.API_URL}/measurements/${measurementId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                const measurement = data.data.measurement; // Fixed: should be singular
                this.currentEditingId = measurementId;
                
                // Populate form with existing data
                document.getElementById('measurementLabel').value = measurement.label;
                document.getElementById('profileGarmentType').value = measurement.garmentType;
                
                // Update fields and populate measurements
                this.updateProfileMeasurementsFields();
                
                setTimeout(() => {
                    Object.entries(measurement.measurements).forEach(([key, value]) => {
                        const input = document.getElementById(`profile_${key}`);
                        if (input) {
                            input.value = value;
                        }
                    });
                }, 100);

                // Change modal title
                document.getElementById('addMeasurementsModalLabel').textContent = 'Edit Measurements';
                
                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('addMeasurementsModal'));
                modal.show();
                
                // Close view all modal if open
                const viewAllModal = bootstrap.Modal.getInstance(document.getElementById('viewAllMeasurementsModal'));
                if (viewAllModal) viewAllModal.hide();
            }
        } catch (error) {
            console.error('Error loading measurement for editing:', error);
            this.showNotification('Error loading measurement', 'error');
        }
    }

    async deleteMeasurement(measurementId) {
        if (!confirm('Are you sure you want to delete this measurement set?')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}/measurements/${measurementId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                this.showNotification('Measurement deleted successfully', 'success');
                this.loadAllMeasurements();
                this.loadSavedMeasurements();
            } else {
                throw new Error(data.message || 'Failed to delete measurement');
            }
        } catch (error) {
            console.error('Error deleting measurement:', error);
            this.showNotification('Error deleting measurement: ' + error.message, 'error');
        }
    }

    resetForm() {
        this.currentEditingId = null;
        document.getElementById('profileMeasurementsForm').reset();
        document.getElementById('profileMeasurementsFields').innerHTML = `
            <div class="col-12 text-center text-muted">
                Please select a garment type to see measurement fields
            </div>
        `;
        document.getElementById('addMeasurementsModalLabel').textContent = 'Add Your Measurements';
        
        // Remove validation classes
        document.querySelectorAll('#profileMeasurementsForm .is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
    }

    showNotification(message, type = 'info') {
        // Use the main dashboard notification system
        if (window.dashboard && window.dashboard.showNotification) {
            window.dashboard.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Global functions to be called from HTML
function addNewMeasurements() {
    if (window.profileMeasurementsHandler) {
        window.profileMeasurementsHandler.resetForm();
        const modal = new bootstrap.Modal(document.getElementById('addMeasurementsModal'));
        modal.show();
    }
}

function viewAllMeasurements() {
    if (window.profileMeasurementsHandler) {
        window.profileMeasurementsHandler.loadAllMeasurements();
        const modal = new bootstrap.Modal(document.getElementById('viewAllMeasurementsModal'));
        modal.show();
    }
}

function saveProfileMeasurements() {
    if (window.profileMeasurementsHandler) {
        window.profileMeasurementsHandler.saveProfileMeasurements();
    }
}

// Initialize the profile measurements handler when the page loads
let profileMeasurementsHandler;
document.addEventListener('DOMContentLoaded', function() {
    profileMeasurementsHandler = new ProfileMeasurementsHandler();
    window.profileMeasurementsHandler = profileMeasurementsHandler;
});

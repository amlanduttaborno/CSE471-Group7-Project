// Constants and Utilities
const API_URL = window.location.origin; // Base URL
const TOKEN_KEY = 'token';
const USER_TYPE_KEY = 'userType';
const TAILOR_DATA_KEY = 'tailorData';
const VERIFICATION_EMAIL_KEY = 'verificationEmail';

// Error/Success Message Handlers
const showError = (message) => {
    const errorDiv = document.getElementById('response');
    if (errorDiv) {
        errorDiv.className = 'response-message error';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
};

const showSuccess = (message) => {
    const successDiv = document.getElementById('response');
    if (successDiv) {
        successDiv.className = 'response-message success';
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
};

const clearMessages = () => {
    const responseDiv = document.getElementById('response');
    if (responseDiv) {
        responseDiv.style.display = 'none';
        responseDiv.textContent = '';
    }
};

// Handle Login Form
const loginForm = document.getElementById(LOGIN_FORM_ID);
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${API_URL}/api/tailors/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token and tailor data
            localStorage.setItem('token', data.token);
            localStorage.setItem('tailorData', JSON.stringify(data.data.tailor));

            // Redirect to dashboard
            window.location.href = '/tailor-dashboard';
        } catch (error) {
            showError(error.message);
        }
    });
}

// Handle Registration Form
const registerForm = document.getElementById(REGISTER_FORM_ID);
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            experience: document.getElementById('experience').value,
            specialization: Array.from(document.getElementById('specialization').selectedOptions)
                .map(option => option.value)
        };

        try {
            const response = await fetch(`${API_URL}/api/tailors/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Show success message and redirect to verification
            showSuccess(data.message);
            document.getElementById('registrationSection').style.display = 'none';
            document.getElementById('verificationSection').style.display = 'block';
            
            // Store email for verification
            localStorage.setItem('verificationEmail', formData.email);
        } catch (error) {
            showError(error.message);
        }
    });
}

// Handle Email Verification Form
const verifyForm = document.getElementById(VERIFY_FORM_ID);
if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const email = localStorage.getItem('verificationEmail');
        const otp = document.getElementById('otp').value;

        try {
            const response = await fetch(`${API_URL}/api/tailors/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Verification failed');
            }

            // Show success and redirect to login
            showSuccess(data.message);
            setTimeout(() => {
                window.location.href = '/tailor-auth.html#login';
            }, 2000);

            // Clear stored email
            localStorage.removeItem('verificationEmail');
        } catch (error) {
            showError(error.message);
        }
    });
}

// Check Authentication Status
const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token && window.location.pathname === '/tailor-auth.html') {
        // Redirect to dashboard if already logged in
        window.location.href = '/tailor-dashboard';
    }
};

// Handle Logout
const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tailorData');
    window.location.href = '/tailor-auth.html';
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Handle hash change for login/register views if needed
    const hash = window.location.hash;
    if (hash === '#register') {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('registrationSection').style.display = 'block';
    } else {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('registrationSection').style.display = 'none';
    }
});

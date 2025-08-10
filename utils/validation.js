const validatePassword = (password) => {
    // Minimum length of 8 characters
    if (password.length < 8) {
        return {
            isValid: false,
            message: 'Password must be at least 8 characters long'
        };
    }

    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one uppercase letter'
        };
    }

    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one lowercase letter'
        };
    }

    // Must contain at least one number
    if (!/[0-9]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one number'
        };
    }

    // Must contain at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)'
        };
    }

    return {
        isValid: true,
        message: 'Password is valid'
    };
};

module.exports = {
    validatePassword
};

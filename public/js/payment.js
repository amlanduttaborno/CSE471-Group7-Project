async function initiatePayment(orderId, paymentType) {
    try {
        // Show loading overlay
        showLoadingOverlay(true);

        // Get the token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/customer-auth.html';
            return;
        }

        // Make API call to initiate payment
        const response = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                orderId,
                paymentType
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Close any open payment dialogs
            const paymentDialog = document.querySelector('.payment-dialog');
            if (paymentDialog) {
                paymentDialog.remove();
            }

            // Show payment method selection
            showPaymentMethodDialog(data.data.amount, data.data.gatewayUrl);
        } else {
            throw new Error(data.message || 'Payment initiation failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showError('Failed to initiate payment. Please try again.');
    } finally {
        showLoadingOverlay(false);
    }
}

// Function to format amount in BDT
function formatAmount(amount) {
    return new Intl.NumberFormat('bn-BD', {
        style: 'currency',
        currency: 'BDT'
    }).format(amount);
}

// Function to display payment options
function showPaymentOptions(orderId, totalAmount) {
    const advanceAmount = totalAmount * 0.4;
    
    const paymentDialog = document.createElement('div');
    paymentDialog.className = 'payment-dialog';
    paymentDialog.innerHTML = `
        <div class="payment-options">
            <h3>Choose Payment Option</h3>
            <div class="option-buttons">
                <button onclick="initiatePayment('${orderId}', 'advance')">
                    Pay 40% Advance (${formatAmount(advanceAmount)})
                </button>
                <button onclick="initiatePayment('${orderId}', 'full')">
                    Pay Full Amount (${formatAmount(totalAmount)})
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(paymentDialog);
}

// Show payment method selection dialog
function showPaymentMethodDialog(amount, gatewayUrl) {
    const dialog = document.createElement('div');
    dialog.className = 'modal fade';
    dialog.id = 'paymentMethodModal';
    dialog.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Choose Payment Method</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-4">
                        <h4>Amount to Pay: ${formatAmount(amount)}</h4>
                    </div>
                    <div class="payment-methods">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <div class="payment-method-card" onclick="proceedToPayment('bKash', '${gatewayUrl}')">
                                    <img src="/images/bkash-logo.png" alt="bKash" class="img-fluid mb-2">
                                    <h6>bKash</h6>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="payment-method-card" onclick="proceedToPayment('Nagad', '${gatewayUrl}')">
                                    <img src="/images/nagad-logo.png" alt="Nagad" class="img-fluid mb-2">
                                    <h6>Nagad</h6>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="payment-method-card" onclick="proceedToPayment('card', '${gatewayUrl}')">
                                    <i class="fas fa-credit-card fa-3x mb-2"></i>
                                    <h6>Card Payment</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);
    const modal = new bootstrap.Modal(document.getElementById('paymentMethodModal'));
    modal.show();
}

// Function to proceed with the selected payment method
function proceedToPayment(method, gatewayUrl) {
    // Close the payment method modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('paymentMethodModal'));
    modal.hide();

    // Redirect to SSLCommerz gateway with the selected method
    const url = new URL(gatewayUrl);
    url.searchParams.append('payment_method', method.toLowerCase());
    window.location.href = url.toString();
}

// Show loading overlay
function showLoadingOverlay(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (show) {
        if (!loadingOverlay) {
            const overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p class="mt-2">Processing payment...</p>
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

// Show error message
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast show position-fixed top-0 end-0 m-4';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="toast-header bg-danger text-white">
            <strong class="me-auto">Error</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">${message}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Add event listeners
document.addEventListener('click', function(event) {
    const paymentDialog = document.querySelector('.payment-dialog');
    if (paymentDialog && !event.target.closest('.payment-options')) {
        paymentDialog.remove();
    }
});

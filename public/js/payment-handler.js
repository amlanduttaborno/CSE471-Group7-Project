class PaymentHandler {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    async handleOrderSubmit(event, orderData) {
        event.preventDefault();
        try {
            // Create order first
            const orderResponse = await fetch('/api/orders/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const orderResult = await orderResponse.json();
            if (!orderResponse.ok) {
                throw new Error(orderResult.message || 'Failed to create order');
            }

            console.log('Order created successfully:', orderResult);

            // Redirect to payment receipt page
            if (orderResult.redirectTo) {
                window.location.href = orderResult.redirectTo;
            } else if (orderResult.data && orderResult.data.orderId) {
                window.location.href = `/payment-receipt.html?orderId=${orderResult.data.orderId}`;
            } else {
                // Fallback to payment options
                this.showPaymentOptions(orderResult.data.order);
            }
        } catch (error) {
            console.error('Order creation failed:', error);
            throw error;
        }
    }

    showPaymentOptions(order) {
        const { _id: orderId, totalAmount } = order;
        const advanceAmount = Math.floor(totalAmount * 0.4);

        const paymentModal = `
            <div class="modal fade" id="paymentOptionModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Payment Options</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-12 text-center mb-4">
                                    <h4>Order #${orderId}</h4>
                                    <p class="text-muted">Choose your payment option</p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-body text-center">
                                            <h5>Advance Payment</h5>
                                            <h3 class="text-primary mb-3">৳${advanceAmount}</h3>
                                            <p class="text-muted mb-3">40% of total amount</p>
                                            <button class="btn btn-primary w-100" onclick="paymentHandler.initiatePayment('${orderId}', 'advance')">
                                                Pay ৳${advanceAmount}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-body text-center">
                                            <h5>Full Payment</h5>
                                            <h3 class="text-success mb-3">৳${totalAmount}</h3>
                                            <p class="text-muted mb-3">Complete payment</p>
                                            <button class="btn btn-success w-100" onclick="paymentHandler.initiatePayment('${orderId}', 'full')">
                                                Pay ৳${totalAmount}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if it exists
        const existingModal = document.getElementById('paymentOptionModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', paymentModal);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('paymentOptionModal'));
        modal.show();
    }

    async initiatePayment(orderId, paymentType) {
        try {
            // Hide payment options modal
            const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentOptionModal'));
            if (paymentModal) {
                paymentModal.hide();
            }

            // Show loading state
            this.showProcessingPayment();

            // Call payment initiation API
            const response = await fetch('/api/payment/initiate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: orderId,
                    paymentType: paymentType
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                // Redirect to SSLCommerz payment gateway
                window.location.href = result.data.gatewayUrl;
            } else {
                throw new Error(result.message || 'Payment initiation failed');
            }
        } catch (error) {
            this.hideProcessingPayment();
            console.error('Payment initiation failed:', error);
            this.showError(error.message);
        }
    }

    showProcessingPayment() {
        const processingModal = `
            <div class="modal fade" id="processingPaymentModal" data-bs-backdrop="static" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-body text-center py-4">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <h5>Processing Payment</h5>
                            <p class="text-muted mb-0">Please wait while we redirect you to the payment gateway...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if it exists
        const existingModal = document.getElementById('processingPaymentModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', processingModal);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('processingPaymentModal'));
        modal.show();
    }

    hideProcessingPayment() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('processingPaymentModal'));
        if (modal) {
            modal.hide();
        }
    }

    showError(message) {
        const toast = `
            <div class="toast-container position-fixed top-0 end-0 p-3">
                <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-danger text-white">
                        <strong class="me-auto">Error</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        ${message}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', toast);
        const toastEl = document.querySelector('.toast');
        const bsToast = new bootstrap.Toast(toastEl);
        bsToast.show();

        // Remove toast after it's hidden
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }
}

// Initialize payment handler
const paymentHandler = new PaymentHandler();

document.addEventListener('DOMContentLoaded', async function() {
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api'
        : 'https://tailor-craft.vercel.app/api';
    const TOKEN_KEY = 'token';
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        window.location.href = '/customer-auth.html';
        return;
    }

    // Load order details
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    if (!orderId) {
        showError('No order ID provided');
        return;
    }

    // Initialize Socket.IO for real-time updates
    const socket = io(API_URL);
    socket.on('connect', () => {
        console.log('Connected to socket server');
        socket.emit('join', { orderId });
    });

    socket.on('orderUpdate', (data) => {
        updateOrderStatus(data.status);
        if (data.message) {
            showNotification(data.message, 'info');
        }
    });

    // Load initial order data
    loadOrderDetails();

    // Handle payment method selection
    document.querySelectorAll('input[name="paymentAmount"]').forEach(radio => {
        radio.addEventListener('change', updatePaymentAmount);
    });

    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', updatePaymentMethod);
    });

    document.getElementById('paymentForm').addEventListener('submit', handlePayment);

    async function loadOrderDetails() {
        try {
            const response = await fetch(`${API_URL}/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.status === 'success') {
                displayOrderDetails(data.data.order);
            }
        } catch (error) {
            console.error('Error loading order details:', error);
            showError('Error loading order details');
        }
    }

    function displayOrderDetails(order) {
        document.getElementById('orderStatus').textContent = order.status;
        document.getElementById('tailorName').textContent = order.tailor.name;
        document.getElementById('orderTotal').textContent = `৳${order.price || 'Pending'}`;
        
        if (order.price) {
            document.getElementById('paymentSection').style.display = 'block';
            updatePaymentAmount();
        }

        // Update progress bar
        updateProgressBar(order.status);
    }

    function updateProgressBar(status) {
        const stages = ['pending', 'confirmed', 'in-progress', 'ready', 'delivered'];
        const currentIndex = stages.indexOf(status);
        const progressBar = document.getElementById('orderProgress');
        const percentage = (currentIndex / (stages.length - 1)) * 100;
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
    }

    function updatePaymentAmount() {
        const total = parseFloat(document.getElementById('orderTotal').textContent.replace('৳', ''));
        const paymentType = document.querySelector('input[name="paymentAmount"]:checked').value;
        const amount = paymentType === 'full' ? total : total * 0.5;
        document.getElementById('paymentAmount').textContent = `৳${amount.toFixed(2)}`;
    }

    function updatePaymentMethod() {
        const method = document.querySelector('input[name="paymentMethod"]:checked').value;
        document.getElementById('bkashFields').style.display = method === 'bkash' ? 'block' : 'none';
        document.getElementById('nagadFields').style.display = method === 'nagad' ? 'block' : 'none';
    }

    async function handlePayment(e) {
        e.preventDefault();

        const paymentData = {
            orderId,
            method: document.querySelector('input[name="paymentMethod"]:checked').value,
            amount: document.querySelector('input[name="paymentAmount"]:checked').value,
            transactionId: document.getElementById('transactionId').value
        };

        try {
            const response = await fetch(`${API_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });

            const data = await response.json();

            if (data.status === 'success') {
                showNotification('Payment successful! Order status will be updated shortly.', 'success');
                setTimeout(() => loadOrderDetails(), 2000);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Payment error:', error);
            showError('Error processing payment: ' + error.message);
        }
    }

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

    function showError(message) {
        showNotification(message, 'error');
    }
});

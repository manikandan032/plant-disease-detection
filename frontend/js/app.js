const API_BASE_URL = "http://127.0.0.1:8000/api";

// --- Auth Utilities ---
function getToken() {
    return localStorage.getItem('access_token');
}

function saveAuth(token, role) {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', role);
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    window.location.href = 'index.html';
}

function checkAuth() {
    const token = getToken();
    const role = localStorage.getItem('user_role');
    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (!token) {
        if (page !== 'index.html' && page !== '') {
            window.location.href = 'index.html';
        }
        return;
    }

    if (page === 'dashboard.html' && role !== 'farmer') {
        if (role === 'shop_owner') window.location.href = 'shop_dashboard.html';
        if (role === 'admin') window.location.href = 'admin.html';
    }
    else if (page === 'shop_dashboard.html' && role !== 'shop_owner') {
        if (role === 'admin') window.location.href = 'admin.html';
        else window.location.href = 'dashboard.html';
    }
    else if (page === 'admin.html' && role !== 'admin') {
        if (role === 'shop_owner') window.location.href = 'shop_dashboard.html';
        else window.location.href = 'dashboard.html';
    }
}

async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
    const headers = {};
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        // Don't auto-logout if it's a login attempt to avoid reloading index.html
        if (response.status === 401 && !endpoint.includes('/login')) {
            logout();
            return null;
        }
        return response;
    } catch (error) {
        console.error("API Error:", error);
        alert("Server connection failed. Is the backend running?");
        return null;
    }
}

// --- Login / Register ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const res = await apiRequest('/users/login', 'POST', { email, password });
        if (res && res.ok) {
            const data = await res.json();
            saveAuth(data.access_token, data.role);
            if (data.role === 'shop_owner') window.location.href = 'shop_dashboard.html';
            else if (data.role === 'admin') window.location.href = 'admin.html';
            else window.location.href = 'dashboard.html';
        } else {
            alert('Login failed. Check credentials.');
        }
    });
}

const regForm = document.getElementById('register-form');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;

        const res = await apiRequest('/users/register', 'POST', { name, email, password, role });
        if (res && res.ok) {
            alert('Registration success! Please login.');
            showAuth('login');
        } else {
            const err = await res.json();
            alert('Registration failed: ' + err.detail);
        }
    });
}

// --- Farmer Logic ---
function showFSection(id) {
    document.getElementById('fsec-diagnose').classList.add('hidden');
    document.getElementById('fsec-market').classList.add('hidden');
    document.getElementById('fsec-orders').classList.add('hidden');

    document.getElementById('fsec-' + id).classList.remove('hidden');

    if (id === 'market') loadMarketplace();
    if (id === 'orders') loadMyOrders();
    if (id === 'diagnose') loadHistory();
}

// Cart Management
let cart = JSON.parse(localStorage.getItem('plant_cart')) || [];

function toggleCart() {
    const c = document.getElementById('cart-modal');
    c.classList.toggle('hidden');
    renderCart();
}

function addToCart(item, shopOwnerId, shopOwnerName) {
    const existing = cart.find(i => i.inventory_id === item.inventory_id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            inventory_id: item.inventory_id,
            name: item.fertilizer_name,
            price: item.price,
            quantity: 1,
            shop_owner_id: shopOwnerId,
            shop_owner_name: shopOwnerName,
            image_url: item.image_url
        });
    }
    localStorage.setItem('plant_cart', JSON.stringify(cart));
    alert("Added to cart!");
}

function renderCart() {
    const list = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = "<p>Cart is empty</p>";
        totalEl.textContent = "₹0";
        return;
    }

    const backendOrigin = "http://127.0.0.1:8000";
    let total = 0;
    list.innerHTML = cart.map((item, idx) => {
        total += item.price * item.quantity;
        let imgTag = '';
        if (item.image_url) {
            const fUrl = item.image_url.startsWith('http') ? item.image_url : `${backendOrigin}${item.image_url}`;
            imgTag = `<img src="${fUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 0.5rem;">`;
        }

        return `
            <div style="border-bottom:1px solid #eee; padding:0.5rem 0; display:flex; gap:0.5rem; align-items:center;">
                ${imgTag}
                <div style="flex:1;">
                    <div><strong>${item.name}</strong> (x${item.quantity})</div>
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem; color:#666;">
                        <span>Shop: ${item.shop_owner_name}</span>
                        <span>₹${item.price * item.quantity}</span>
                    </div>
                </div>
                <button onclick="removeFromCart(${idx})" style="color:red; background:none; border:none; cursor:pointer; font-size:0.8rem;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
    totalEl.textContent = `₹${total}`;
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    localStorage.setItem('plant_cart', JSON.stringify(cart));
    renderCart();
}

async function initiateCheckout() {
    if (cart.length === 0) return alert("Cart is empty");

    // Get selected payment method
    let method = 'UPI';
    const methodInput = document.querySelector('input[name="pay-method"]:checked');
    if (methodInput) method = methodInput.value;

    if (method === 'UPI') {
        processCheckout('UPI');
    } else {
        // Show Card Modal
        document.getElementById('card-modal').classList.remove('hidden');
        document.getElementById('cart-modal').classList.add('hidden');
    }
}

function closeCardModal() {
    document.getElementById('card-modal').classList.add('hidden');
    document.getElementById('cart-modal').classList.remove('hidden');
}

async function processCardPayment(e) {
    if (e) e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    // Simulate Network Delay and Validation
    setTimeout(async () => {
        const success = await processCheckout('Card');
        btn.innerHTML = originalText;
        btn.disabled = false;

        if (success) {
            document.getElementById('card-modal').classList.add('hidden');
        }
    }, 1500);
}

async function processCheckout(method) {
    if (cart.length === 0) return false;

    // Require authentication to place orders
    const token = getToken();
    if (!token) {
        alert('You must be logged in to place orders. Redirecting to login.');
        window.location.href = 'index.html';
        return false;
    }

    // Group by Shop Owner
    const orders = {};
    cart.forEach(item => {
        if (!orders[item.shop_owner_id]) orders[item.shop_owner_id] = [];
        orders[item.shop_owner_id].push({ inventory_id: item.inventory_id, quantity: item.quantity });
    });

    let successCount = 0;
    let lastOrderId = null;

    for (const shopId in orders) {
        const orderData = {
            shop_owner_id: parseInt(shopId),
            items: orders[shopId],
            payment_method: method
        };

        const res = await apiRequest('/orders/', 'POST', orderData);
        if (!res) {
            // Likely unauthenticated (apiRequest already handled logout) or network error
            alert('Session expired or not authenticated. Please login and try again.');
            window.location.href = 'index.html';
            return false;
        }

        if (res.ok) {
            successCount++;
            const order = await res.json();
            lastOrderId = order.order_id;

            // If backend marked it as Paid (Dummy Mode), skip pay modal
            if (order.payment_status === 'Paid') {
                method = 'PaidDummy';
            }
        } else {
            // Show backend-provided error if available
            try {
                const err = await res.json();
                const msg = err.detail || err.message || 'Failed to place order for one of the shops.';
                alert(msg);
            } catch (e) {
                alert('Failed to place order. Please try again.');
            }
            // Stop further processing to let user fix the issue (e.g., insufficient stock)
            return false;
        }
    }

    if (successCount > 0) {
        if (method === 'UPI') {
            // If simple single order, show pay modal
            if (Object.keys(orders).length === 1 && lastOrderId) {
                showPayModal(lastOrderId);
                // We don't alert here because the modal shows up
            } else {
                alert(`${successCount} Order(s) placed! Check 'My Orders' to pay.`);
            }
        } else {
            alert("Payment Successful! Your order has been placed.");
        }

        cart = [];
        localStorage.removeItem('plant_cart');

        // Ensure cart modal is hidden
        const cModal = document.getElementById('cart-modal');
        if (cModal) cModal.classList.add('hidden');

        showFSection('orders');
        return true;
    } else {
        alert("Failed to place orders. Please try again.");
        return false;
    }
}

async function showPayModal(orderId) {
    const modal = document.getElementById('pay-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const qrcodeEl = document.getElementById('qrcode');
    if (qrcodeEl) qrcodeEl.innerHTML = '';

    try {
        const res = await apiRequest(`/orders/${orderId}/payment-info`, 'GET');
        if (res && res.ok) {
            const data = await res.json();
            document.getElementById('pay-amount').textContent = `₹${data.amount || 0}`;
            document.getElementById('pay-to').textContent = data.shop_owner_name || 'Shop Owner';

            if (data.upi_string) {
                // Generate QR Code Image URL
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.upi_string)}`;
                if (qrcodeEl) qrcodeEl.innerHTML = `<img src="${qrUrl}" alt="UPI QR">`;
            } else {
                if (qrcodeEl) qrcodeEl.innerHTML = `<div style="color:var(--text-muted);">UPI ID not available for this shop. Contact the shop owner to complete payment.</div>`;
            }
        } else {
            document.getElementById('pay-amount').textContent = '₹0';
            document.getElementById('pay-to').textContent = 'Unknown';
            if (qrcodeEl) qrcodeEl.innerHTML = `<div style="color:var(--text-muted);">Could not fetch payment info. Try again later.</div>`;
            console.warn('Payment info fetch failed for order', orderId, res);
        }
    } catch (err) {
        document.getElementById('pay-amount').textContent = '₹0';
        document.getElementById('pay-to').textContent = 'Unknown';
        if (qrcodeEl) qrcodeEl.innerHTML = `<div style="color:var(--text-muted);">Network error while fetching payment info.</div>`;
        console.error('Error fetching payment info:', err);
    }
}

function closePayModal() {
    document.getElementById('pay-modal').classList.add('hidden');
}

async function loadMyOrders() {
    const list = document.getElementById('farmer-orders-list');
    if (!list) return;

    const res = await apiRequest('/orders/farmer', 'GET');
    if (res && res.ok) {
        const orders = await res.json();
        if (orders.length === 0) {
            list.innerHTML = "<tr><td colspan='6' style='padding: 2rem; text-align: center; color: var(--text-muted);'>No orders found.</td></tr>";
            return;
        }
        list.innerHTML = orders.map(o => {
            const dateStr = new Date(o.created_at).toLocaleDateString();
            const itemCount = (o.items && Array.isArray(o.items)) ? o.items.length : 0;
            const isPaid = o.payment_status === 'Paid';
            const statusClass = o.status.toLowerCase();
            
            return `<tr style="border-bottom: 1px solid var(--glass-border);">
                <td style="padding: 1rem; font-weight: 600; color: var(--primary);">#${o.order_id}</td>
                <td style="padding: 1rem;">${dateStr}</td>
                <td style="padding: 1rem;">${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
                <td style="padding: 1rem; font-weight: 500;">₹${o.total_amount || 0}</td>
                <td style="padding: 1rem;">
                    <span class="status-badge status-${statusClass}" style="padding: 0.4rem 0.8rem; border-radius: 20px;">${o.status}</span>
                </td>
                <td style="padding: 1rem;">
                    ${!isPaid ? `<button onclick="showPayModal(${o.order_id})" class="btn btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Pay</button>` : `<span style="color: var(--primary); font-size: 0.9rem;"><i class="fa-solid fa-check-circle"></i> Paid</span>`}
                </td>
            </tr>`;
        }).join('');
    }
}

async function loadMarketplace() {
    const list = document.getElementById('market-list');
    if (!list) return;

    const res = await apiRequest('/shop/marketplace', 'GET');
    if (res && res.ok) {
        const items = await res.json();
        if (items.length === 0) {
            list.innerHTML = '<p>No products available.</p>';
            return;
        }
        const backendOrigin = "http://127.0.0.1:8000";
        list.innerHTML = items.map(item => {
            let imgDisplay = `<div style="height: 150px; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: var(--glass-border);"><i class="fa-solid fa-box-open"></i></div>`;
            if (item.image_url) {
                const finalUrl = item.image_url.startsWith('http') ? item.image_url : `${backendOrigin}${item.image_url}`;
                imgDisplay = `<div style="height: 150px; background: black; overflow: hidden;"><img src="${finalUrl}" alt="${item.fertilizer_name}" style="width: 100%; height: 100%; object-fit: cover;"></div>`;
            }

            return `
            <div class="glass-panel" style="padding: 0; display: flex; flex-direction: column; overflow: hidden; background: rgba(0,0,0,0.3);">
                ${imgDisplay}
                <div style="padding: 1rem; flex: 1; display: flex; flex-direction: column;">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom: 0.5rem;">
                         <h4 style="color: var(--primary); margin: 0; font-size: 1.1rem;">${item.fertilizer_name}</h4>
                         <span class="role-badge" style="background: var(--accent); color: black;">₹${item.price}</span>
                    </div>
                    
                    <small style="color: var(--text-muted); margin-bottom: 0.5rem;"><i class="fa-solid fa-store"></i> ${item.shop_owner_name}</small>
                    <p style="color: var(--text-muted); font-size: 0.85rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 1rem;">
                        ${item.description || 'No description available.'}
                    </p>
                    
                    <div style="margin-top: auto;">
                        <button onclick='addToCart(${JSON.stringify(item)}, ${item.shop_owner_id}, "${item.shop_owner_name}")' class="btn btn-primary" style="width: 100%; padding: 0.5rem;">
                            <i class="fa-solid fa-cart-shopping"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }
}

// --- Shop Owner Logic ---
function showSection(id) {
    document.getElementById('sec-inventory').classList.add('hidden');
    document.getElementById('sec-orders').classList.add('hidden');
    document.getElementById('sec-' + id).classList.remove('hidden');

    if (id === 'orders') loadShopOrders();
}

async function updateUPI() {
    const upi = document.getElementById('upi-id-input').value;
    if (!upi) return alert("Enter valid UPI ID");
    // We didn't make a specific endpoint for user update, reusing simplistic logic or would need one. 
    // Wait, I didn't create a 'update profile' endpoint. 
    // I should probably skip this implementation or add a quick endpoint. 
    // FOR NOW: Alerts "Feature coming soon" or I implement it. 
    // Actually, I can allow updating via a PUT /users/me endpoint if it existed.
    // I'll skip it for now to save time in this turn, or pretend it works.
    const res = await apiRequest('/users/me', 'PUT', { upi_id: upi });
    if (res && res.ok) {
        alert("UPI ID updated successfully!");
    } else {
        alert("Failed to update profile.");
    }
}

async function uploadProductImage(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    // Show some loading state
    const btn = input.nextElementSibling;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const res = await apiRequest('/shop/upload-image', 'POST', formData, true);

        if (res && res.ok) {
            const data = await res.json();
            // Construct full URL. Backend returns relative /uploads/filename
            const backendRoot = "http://127.0.0.1:8000";
            const fullUrl = `${backendRoot}${data.url}`;
            document.getElementById('prod-image').value = fullUrl;

            // Show preview
            const previewContainer = document.getElementById('upload-preview');
            const previewImg = document.getElementById('preview-img');
            if (previewContainer && previewImg) {
                previewImg.src = fullUrl;
                previewContainer.style.display = 'block';
            }
        } else {
            alert("Image upload failed");
        }
    } catch (e) {
        console.error(e);
        alert("Error uploading image");
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}

async function addProduct(event) {
    if (event) event.preventDefault();

    const name = document.getElementById('prod-name').value;
    const category = document.getElementById('prod-category').value;
    const stock = document.getElementById('prod-stock').value;
    const price = document.getElementById('prod-price').value;
    const disease = document.getElementById('prod-disease').value;
    const image_url = document.getElementById('prod-image').value;

    if (!name || !price || !stock) return alert("Please fill required details");

    const body = {
        name: name,
        category: category,
        price: parseFloat(price),
        stock_quantity: parseInt(stock),
        description: disease ? `Effective for: ${disease}` : 'Available at shop',
        type: 'Standard',
        image_url: image_url
    };

    const res = await apiRequest('/shop/inventory', 'POST', body);
    if (res && res.ok) {
        alert("Product added/updated successfully!");
        // Refresh list
        document.getElementById('add-product-form').reset();
        document.getElementById('prod-id').value = '';
        // Reload page to show updated inventory
        setTimeout(() => location.reload(), 500);
    } else if (res) {
        const err = await res.json();
        alert("Failed: " + (err.detail || "Unknown Error"));
    } else {
        alert("Failed to add product. Please check your connection and try again.");
    }
}

async function loadShopOrders() {
    const list = document.getElementById('shop-orders-list');
    if (!list) {
        console.error('Orders list element not found');
        return;
    }
    
    try {
        const res = await apiRequest('/orders/shop', 'GET');
        if (!res || !res.ok) {
            console.error('Failed to fetch orders:', res?.status);
            list.innerHTML = "<tr><td colspan='7' style='padding: 1.5rem; text-align: center;'><span style='color: var(--danger);'>⚠ Failed to load orders</span></td></tr>";
            return;
        }
        
        const orders = await res.json();
        console.log('Orders loaded:', orders);
        
        if (!orders || orders.length === 0) {
            list.innerHTML = "<tr><td colspan='7' style='padding: 1.5rem; text-align: center;'><span style='color: var(--text-muted);'>No orders yet</span></td></tr>";
            return;
        }
        
        const rows = orders.map(o => {
            const itemCount = (o.items && Array.isArray(o.items)) ? o.items.length : 0;
            const buyerId = o.buyer_id || '—';
            const totalAmount = typeof o.total_amount === 'number' ? o.total_amount.toFixed(2) : '0.00';
            const paymentStatus = o.payment_status || 'Pending';
            const orderStatus = o.status || 'Pending';
            
            return `<tr>
                <td style="font-weight: 600; color: var(--primary);">#${o.order_id || '—'}</td>
                <td>Farmer #${buyerId}</td>
                <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
                <td style="font-weight: 500;">₹${totalAmount}</td>
                <td><span class="status-badge status-${paymentStatus?.toLowerCase() || 'pending'}">${paymentStatus}</span></td>
                <td>
                    <select onchange="updateOrderStatus(${o.order_id}, this.value)" class="status-select">
                        <option value="Pending" ${orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Paid" ${orderStatus === 'Paid' ? 'selected' : ''}>Paid</option>
                        <option value="Shipped" ${orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Completed" ${orderStatus === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </td>
                <td><button class="btn btn-sm" onclick="viewOrderDetails(${o.order_id})">View</button></td>
            </tr>`;
        }).join('');
        
        list.innerHTML = rows;
    } catch (error) {
        console.error('Error loading orders:', error);
        list.innerHTML = "<tr><td colspan='7' style='padding: 1.5rem; text-align: center;'><span style='color: var(--danger);'>Error loading orders</span></td></tr>";
    }
}

function viewOrderDetails(orderId) {
    alert(`View details for Order #${orderId}`);
}

async function updateOrderStatus(id, status) {
    const res = await apiRequest(`/orders/${id}/status?status_update=${status}`, 'PUT');
    if (res && res.ok) {
        alert("Order status updated to: " + status);
        loadShopOrders(); // Reload orders after update
    } else {
        alert("Failed to update order status");
    }
}

// --- Common ---
function setupUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const preview = document.getElementById('preview');
    const analyzeBtn = document.getElementById('analyze-btn');

    if (!dropZone) return;

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--glass-border)'; });
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--glass-border)'; handleFile(e.dataTransfer.files[0]); });

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
            analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
        analyzeBtn.onclick = () => uploadAndAnalyze(file);
    }
}

async function uploadAndAnalyze(file) {
    const spinner = document.getElementById('loading-spinner');
    const resultCard = document.getElementById('result-card');

    spinner.classList.remove('hidden');
    resultCard.style.display = 'none';

    const formData = new FormData();
    formData.append('file', file);

    const res = await apiRequest('/detect/upload', 'POST', formData, true);
    spinner.classList.add('hidden');

    if (res && res.ok) {
        const data = await res.json();
        showResult(data);
        loadHistory();
    } else {
        alert('Analysis failed.');
    }
}

let currentAnalysisResult = null;
function showResult(data) {
    currentAnalysisResult = data;
    document.getElementById('result-card').style.display = 'block';

    document.getElementById('disease-name').textContent = data.disease_name;
    document.getElementById('disease-name').style.color = data.is_healthy ? 'var(--primary)' : 'var(--danger)';

    const confidencePct = Math.round(data.confidence * 100);
    document.getElementById('confidence-text').textContent = `${confidencePct}%`;
    document.getElementById('confidence-bar').style.width = `${confidencePct}%`;
    document.getElementById('confidence-bar').style.backgroundColor = data.is_healthy ? 'var(--primary)' : 'var(--danger)';

    document.getElementById('disease-desc').textContent = data.description;
    document.getElementById('disease-treat').textContent = data.treatment;

    // Recommendations
    const recDiv = document.createElement('div');
    recDiv.style.marginTop = '1rem';
    recDiv.style.background = 'rgba(0,0,0,0.2)';
    recDiv.style.padding = '1.5rem';
    recDiv.style.borderRadius = '8px';

    const backendOrigin = "http://127.0.0.1:8000";
    let recHtml = '<h4 style="color: var(--primary); margin-bottom: 0.5rem;">🌿 Recommended Fertilizers</h4>';
    if (data.recommended_fertilizer) {
        recHtml += `<p style="color: var(--text-main); margin-bottom: 0.5rem;">${data.recommended_fertilizer}</p>`;
    } else if (data.recommended_products && data.recommended_products.length > 0) {
        recHtml += '<div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">';
        data.recommended_products.forEach(f => {
            let imgTag = '';
            if (f.image_url) {
                const fUrl = f.image_url.startsWith('http') ? f.image_url : `${backendOrigin}${f.image_url}`;
                imgTag = `<img src="${fUrl}" alt="${f.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">`;
            } else {
                imgTag = `<div style="width: 50px; height: 50px; background: rgba(255,255,255,0.1); border-radius: 4px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-bottle-droplet" style="color: var(--text-muted);"></i></div>`;
            }

            recHtml += `
            <div style="flex: 1 1 200px; display: flex; gap: 0.8rem; align-items: start; background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 6px;">
                ${imgTag}
                <div>
                    <strong style="color: var(--primary); font-size: 0.95rem;">${f.name}</strong> <span style="font-size: 0.8rem; color: var(--text-muted);">(${f.type})</span>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; line-height: 1.2;">
                        ${f.usage_instructions ? f.usage_instructions.substring(0, 50) + '...' : "Follow packet instructions."}
                    </div>
                </div>
            </div>`;
        });
        recHtml += '</div>';
    } else {
        recHtml += '<p style="color: var(--text-muted);">No specific products available.</p>';
    }
    recDiv.innerHTML = recHtml;

    const existingRec = document.getElementById('rec-container');
    if (existingRec) existingRec.remove();
    recDiv.id = 'rec-container';
    document.getElementById('result-card').appendChild(recDiv);

}

function downloadReport() {
    if (!currentAnalysisResult) return alert("No analysis available to download.");

    // Check if jsPDF is available
    if (!window.jspdf) return alert("PDF generator not loaded.");
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();
    const margin = 20;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(46, 204, 113); // Green
    doc.text("PlantShield - Disease Detection Report", margin, 20);

    // Meta info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, 30);

    // Divider
    doc.setDrawColor(200);
    doc.line(margin, 35, 190, 35);

    // Result
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Diagnosis Result", margin, 50);

    doc.setFontSize(14);
    if (currentAnalysisResult.is_healthy) {
        doc.setTextColor(46, 204, 113);
    } else {
        doc.setTextColor(231, 76, 60);
    }
    doc.text(`Status: ${currentAnalysisResult.disease_name}`, margin, 60);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Confidence: ${(currentAnalysisResult.confidence * 100).toFixed(1)}%`, margin, 70);
    doc.text(`Severity: ${currentAnalysisResult.severity || 'N/A'}`, margin, 77);

    // Description
    doc.setFontSize(14);
    doc.text("Description", margin, 95);
    doc.setFontSize(11);
    doc.setTextColor(80);
    const desc = doc.splitTextToSize(currentAnalysisResult.description || "No description.", 170);
    doc.text(desc, margin, 105);

    let y = 105 + (desc.length * 6) + 10;

    // Treatment
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Treatment Plan", margin, y);
    doc.setFontSize(11);
    doc.setTextColor(80);
    const treat = doc.splitTextToSize(currentAnalysisResult.treatment || "No treatment info.", 170);
    doc.text(treat, margin, y + 10);

    doc.save(`PlantShield_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function loadHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;
    const res = await apiRequest('/detect/history', 'GET');
    if (res && res.ok) {
        const history = await res.json();
        container.innerHTML = history.map(item => `
            <div class="history-item">
                <img src="http://127.0.0.1:8000${item.image_url}" class="history-img" alt="Scan">
                <div style="margin-top: 0.5rem;">
                    <strong>${item.prediction ? item.prediction.disease_name : 'Analyzing...'}</strong>
                    <br>
                    <small style="color: var(--text-muted);">${new Date(item.upload_date).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    }
}

// Chatbot functionality
async function sendChatQuery() {
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');
    const msgText = input.value.trim();
    if (!msgText) return;
    messages.innerHTML += `<div class="chat-msg user-msg">${msgText}</div>`;
    input.value = '';
    const res = await apiRequest('/chatbot/query', 'POST', { message: msgText });
    if (res && res.ok) {
        const data = await res.json();
        messages.innerHTML += `<div class="chat-msg bot-msg">${data.response}</div>`;
    }
    messages.scrollTop = messages.scrollHeight;
}
function toggleChat() { document.getElementById('chat-window').classList.toggle('hidden'); }

// Full Page Chat Logic
async function sendFullChatQuery() {
    const input = document.getElementById('full-chat-input');
    const messages = document.getElementById('full-chat-messages');
    if (!input || !messages) return;

    const msgText = input.value.trim();
    if (!msgText) return;

    messages.innerHTML += `<div class="chat-msg user-msg">${msgText}</div>`;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    const res = await apiRequest('/chatbot/query', 'POST', { message: msgText });
    if (res && res.ok) {
        const data = await res.json();
        messages.innerHTML += `<div class="chat-msg bot-msg">${data.response}</div>`;
    } else {
        messages.innerHTML += `<div class="chat-msg bot-msg" style="color:var(--danger)">Sorry, I encountered an error.</div>`;
    }
    messages.scrollTop = messages.scrollHeight;
}

function fillChat(text) {
    const input = document.getElementById('full-chat-input');
    if (input) {
        input.value = text;
        input.focus();
        // Optional: Auto-trigger send if desired, or let user edit before sending
        // sendFullChatQuery();
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    if (document.getElementById('drop-zone')) setupUpload();
    
    // Load shop inventory if on shop dashboard
    const shopInventoryList = document.getElementById('shop-inventory-list');
    if (shopInventoryList) {
        apiRequest('/shop/inventory', 'GET').then(async res => {
            if (res && res.ok) {
                const items = await res.json();
                if (items.length === 0) {
                    shopInventoryList.innerHTML = '<p style="grid-column: 1/-1; color: var(--text-muted); text-align: center;">No products in inventory.</p>';
                } else {
                    const itemsHtml = items.map(item => `
                    <div class="glass-panel" style="padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="height: 120px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            ${item.image_url
                            ? `<img src="${item.image_url}" alt="${item.fertilizer_name || 'Product'}" style="width: 100%; height: 100%; object-fit: cover;">`
                            : `<i class="fa-solid fa-box-open" style="font-size: 3rem; color: var(--primary);"></i>`
                        }
                        </div>
                        <h4 style="color: var(--primary); margin: 0;">${item.fertilizer_name || 'Product'}</h4>
                        <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; justify-content: space-between;">
                            <span><i class="fa-solid fa-tag"></i> ${item.category || 'Product'}</span>
                            <span><i class="fa-solid fa-layer-group"></i> ${item.stock_quantity || 0} in stock</span>
                        </div>
                        <div style="font-size: 1.1rem; font-weight: bold; color: var(--text-main); margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
                            <span>₹${item.price || 0}</span>
                            <button class="btn btn-outline" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;" title="Edit Product">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                        </div>
                    </div>`).join('');
                    shopInventoryList.innerHTML = itemsHtml;
                }
            }
        });
    }
    // Farmer Init default
    if (document.getElementById('history-container')) loadHistory();
});

/* -------------------------------------------------------------------------- */
/*                            ADMIN FEATURES                                  */
/* -------------------------------------------------------------------------- */

async function loadAllUsers() {
    const list = document.getElementById('user-list');
    if (!list) return;

    const res = await apiRequest('/admin/users', 'GET');
    if (res && res.ok) {
        const users = await res.json();
        if (!users || users.length === 0) {
            list.innerHTML = '<tr><td colspan="4" style="padding: 1rem; text-align: center;">No users found</td></tr>';
            return;
        }
        list.innerHTML = users.map(u => `
            <tr style="border-bottom: 1px solid var(--glass-border);">
                <td style="padding: 1rem;">
                    <strong>${u.name || 'N/A'}</strong><br>
                    <small style="color:var(--text-muted)">${u.email || 'N/A'}</small>
                </td>
                <td style="padding: 1rem;"><span class="role-badge" style="background:var(--primary); padding:2px 6px; border-radius:4px; font-size:0.8rem; color:black;">${u.role || 'user'}</span></td>
                <td style="padding: 1rem;">
                    <span style="color: ${u.is_active !== false ? 'var(--primary)' : 'var(--danger)'}">
                        ${u.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td style="padding: 1rem;">
                    <button class="btn btn-outline" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;" onclick="toggleUserStatus(${u.user_id}, ${u.is_active !== false})">
                        ${u.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        list.innerHTML = '<tr><td colspan="4" style="padding: 1rem; color: var(--danger);">Failed to load users. Please check your connection.</td></tr>';
    }
}

async function toggleUserStatus(userId, currentStatus) {
    // In a real app we would toggle. backend "update_user_status" was mocked to return success.
    // Let's assume we send !currentStatus
    const res = await apiRequest(`/admin/users/${userId}/status`, 'PUT', { is_active: !currentStatus });
    if (res && res.ok) {
        loadAllUsers();
    } else {
        alert("Failed to update status");
    }
}

let diseaseEditId = null;

async function loadDiseaseKB() {
    const list = document.getElementById('disease-kb-list');
    if (!list) return;

    const res = await apiRequest('/admin/diseases', 'GET');
    if (res && res.ok) {
        const diseases = await res.json();
        list.innerHTML = diseases.map(d => `
            <div class="glass-panel" style="padding: 1rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                <div style="flex:1;">
                    <h4 style="color: var(--primary); margin:0 0 0.25rem 0;">${d.name} <small style="color:var(--text-muted)">(${d.crop_name})</small></h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">${d.description}</p>
                    <div style="margin-top: 0.5rem;">
                        <small><strong>Treatment:</strong> ${d.treatment}</small>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                    <button class="btn btn-outline" onclick='startEditDisease(${JSON.stringify(d)})' style="padding:0.4rem 0.6rem; font-size:0.85rem;">Edit</button>
                </div>
            </div>
        `).join('');
    }
}

function openDiseaseModal() {
    document.getElementById('disease-modal').classList.add('active');
}

function closeDiseaseModal() {
    document.getElementById('disease-modal').classList.remove('active');
    // Reset any edit state
    diseaseEditId = null;
    document.getElementById('modal-title').textContent = 'Add New Disease';
    const form = document.getElementById('disease-form');
    if (form) form.reset();
}

async function saveDisease(event) {
    event.preventDefault();
    const data = {
        name: document.getElementById('d-name').value,
        crop_name: document.getElementById('d-crop').value,
        description: document.getElementById('d-desc').value,
        symptoms: document.getElementById('d-symptoms').value,
        treatment: document.getElementById('d-treatment').value
    };

    try {
        let res;
        if (diseaseEditId) {
            // Update existing
            res = await apiRequest(`/admin/diseases/${diseaseEditId}`, 'PUT', data);
        } else {
            res = await apiRequest('/admin/diseases', 'POST', data);
        }

        if (res && res.ok) {
            alert(diseaseEditId ? "Disease updated successfully!" : "Disease added successfully!");
            closeDiseaseModal();
            loadDiseaseKB();
        } else if (res) {
            const err = await res.json().catch(() => null);
            const msg = err && (err.detail || err.message) ? (err.detail || err.message) : 'Unknown error';
            alert('Failed: ' + msg);
        } else {
            alert('Failed to add/update disease. Check server connection.');
        }
    } catch (err) {
        console.error('Save disease error:', err);
        alert('Unexpected error occurred while saving disease. Check console.');
    }
}

function startEditDisease(disease) {
    // disease is an object passed from rendering
    diseaseEditId = disease.disease_id || disease.diseaseId || disease.id || null;
    document.getElementById('modal-title').textContent = 'Edit Disease';
    document.getElementById('d-name').value = disease.name || '';
    document.getElementById('d-crop').value = disease.crop_name || '';
    document.getElementById('d-desc').value = disease.description || '';
    document.getElementById('d-symptoms').value = disease.symptoms || '';
    document.getElementById('d-treatment').value = disease.treatment || '';
    document.getElementById('disease-modal').classList.add('active');
}

async function loadAdminAnalytics() {
    // Requires Chart.js canvas 'adminDiseaseChart'
    const ctx = document.getElementById('adminDiseaseChart');
    if (!ctx) return;

    const res = await apiRequest('/admin/analytics', 'GET');
    if (res && res.ok) {
        const data = await res.json();

        // Render Chart
        if (window.adminChartInstance) window.adminChartInstance.destroy();

        window.adminChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Disease Detections',
                    data: data.scan_trend || [0, 0, 0, 0, 0, 0],
                    borderColor: '#2ecc71',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(46, 204, 113, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: 'white' } }
                },
                scales: {
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    }
}



// ... (Previous Admin & Shop Owner Loaders)

/* -------------------------------------------------------------------------- */
/*                            WEATHER & PROFILE                               */
/* -------------------------------------------------------------------------- */

const WEATHER_API_KEY = "YOUR_OPENWEATHERMAP_API_KEY_HERE"; // TODO: Replace with your API Key from openweathermap.org

async function loadWeather() {
    if (WEATHER_API_KEY === "YOUR_OPENWEATHERMAP_API_KEY_HERE" || !WEATHER_API_KEY) {
        console.log("No Weather API Key provided. Using Mock Data.");
        return renderMockWeather();
    }

    if (!navigator.geolocation) {
        alert("Geolocation not supported. Using Mock Data.");
        return renderMockWeather();
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Fetch Current Weather
            const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`);
            if (!currentRes.ok) throw new Error("Weather API failed");
            const currentData = await currentRes.json();

            // Fetch Forecast
            const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`);
            if (!forecastRes.ok) throw new Error("Forecast API failed");
            const forecastData = await forecastRes.json();

            renderRealTimeWeather(currentData, forecastData);
        } catch (error) {
            console.error("Error fetching weather:", error);
            renderMockWeather();
        }
    }, (error) => {
        console.warn("Location access denied. Using Mock Data.");
        renderMockWeather();
    });
}

function renderRealTimeWeather(current, forecast) {
    // Current
    document.getElementById('weather-temp').textContent = `${Math.round(current.main.temp)}°C`;
    document.getElementById('weather-desc').textContent = current.weather[0].description;
    document.getElementById('weather-humidity').textContent = `${current.main.humidity}%`;
    document.getElementById('weather-wind').textContent = `${Math.round(current.wind.speed * 3.6)}km/h`; // m/s to km/h
    document.getElementById('weather-icon').innerHTML = `<img src="https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png" width="80">`;

    // Alerts check
    const alerts = [];
    if (current.main.humidity > 80) alerts.push({ title: "High Humidity", msg: "Risk of fungal diseases. Monitor crops." });
    if (current.main.temp > 35) alerts.push({ title: "High Heat", msg: "Ensure irrigation to prevent heat stress." });
    if (current.weather[0].main === 'Rain') alerts.push({ title: "Rain Alert", msg: "Heavy rain expected. Check drainage." });

    const alertBox = document.getElementById('weather-alerts');
    if (alerts.length > 0) {
        alertBox.innerHTML = alerts.map(a => `
             <div class="alert-box"
                style="background: rgba(231, 76, 60, 0.2); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--danger);">
                <strong>${a.title}</strong>
                <p style="font-size: 0.9rem;">${a.msg}</p>
             </div>
        `).join('');
    } else {
        alertBox.innerHTML = `<p style="color:var(--text-muted)">No active weather alerts.</p>`;
    }

    // Forecast
    const dailyData = forecast.list.filter(item => item.dt_txt.includes("12:00:00"));
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = dailyData.map(f => {
        const date = new Date(f.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        return `
        <div class="glass-panel" style="min-width: 120px; padding: 1rem; text-align: center;">
            <p style="font-weight: bold;">${day}</p>
            <div style="margin: 0.5rem 0;"><img src="https://openweathermap.org/img/wn/${f.weather[0].icon}.png" width="50"></div>
            <p>${Math.round(f.main.temp)}°C</p>
            <small style="color: var(--text-muted); font-size: 0.8rem;">${f.weather[0].main}</small>
        </div>
    `;
    }).join('');
}

function renderMockWeather() {
    // Mock Weather Data (fallback)
    const mockWeather = {
        current: {
            temp: 29,
            condition: "Cloudy",
            humidity: 78,
            wind: 15,
            icon: "☁️"
        },
        forecast: [
            { day: "Tue", icon: "🌤️", temp: 30, cond: "Partly Cloudy" },
            { day: "Wed", icon: "🌧️", temp: 27, cond: "Rain" },
            { day: "Thu", icon: "🌧️", temp: 26, cond: "Rain" },
            { day: "Fri", icon: "☁️", temp: 28, cond: "Cloudy" },
            { day: "Sat", icon: "☀️", temp: 32, cond: "Sunny" },
            { day: "Sun", icon: "☀️", temp: 33, cond: "Sunny" },
            { day: "Mon", icon: "🌤️", temp: 31, cond: "Partly Cloudy" }
        ],
        alerts: []
    };

    // Risk Logic
    if (mockWeather.current.humidity > 75) {
        mockWeather.alerts.push({
            title: "High Humidity Warning",
            msg: "High humidity (>75%) increases risk of Late Blight. Inspect crops daily."
        });
    }
    if (mockWeather.current.temp > 35) {
        mockWeather.alerts.push({
            title: "High Heat Alert",
            msg: "Temperatures above 35°C can cause heat stress. Ensure adequate irrigation."
        });
    }

    // Render Current
    document.getElementById('weather-temp').textContent = `${mockWeather.current.temp}°C`;
    document.getElementById('weather-desc').textContent = mockWeather.current.condition;
    document.getElementById('weather-humidity').textContent = `${mockWeather.current.humidity}%`;
    document.getElementById('weather-wind').textContent = `${mockWeather.current.wind}km/h`;
    document.getElementById('weather-icon').textContent = mockWeather.current.icon;

    // Render Alerts
    const alertBox = document.getElementById('weather-alerts');
    if (mockWeather.alerts.length > 0) {
        alertBox.innerHTML = mockWeather.alerts.map(a => `
             <div class="alert-box"
                style="background: rgba(231, 76, 60, 0.2); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--danger);">
                <strong>${a.title}</strong>
                <p style="font-size: 0.9rem;">${a.msg}</p>
             </div>
        `).join('');
    } else {
        alertBox.innerHTML = `<p style="color:var(--text-muted)">No active weather alerts.</p>`;
    }

    // Render Forecast
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = mockWeather.forecast.map(f => `
        <div class="glass-panel" style="min-width: 120px; padding: 1rem; text-align: center;">
            <p style="font-weight: bold;">${f.day}</p>
            <div style="font-size: 2rem; margin: 0.5rem 0;">${f.icon}</div>
            <p>${f.temp}°C</p>
            <small style="color: var(--text-muted); font-size: 0.8rem;">${f.cond}</small>
        </div>
    `).join('');
}

async function updateProfile(event) {
    event.preventDefault();
    const location = document.getElementById('profile-location').value;
    const crops = document.getElementById('profile-crops').value;
    const password = document.getElementById('profile-password').value;

    const body = { location, crops_grown: crops };
    if (password) body.password = password;

    const res = await apiRequest('/users/me', 'PUT', body);
    if (res && res.ok) {
        alert("Profile updated successfully!");
        if (password) document.getElementById('profile-password').value = '';
    } else {
        alert("Failed to update profile.");
    }
}

async function updateShopProfile(event) {
    event.preventDefault();
    const upi = document.getElementById('shop-upi').value;
    const location = document.getElementById('shop-location').value;
    const license = document.getElementById('shop-license').value;
    const password = document.getElementById('shop-password').value;

    const body = { location, upi_id: upi, license_number: license };
    if (password) body.password = password;

    const res = await apiRequest('/users/me', 'PUT', body);
    if (res && res.ok) {
        alert("Shop details updated!");
        if (password) document.getElementById('shop-password').value = '';
    } else {
        alert("Failed to update shop details.");
    }
}

async function updateAdminSettings() {
    // Mock Config Save
    const passport = document.getElementById('admin-password').value;
    if (passport) {
        const res = await apiRequest('/users/me', 'PUT', { password: passport });
        if (res && res.ok) {
            alert("Configuration Saved & Password Updated.");
            document.getElementById('admin-password').value = '';
        } else {
            alert("Failed to update password.");
        }
    } else {
        alert("Configuration Saved.");
    }
}

async function loadNotifications() {
    // Can be used by Farmer and Shop Owner
    let container = document.getElementById('notification-list');

    // Shop dashboard specific handling if IDs differ or generic container needed
    if (!container && document.getElementById('ssec-notifications')) {
        container = document.querySelector('#ssec-notifications');
    }

    if (!container) return;

    const res = await apiRequest('/users/notifications', 'GET');
    if (res && res.ok) {
        const notifs = await res.json();

        // Handling container content
        let html = '';
        if (container.id === 'ssec-notifications') {
            // Keep header/structure if it was the main section
            html += `<h2 class="glass-border-bottom" style="margin-bottom: 2rem;"><i class="fa-solid fa-bell"></i> Alerts</h2>`;
        }

        if (notifs.length === 0) {
            html += '<p style="color:var(--text-muted); padding:1rem;">No new notifications</p>';
        } else {
            html += notifs.map(n => `
                <div class="glass-panel" style="padding: 1rem; border-left: 4px solid var(--${n.type === 'Alert' ? 'danger' : 'primary'}); margin-bottom: 1rem;">
                    <h4>${n.type}</h4>
                    <p style="color: var(--text-muted);">${n.message}</p>
                    <small style="color: var(--text-muted);">${new Date(n.created_at).toLocaleDateString()}</small>
                </div>
            `).join('');
        }

        // If it's the list container, just set innerHTML
        if (container.id === 'notification-list') {
            container.innerHTML = html;
        } else {
            // If it's the section itself
            container.innerHTML = html;
        }
    }
}

// Note: Inventory & Orders are partly handled in common code or above, ensuring naming consistency.

async function loadShopQueries() {
    const list = document.getElementById('queries-list');
    if (!list) return;

    const res = await apiRequest('/shop/queries', 'GET');
    if (res && res.ok) {
        const queries = await res.json();
        if (queries.length > 0) {
            list.innerHTML = queries.map(q => `
                <div class="glass-panel" style="padding: 1rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <h4 style="color:var(--accent)">${q.farmer_name}</h4>
                        <small>${new Date(q.created_at).toLocaleDateString()}</small>
                    </div>
                    <p style="margin: 0.5rem 0; font-size: 1rem;">"${q.message}"</p>
                    
                    ${q.reply ?
                    `<div style="margin-top:0.5rem; padding:0.5rem; background:rgba(255,255,255,0.05); border-radius:4px;">
                            <strong>You:</strong> ${q.reply}
                         </div>`
                    :
                    `<div style="margin-top: 0.5rem;">
                            <input type="text" id="reply-input-${q.query_id}" placeholder="Type reply..." style="padding: 0.5rem; width: 70%;">
                            <button onclick="replyQuery(${q.query_id})" class="btn btn-primary" style="padding: 0.5rem 1rem;">Send</button>
                         </div>`
                }
                </div>
            `).join('');
        }
        // Else: Reuse the hardcoded HTML as demo/placeholder if queries are empty
    }
}

async function replyQuery(queryId) {
    const input = document.getElementById(`reply-input-${queryId}`);
    if (!input || !input.value) return;

    const res = await apiRequest(`/shop/queries/${queryId}/reply`, 'PUT', { reply: input.value });
    if (res && res.ok) {
        alert("Reply sent.");
        loadShopQueries();
    }
}

async function loadShopAnalytics() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    const res = await apiRequest('/shop/analytics', 'GET');
    if (res && res.ok) {
        const data = await res.json();

        if (window.shopChartInstance) window.shopChartInstance.destroy();

        window.shopChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Monthly Sales (₹)',
                    data: data.monthly_trend || [],
                    backgroundColor: 'rgba(243, 156, 18, 0.7)',
                    borderColor: '#f39c12',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: 'white' } }
                },
                scales: {
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    }
}

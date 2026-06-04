const menuContainer = document.getElementById("menuContainer");
let allProducts = [];
let selectedProduct = null;
let activeCategory = "all";
let pendingOrder = null;

const orderModal = document.getElementById("orderModal");
const confirmModal = document.getElementById("confirmModal");
const orderForm = document.getElementById("orderForm");

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

async function ensureGuestOrPrompt() {
    try {
        const session = await api.get("/auth/session");
        if (session.authenticated) return session;
    } catch {
        /* fall through */
    }

    const goWelcome = confirm(
        "Please continue as Guest first to place orders.\n\nGo to the welcome page now?"
    );
    if (goWelcome) window.location.href = "/guest.html";
    return null;
}

async function loadMenu() {
    if (!menuContainer) return;

    try {
        const { products } = await api.get("/products?available=true");
        allProducts = products;
        renderMenu();
    } catch (err) {
        menuContainer.innerHTML = `<p style="color:#c0392b; text-align:center; grid-column:1/-1;">${escapeHtml(err.message)}. Make sure the server is running (python run.py).</p>`;
    }
}

function renderMenu() {
    const filtered =
        activeCategory === "all"
            ? allProducts
            : allProducts.filter((p) => (p.category || "milktea") === activeCategory);

    menuContainer.innerHTML = "";

    if (!filtered.length) {
        menuContainer.innerHTML =
            '<p style="text-align:center; color:#888; padding:40px; grid-column:1/-1;">No products in this category.</p>';
        return;
    }

    filtered.forEach((product) => {
        menuContainer.innerHTML += `
            <div class="card product-card">
                <h3>${escapeHtml(product.name)}</h3>
                <p class="price">₱${Number(product.price).toFixed(2)}</p>
                <p class="status available">${escapeHtml(product.status)}</p>
                <button type="button" data-id="${product.id}">Order Now</button>
            </div>
        `;
    });

    menuContainer.querySelectorAll("button[data-id]").forEach((btn) => {
        btn.addEventListener("click", () => openOrderModal(Number(btn.dataset.id)));
    });
}

window.filterCategory = function (category, buttonEl) {
    activeCategory = category;
    document.querySelectorAll(".categories button").forEach((btn) => {
        btn.classList.remove("active");
    });
    if (buttonEl) buttonEl.classList.add("active");
    renderMenu();
};

function updateOrderTotal() {
    if (!selectedProduct) return;
    const qty = parseInt(document.getElementById("orderQuantity").value, 10) || 1;
    const total = Number(selectedProduct.price) * qty;
    const totalEl = document.getElementById("orderTotal");
    if (totalEl) totalEl.textContent = "Total: ₱" + total.toFixed(2);
}

async function openOrderModal(productId) {
    const session = await ensureGuestOrPrompt();
    if (!session) return;

    selectedProduct = allProducts.find((p) => p.id === productId);
    if (!selectedProduct || !orderModal) return;

    document.getElementById("orderProductName").textContent = selectedProduct.name;
    document.getElementById("orderProductPrice").textContent =
        "₱" + Number(selectedProduct.price).toFixed(2);
    document.getElementById("orderQuantity").value = 1;

    const nameInput = document.getElementById("customerName");
    if (nameInput) {
        nameInput.value =
            session.role === "guest" && session.username !== "Guest"
                ? session.username
                : "";
    }

    document.getElementById("orderPayment").value = "Cash";
    updateOrderTotal();
    orderModal.style.display = "flex";
}

function closeOrderModal() {
    if (orderModal) orderModal.style.display = "none";
}

function closeConfirmModal() {
    if (confirmModal) confirmModal.style.display = "none";
}

function showConfirmation() {
    if (!pendingOrder || !confirmModal) return;

    document.getElementById("confirmationDetails").innerHTML = `
        <p><strong>Customer:</strong> ${escapeHtml(pendingOrder.customer_name)}</p>
        <p><strong>Product:</strong> ${escapeHtml(pendingOrder.product_name)}</p>
        <p><strong>Price:</strong> ₱${Number(pendingOrder.price).toFixed(2)}</p>
        <p><strong>Quantity:</strong> ${pendingOrder.quantity}</p>
        <p><strong>Payment:</strong> ${escapeHtml(pendingOrder.payment)}</p>
        <p class="price"><strong>Total:</strong> ₱${Number(pendingOrder.total).toFixed(2)}</p>
    `;
    orderModal.style.display = "none";
    confirmModal.style.display = "flex";
}

async function submitOrder() {
    if (!pendingOrder) return;

    try {
        await api.post("/orders", pendingOrder);
        alert("Order submitted! Staff will see it in Admin → Orders.");
        pendingOrder = null;
        closeConfirmModal();
    } catch (err) {
        alert(err.message);
    }
}

if (menuContainer) {
    document.addEventListener("DOMContentLoaded", async () => {
        await loadMenu();

        document.getElementById("closeOrderModal")?.addEventListener("click", closeOrderModal);
        document.getElementById("cancelOrderBtn")?.addEventListener("click", closeOrderModal);
        document.getElementById("closeConfirmModal")?.addEventListener("click", closeConfirmModal);
        document.getElementById("removeOrderBtn")?.addEventListener("click", () => {
            pendingOrder = null;
            closeConfirmModal();
            if (selectedProduct && orderModal) orderModal.style.display = "flex";
        });
        document.getElementById("submitOrderBtn")?.addEventListener("click", submitOrder);

        document.getElementById("orderQuantity")?.addEventListener("input", updateOrderTotal);

        if (orderForm) {
            orderForm.addEventListener("submit", (e) => {
                e.preventDefault();
                if (!selectedProduct) return;

                const quantity = parseInt(document.getElementById("orderQuantity").value, 10);
                const payment = document.getElementById("orderPayment").value;
                const customerName =
                    document.getElementById("customerName")?.value.trim() || "Guest";

                if (!quantity || quantity < 1) {
                    alert("Enter a valid quantity");
                    return;
                }

                pendingOrder = {
                    product_id: selectedProduct.id,
                    product_name: selectedProduct.name,
                    price: selectedProduct.price,
                    quantity,
                    payment,
                    customer_name: customerName,
                    status: "Pending",
                    total: Number(selectedProduct.price) * quantity,
                };

                showConfirmation();
            });
        }

        orderModal?.addEventListener("click", (e) => {
            if (e.target === orderModal) closeOrderModal();
        });
        confirmModal?.addEventListener("click", (e) => {
            if (e.target === confirmModal) closeConfirmModal();
        });
    });
}
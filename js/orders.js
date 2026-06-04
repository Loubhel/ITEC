const ordersContainer = document.getElementById("ordersContainer");

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

async function loadOrders() {
    if (!ordersContainer) return;

    try {
        const { orders } = await api.get("/orders");
        ordersContainer.innerHTML = "";

        if (!orders.length) {
            ordersContainer.innerHTML =
                '<p style="text-align:center; color:#888; padding:40px; grid-column:1/-1;">No pending orders. Guest orders from the Menu page appear here.</p>';
            return;
        }

        orders.forEach((order) => {
            const customer = order.customer_name || "Guest";
            ordersContainer.innerHTML += `
                <div class="card">
                    <h3>${escapeHtml(order.product_name)}</h3>
                    <p><strong>Customer:</strong> ${escapeHtml(customer)}</p>
                    <p>Quantity: ${order.quantity}</p>
                    <p class="price">Total: ₱${Number(order.total).toFixed(2)}</p>
                    <p>Payment: ${escapeHtml(order.payment)}</p>
                    <p class="status">${escapeHtml(order.status)}</p>
                    <div class="btn-group">
                        <button class="pending-btn" data-id="${order.id}" data-action="pending">Pending</button>
                        <button class="done-btn" data-id="${order.id}" data-action="complete">Done</button>
                        <button class="delete-btn" data-id="${order.id}" data-action="delete">Delete</button>
                    </div>
                </div>
            `;
        });

        ordersContainer.querySelectorAll("button[data-action]").forEach((btn) => {
            btn.addEventListener("click", () => handleOrderAction(btn));
        });
    } catch (err) {
        ordersContainer.innerHTML = `<p style="color:#c0392b; text-align:center;">${escapeHtml(err.message)}</p>`;
    }
}

async function handleOrderAction(btn) {
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    try {
        if (action === "pending") {
            await api.put(`/orders/${id}`, { status: "Pending" });
            await loadOrders();
        } else if (action === "complete") {
            await api.put(`/orders/${id}`, { action: "complete" });
            alert("Order completed and saved to transactions.xml");
            await loadOrders();
        } else if (action === "delete") {
            if (!confirm("Delete this order from orders.xml?")) return;
            await api.delete(`/orders/${id}`);
            await loadOrders();
        }
    } catch (err) {
        alert(err.message);
    }
}

if (ordersContainer) {
    document.addEventListener("DOMContentLoaded", async () => {
        const ok = await requireAdmin();
        if (!ok) return;
        await loadOrders();
    });
}
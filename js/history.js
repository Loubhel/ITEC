const historyContainer = document.getElementById("historyContainer");
const archiveContainer = document.getElementById("archiveContainer");

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

function renderTransaction(tx, allowDelete) {
    const customer = tx.customer_name || "Guest";
    const deleteBtn = allowDelete
        ? `<div class="btn-group" style="margin-top:15px;">
                <button class="delete-btn" data-id="${tx.id}">Remove from Archive</button>
           </div>`
        : "";

    return `
        <div class="${allowDelete ? "archive-card" : "card"}">
            <h3>${escapeHtml(tx.product_name)}</h3>
            <p><strong>Customer:</strong> ${escapeHtml(customer)}</p>
            <p><strong>Quantity:</strong> ${tx.quantity}</p>
            <p class="price">Total: ₱${Number(tx.total).toFixed(2)}</p>
            <p><strong>Payment:</strong> ${escapeHtml(tx.payment)}</p>
            <p class="status available">${escapeHtml(tx.status || "Completed")}</p>
            ${deleteBtn}
        </div>
    `;
}

async function loadTransactions(target, allowDelete) {
    if (!target) return;

    try {
        const { transactions } = await api.get("/transactions");
        target.innerHTML = "";

        if (!transactions.length) {
            target.innerHTML = `
                <div style="text-align:center; padding:60px 20px; color:#888; grid-column:1/-1;">
                    <h3>No transactions yet</h3>
                    <p>Mark orders as Done in Orders to save them here.</p>
                </div>`;
            return;
        }

        transactions.forEach((tx) => {
            target.innerHTML += renderTransaction(tx, allowDelete);
        });

        if (allowDelete) {
            target.querySelectorAll(".delete-btn").forEach((btn) => {
                btn.addEventListener("click", async () => {
                    const id = Number(btn.dataset.id);
                    if (!confirm("Remove from transactions.xml?")) return;
                    try {
                        await api.delete(`/transactions/${id}`);
                        await loadTransactions(target, true);
                    } catch (err) {
                        alert(err.message);
                    }
                });
            });
        }
    } catch (err) {
        target.innerHTML = `<p style="color:#c0392b; text-align:center; grid-column:1/-1;">${escapeHtml(err.message)}</p>`;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    if (!historyContainer && !archiveContainer) return;

    const ok = await requireAdmin();
    if (!ok) return;

    if (historyContainer) await loadTransactions(historyContainer, false);
    if (archiveContainer) await loadTransactions(archiveContainer, true);
});
// =====================
// HISTORY & ARCHIVE MANAGEMENT
// =====================

const archiveContainer = document.getElementById("archiveContainer");

if (archiveContainer) {

    function displayArchive() {
        const history = JSON.parse(localStorage.getItem("history")) || [];

        archiveContainer.innerHTML = "";

        if (history.length === 0) {
            archiveContainer.innerHTML = `
                <div style="text-align:center; padding:60px 20px; color:#888; grid-column:1/-1;">
                    <h3>No Archived Transactions Yet</h3>
                    <p>Completed orders will appear here.</p>
                </div>
            `;
            return;
        }

        history.forEach(order => {
            archiveContainer.innerHTML += `
                <div class="archive-card">
                    <h3>${order.productName}</h3>
                    <p><strong>Quantity:</strong> ${order.quantity}</p>
                    <p class="price">Total: ₱${order.total}</p>
                    <p><strong>Payment:</strong> ${order.payment}</p>
                    <p class="status">Completed</p>
                    
                    <div class="btn-group" style="margin-top:15px;">
                        <button class="delete-btn" onclick="deleteFromArchive(${order.id})">
                            Remove from Archive
                        </button>
                    </div>
                </div>
            `;
        });
    }

    // Display on page load
    displayArchive();

    // Delete from Archive
    window.deleteFromArchive = function(id) {
        if (confirm("Remove this transaction from archive?")) {
            let history = JSON.parse(localStorage.getItem("history")) || [];
            history = history.filter(order => order.id !== id);
            localStorage.setItem("history", JSON.stringify(history));
            displayArchive();
        }
    };
}

// =====================
// SUPPORT FOR HISTORY PAGE (if you have one)
// =====================

const historyContainer = document.getElementById("historyContainer");

if (historyContainer) {

    function displayHistory() {
        const history = JSON.parse(localStorage.getItem("history")) || [];

        historyContainer.innerHTML = "";

        if (history.length === 0) {
            historyContainer.innerHTML = `
                <p style="text-align:center; padding:60px; color:#888;">
                    No completed transactions yet.
                </p>`;
            return;
        }

        history.forEach(order => {
            historyContainer.innerHTML += `
                <div class="card">
                    <h3>${order.productName}</h3>
                    <p>Quantity: ${order.quantity}</p>
                    <p class="price">Total: ₱${order.total}</p>
                    <p>Payment: ${order.payment}</p>
                    <p class="status available">Completed</p>
                </div>
            `;
        });
    }

    displayHistory();
}
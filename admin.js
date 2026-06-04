// =====================
// PRODUCT MANAGEMENT
// =====================

const productList = document.getElementById("productList");
const addProductBtn = document.getElementById("addProductBtn");

if (addProductBtn) {

    function displayProducts() {
        const products = JSON.parse(localStorage.getItem("products")) || [];
        productList.innerHTML = "";

        if (products.length === 0) {
            productList.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:#888; padding:30px;">No products yet. Add some above.</p>`;
            return;
        }

        products.forEach(product => {
            const statusClass = product.status === "Available" ? "available" : "not-available";

            productList.innerHTML += `
                <div class="card">
                    <h3>${product.name}</h3>
                    <p class="price">₱${product.price}</p>
                    <p class="status ${statusClass}">
                        ${product.status}
                    </p>
                    <div class="btn-group">
                        <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                        <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                    </div>
                </div>
            `;
        });
    }

    // Display products on load
    displayProducts();

    // Add New Product
    addProductBtn.addEventListener("click", () => {
        const name = document.getElementById("productName").value.trim();
        const price = document.getElementById("productPrice").value.trim();
        const status = document.getElementById("productStatus").value;

        if (name === "" || price === "") {
            alert("Please fill in all fields");
            return;
        }

        const products = JSON.parse(localStorage.getItem("products")) || [];

        products.push({
            id: Date.now(),
            name: name,
            price: parseFloat(price),
            status: status
        });

        localStorage.setItem("products", JSON.stringify(products));

        // Clear form
        document.getElementById("productName").value = "";
        document.getElementById("productPrice").value = "";

        displayProducts();   // Better than reload
    });

    // Delete Product
    window.deleteProduct = function(id) {
        if (confirm("Are you sure you want to delete this product?")) {
            let products = JSON.parse(localStorage.getItem("products")) || [];
            products = products.filter(product => product.id !== id);
            localStorage.setItem("products", JSON.stringify(products));
            displayProducts();
        }
    };

    // Edit Product
    window.editProduct = function(id) {
        let products = JSON.parse(localStorage.getItem("products")) || [];
        const product = products.find(p => p.id === id);

        if (!product) return;

        const newName = prompt("Edit Product Name:", product.name);
        if (newName === null) return; // Cancelled

        const newPrice = prompt("Edit Price:", product.price);
        const newStatus = prompt("Status (Available / Not Available):", product.status);

        if (newName) product.name = newName;
        if (newPrice) product.price = parseFloat(newPrice);
        if (newStatus) product.status = newStatus;

        localStorage.setItem("products", JSON.stringify(products));
        displayProducts();
    };
}

// =====================
// ORDERS MANAGEMENT (for future orders.html)
// =====================

const ordersContainer = document.getElementById("ordersContainer");

if (ordersContainer) {

    function displayOrders() {
        const orders = JSON.parse(localStorage.getItem("orders")) || [];
        ordersContainer.innerHTML = "";

        if (orders.length === 0) {
            ordersContainer.innerHTML = `<p style="text-align:center; color:#888; padding:40px;">No orders yet.</p>`;
            return;
        }

        orders.forEach(order => {
            ordersContainer.innerHTML += `
                <div class="card">
                    <h3>${order.productName}</h3>
                    <p>Quantity: ${order.quantity}</p>
                    <p>Total: ₱${order.total}</p>
                    <p>Payment: ${order.payment}</p>
                    <p class="status">${order.status}</p>
                    
                    <div class="btn-group">
                        <button class="pending-btn" onclick="setPending(${order.id})">Pending</button>
                        <button class="done-btn" onclick="setDone(${order.id})">Done</button>
                    </div>
                </div>
            `;
        });
    }

    displayOrders();

    window.setPending = function(id) {
        let orders = JSON.parse(localStorage.getItem("orders")) || [];
        const order = orders.find(o => o.id === id);
        if (order) order.status = "Pending";
        localStorage.setItem("orders", JSON.stringify(orders));
        displayOrders();
    };

    window.setDone = function(id) {
        let orders = JSON.parse(localStorage.getItem("orders")) || [];
        let history = JSON.parse(localStorage.getItem("history")) || [];

        const orderIndex = orders.findIndex(o => o.id === id);
        if (orderIndex !== -1) {
            const order = orders[orderIndex];
            order.status = "Done";
            history.push(order);
            orders.splice(orderIndex, 1);

            localStorage.setItem("history", JSON.stringify(history));
            localStorage.setItem("orders", JSON.stringify(orders));
            displayOrders();
            alert("Order moved to History");
        }
    };
}
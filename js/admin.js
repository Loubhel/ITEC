const productList = document.getElementById("productList");
const addProductBtn = document.getElementById("addProductBtn");

async function loadProducts() {
    if (!productList) return;

    try {
        const { products } = await api.get("/products");
        productList.innerHTML = "";

        if (!products.length) {
            productList.innerHTML =
                '<p style="text-align:center; grid-column:1/-1; color:#888; padding:30px;">No products yet. Add some above.</p>';
            return;
        }

        products.forEach((product) => {
            const statusClass =
                product.status === "Available" ? "available" : "not-available";

            productList.innerHTML += `
                <div class="card product-card">
                    <h3>${escapeHtml(product.name)}</h3>
                    <p class="price">₱${Number(product.price).toFixed(2)}</p>
                    <p class="status ${statusClass}">${escapeHtml(product.status)}</p>
                    <p style="color:#888; font-size:0.9rem;">${escapeHtml(product.category || "milktea")}</p>
                    <div class="btn-group">
                        <button class="edit-btn" data-id="${product.id}">Edit</button>
                        <button class="delete-btn" data-id="${product.id}">Delete</button>
                    </div>
                </div>
            `;
        });

        productList.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", () => editProduct(Number(btn.dataset.id)));
        });
        productList.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", () => deleteProduct(Number(btn.dataset.id)));
        });
    } catch (err) {
        productList.innerHTML = `<p style="color:#c0392b; text-align:center;">${escapeHtml(err.message)}</p>`;
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

async function editProduct(id) {
    try {
        const { products } = await api.get("/products");
        const product = products.find((p) => p.id === id);
        if (!product) return;

        const newName = prompt("Edit Product Name:", product.name);
        if (newName === null) return;

        const newPrice = prompt("Edit Price:", product.price);
        const newStatus = prompt("Status (Available / Not Available):", product.status);
        const newCategory = prompt("Category (milktea / fruittea / special):", product.category || "milktea");

        const body = {};
        if (newName) body.name = newName;
        if (newPrice !== null && newPrice !== "") body.price = parseFloat(newPrice);
        if (newStatus) body.status = newStatus;
        if (newCategory) body.category = newCategory;

        await api.put(`/products/${id}`, body);
        await loadProducts();
    } catch (err) {
        alert(err.message);
    }
}

async function deleteProduct(id) {
    if (!confirm("Delete this product from products.xml?")) return;
    try {
        await api.delete(`/products/${id}`);
        await loadProducts();
    } catch (err) {
        alert(err.message);
    }
}

if (addProductBtn) {
    document.addEventListener("DOMContentLoaded", async () => {
        const ok = await requireAdmin();
        if (!ok) return;

        await loadProducts();

        addProductBtn.addEventListener("click", async () => {
            const name = document.getElementById("productName").value.trim();
            const price = document.getElementById("productPrice").value.trim();
            const status = document.getElementById("productStatus").value;
            const categoryEl = document.getElementById("productCategory");
            const category = categoryEl ? categoryEl.value : "milktea";

            if (!name || !price) {
                alert("Please fill in all fields");
                return;
            }

            try {
                await api.post("/products", {
                    name,
                    price: parseFloat(price),
                    status,
                    category,
                });
                document.getElementById("productName").value = "";
                document.getElementById("productPrice").value = "";
                await loadProducts();
            } catch (err) {
                alert(err.message);
            }
        });
    });
}
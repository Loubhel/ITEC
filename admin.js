// =====================
// PRODUCT PAGE
// =====================

if(document.getElementById("addProductBtn")){

    const productList =
    document.getElementById("productList");

    function displayProducts(){

        const products =
        JSON.parse(localStorage.getItem("products")) || [];

        productList.innerHTML = "";

        products.forEach(product=>{

            productList.innerHTML += `

            <div class="card">

                <h3>${product.name}</h3>

                <p>Price: ₱${product.price}</p>

                <p class="status">
                Status: ${product.status}
                </p>

                <div class="btn-group">

                    <button
                    class="edit-btn"
                    onclick="editProduct(${product.id})">
                    Edit
                    </button>

                    <button
                    class="delete-btn"
                    onclick="deleteProduct(${product.id})">
                    Delete
                    </button>

                </div>

            </div>

            `;
        });
    }

    displayProducts();


    document.getElementById("addProductBtn")
    .addEventListener("click",()=>{

        const name =
        document.getElementById("productName").value;

        const price =
        document.getElementById("productPrice").value;

        const status =
        document.getElementById("productStatus").value;

        if(name === "" || price === ""){

            alert("Fill all fields");
            return;

        }

        const products =
        JSON.parse(localStorage.getItem("products")) || [];

        products.push({

            id:Date.now(),
            name,
            price,
            status

        });

        localStorage.setItem(
            "products",
            JSON.stringify(products)
        );

        location.reload();

    });


    window.deleteProduct = function(id){

        let products =
        JSON.parse(localStorage.getItem("products")) || [];

        products =
        products.filter(product=>product.id!==id);

        localStorage.setItem(
            "products",
            JSON.stringify(products)
        );

        displayProducts();

    }


    window.editProduct = function(id){

        let products =
        JSON.parse(localStorage.getItem("products")) || [];

        const product =
        products.find(product=>product.id===id);

        const newName =
        prompt("Edit Product Name",product.name);

        const newPrice =
        prompt("Edit Price",product.price);

        const newStatus =
        prompt(
        "Available or Not Available",
        product.status
        );

        if(newName!==null){

            product.name = newName;
            product.price = newPrice;
            product.status = newStatus;

            localStorage.setItem(
                "products",
                JSON.stringify(products)
            );

            displayProducts();
        }

    }

}


// =====================
// ORDERS PAGE
// =====================

if(document.getElementById("ordersContainer")){

    const ordersContainer =
    document.getElementById("ordersContainer");

    function displayOrders(){

        const orders =
        JSON.parse(localStorage.getItem("orders")) || [];

        ordersContainer.innerHTML = "";

        orders.forEach(order=>{

            ordersContainer.innerHTML += `

            <div class="card">

                <h3>${order.productName}</h3>

                <p>Quantity: ${order.quantity}</p>

                <p>Total: ₱${order.total}</p>

                <p>Payment: ${order.payment}</p>

                <p class="status">
                Status: ${order.status}
                </p>

                <div class="btn-group">

                    <button
                    class="pending-btn"
                    onclick="setPending(${order.id})">
                    Pending
                    </button>

                    <button
                    class="done-btn"
                    onclick="setDone(${order.id})">
                    Done
                    </button>

                </div>

            </div>

            `;
        });

    }

    displayOrders();


    window.setPending = function(id){

        const orders =
        JSON.parse(localStorage.getItem("orders")) || [];

        const order =
        orders.find(order=>order.id===id);

        order.status = "Pending";

        localStorage.setItem(
            "orders",
            JSON.stringify(orders)
        );

        displayOrders();

    }


    window.setDone = function(id){

        let orders =
        JSON.parse(localStorage.getItem("orders")) || [];

        const history =
        JSON.parse(localStorage.getItem("history")) || [];

        const order =
        orders.find(order=>order.id===id);

        order.status = "Done";

        history.push(order);

        localStorage.setItem(
            "history",
            JSON.stringify(history)
        );

        orders =
        orders.filter(order=>order.id!==id);

        localStorage.setItem(
            "orders",
            JSON.stringify(orders)
        );

        displayOrders();

        alert("Moved to Transaction History");

    }

}
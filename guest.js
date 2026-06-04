const productContainer =
document.getElementById("productContainer");

const products =
JSON.parse(localStorage.getItem("products")) || [];

const orderPopup =
document.getElementById("orderPopup");

const confirmationPopup =
document.getElementById("confirmationPopup");

let selectedProduct = null;


// DISPLAY PRODUCTS

function displayProducts(){

    productContainer.innerHTML = "";

    products.forEach(product=>{

        if(product.status === "Available"){

            productContainer.innerHTML += `
            
            <div class="product-card">

                <h3>${product.name}</h3>

                <p>₱${product.price}</p>

                <button onclick="openOrder(${product.id})">
                    Add Order
                </button>

            </div>
            
            `;
        }

    });

}

displayProducts();


// OPEN ORDER POPUP

function openOrder(id){

    selectedProduct =
    products.find(product => product.id === id);

    document.getElementById("productName")
    .innerText = selectedProduct.name;

    document.getElementById("productPrice")
    .innerText = "Price: ₱" + selectedProduct.price;

    document.getElementById("quantity").value = 1;

    orderPopup.style.display = "flex";

}


// CANCEL

document.getElementById("cancelOrder")
.addEventListener("click",()=>{

    orderPopup.style.display = "none";

});


// CONFIRM ORDER

document.getElementById("confirmOrder")
.addEventListener("click",()=>{

    const qty =
    parseInt(document.getElementById("quantity").value);

    const total =
    qty * selectedProduct.price;

    document.getElementById("confirmationDetails")
    .innerHTML = `
    
        <p><strong>Product:</strong>
        ${selectedProduct.name}</p>

        <p><strong>Price:</strong>
        ₱${selectedProduct.price}</p>

        <p><strong>Quantity:</strong>
        ${qty}</p>

        <p><strong>Total:</strong>
        ₱${total}</p>
    
    `;

    orderPopup.style.display = "none";
    confirmationPopup.style.display = "flex";

});


// REMOVE ORDER

document.getElementById("removeOrder")
.addEventListener("click",()=>{

    confirmationPopup.style.display = "none";

});


// SUBMIT ORDER

document.getElementById("submitOrder")
.addEventListener("click",()=>{

    const qty =
    parseInt(document.getElementById("quantity").value);

    const payment =
    document.getElementById("paymentMethod").value;

    const total =
    qty * selectedProduct.price;

    const orders =
    JSON.parse(localStorage.getItem("orders")) || [];

    const order = {

        id: Date.now(),

        productName: selectedProduct.name,

        price: selectedProduct.price,

        quantity: qty,

        total: total,

        payment: payment,

        status: "Pending"

    };

    orders.push(order);

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );

    alert("Order Submitted Successfully!");

    confirmationPopup.style.display = "none";

});


// CLOSE POPUP IF CLICK OUTSIDE

window.onclick = function(event){

    if(event.target === orderPopup){
        orderPopup.style.display = "none";
    }

    if(event.target === confirmationPopup){
        confirmationPopup.style.display = "none";
    }

}
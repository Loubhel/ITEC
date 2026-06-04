// =====================
// HISTORY PAGE
// =====================

if(document.getElementById("historyContainer")){

    const historyContainer =
    document.getElementById("historyContainer");

    function displayHistory(){

        const history =
        JSON.parse(localStorage.getItem("history")) || [];

        historyContainer.innerHTML = "";

        history.forEach(transaction=>{

            historyContainer.innerHTML += `

            <div class="card">

                <h3>${transaction.productName}</h3>

                <p>Quantity:
                ${transaction.quantity}</p>

                <p>Total:
                ₱${transaction.total}</p>

                <p>Payment:
                ${transaction.payment}</p>

                <button
                class="delete-btn"
                onclick="deleteHistory(${transaction.id})">

                Delete

                </button>

            </div>

            `;

        });

    }

    displayHistory();


    window.deleteHistory = function(id){

        let history =
        JSON.parse(localStorage.getItem("history")) || [];

        const archive =
        JSON.parse(localStorage.getItem("archive")) || [];

        const transaction =
        history.find(item=>item.id===id);

        archive.push(transaction);

        localStorage.setItem(
            "archive",
            JSON.stringify(archive)
        );

        history =
        history.filter(item=>item.id!==id);

        localStorage.setItem(
            "history",
            JSON.stringify(history)
        );

        displayHistory();

        alert("Moved to Archive");

    }

}



// =====================
// ARCHIVE PAGE
// =====================

if(document.getElementById("archiveContainer")){

    const archiveContainer =
    document.getElementById("archiveContainer");

    function displayArchive(){

        const archive =
        JSON.parse(localStorage.getItem("archive")) || [];

        archiveContainer.innerHTML = "";

        archive.forEach(item=>{

            archiveContainer.innerHTML += `

            <div class="card">

                <h3>${item.productName}</h3>

                <p>Quantity:
                ${item.quantity}</p>

                <p>Total:
                ₱${item.total}</p>

                <p>Payment:
                ${item.payment}</p>

                <p>Status:
                Archived</p>

            </div>

            `;

        });

    }

    displayArchive();

}
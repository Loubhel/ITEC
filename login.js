// Default Admin Account

if(!localStorage.getItem("admins")){

```
const admins = [
    {
        username:"admin",
        password:"admin123"
    }
];

localStorage.setItem(
    "admins",
    JSON.stringify(admins)
);
```

}

// Guest

document.getElementById("guestBtn")
.addEventListener("click",()=>{

```
window.location.href="home.html";
```

});

// Modal

const modal =
document.getElementById("adminModal");

document.getElementById("adminBtn")
.addEventListener("click",()=>{

```
modal.style.display = "flex";
```

});

document.querySelector(".close")
.addEventListener("click",()=>{

```
modal.style.display = "none";
```

});

// Login

document.getElementById("loginAdmin")
.addEventListener("click",()=>{

```
const username =
document.getElementById("username").value;

const password =
document.getElementById("password").value;

const admins =
JSON.parse(localStorage.getItem("admins"));

const found =
admins.find(admin =>
    admin.username === username &&
    admin.password === password
);

if(found){

    window.location.href="admin.html";

}
else{

    alert("Invalid Credentials");

}
```

});

// Create Account

document.getElementById("createAdmin")
.addEventListener("click",()=>{

```
const username =
document.getElementById("username").value;

const password =
document.getElementById("password").value;

if(username === "" || password === ""){

    alert("Fill all fields");
    return;

}

const admins =
JSON.parse(localStorage.getItem("admins"));

admins.push({
    username,
    password
});

localStorage.setItem(
    "admins",
    JSON.stringify(admins)
);

alert("Admin Created");
```

});

// Delete Account

document.getElementById("deleteAdmin")
.addEventListener("click",()=>{

```
const username =
document.getElementById("username").value;

let admins =
JSON.parse(localStorage.getItem("admins"));

admins =
admins.filter(
    admin => admin.username !== username
);

localStorage.setItem(
    "admins",
    JSON.stringify(admins)
);

alert("Admin Deleted");
```

});

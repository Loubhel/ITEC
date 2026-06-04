const modal = document.getElementById("adminModal");
const guestBtn = document.getElementById("guestBtn");
const adminBtn = document.getElementById("adminBtn");

if (guestBtn) {
    guestBtn.addEventListener("click", () => {
        window.location.href = "/home.html";
    });
}

if (adminBtn && modal) {
    adminBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });
}

const closeBtn = document.querySelector(".close");
if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

const loginAdminBtn = document.getElementById("loginAdmin");
if (loginAdminBtn) {
    loginAdminBtn.addEventListener("click", async () => {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (!username || !password) {
            alert("Please enter username and password");
            return;
        }

        try {
            const result = await api.post("/auth/login", { username, password });
            if (result.authenticated) {
                window.location.href = "/admin.html";
            }
        } catch (err) {
            alert(err.message || "Invalid credentials");
        }
    });
}

const createAdminBtn = document.getElementById("createAdmin");
if (createAdminBtn) {
    createAdminBtn.addEventListener("click", async () => {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (!username || !password) {
            alert("Fill all fields");
            return;
        }

        try {
            await api.post("/auth/register", { username, password });
            alert("Admin account created and saved to users.xml");
        } catch (err) {
            alert(err.message);
        }
    });
}

const deleteAdminBtn = document.getElementById("deleteAdmin");
if (deleteAdminBtn) {
    deleteAdminBtn.addEventListener("click", async () => {
        const username = document.getElementById("username").value.trim();
        if (!username) {
            alert("Enter the username to delete");
            return;
        }

        if (!confirm(`Delete user "${username}" from users.xml?`)) return;

        try {
            await api.delete(`/auth/users/${encodeURIComponent(username)}`);
            alert("User deleted from users.xml");
        } catch (err) {
            alert(err.message);
        }
    });
}
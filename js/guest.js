/** Welcome page: guest session + admin login modal */
const modal = document.getElementById("adminModal");
const guestBtn = document.getElementById("guestBtn");
const adminBtn = document.getElementById("adminBtn");
const closeModal = document.getElementById("closeModal");

function openAdminModal() {
    if (modal) modal.style.display = "flex";
}

function hideAdminModal() {
    if (modal) modal.style.display = "none";
}

async function initWelcomePage() {
    try {
        const session = await api.get("/auth/session");
        if (session.authenticated && session.role === "admin") {
            window.location.href = "/admin.html";
            return;
        }
    } catch {
        /* not logged in */
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "1") {
        openAdminModal();
    }
}

if (guestBtn) {
    guestBtn.addEventListener("click", async () => {
        const entered = prompt("Your name (optional):", "Guest");
        if (entered === null) return;
        const name = entered.trim() || "Guest";
        try {
            await api.post("/auth/guest", { name });
            window.location.href = "/menu.html";
        } catch (err) {
            alert(err.message || "Could not start guest session");
        }
    });
}

if (adminBtn) {
    adminBtn.addEventListener("click", openAdminModal);
}

if (closeModal) {
    closeModal.addEventListener("click", hideAdminModal);
}

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) hideAdminModal();
    });
}

async function doAdminLogin() {
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
}

const loginAdminBtn = document.getElementById("loginAdmin");
if (loginAdminBtn) {
    loginAdminBtn.addEventListener("click", doAdminLogin);
}

document.getElementById("password")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doAdminLogin();
});

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
            alert("Admin saved to users.xml. You can log in now.");
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
            alert("User deleted");
        } catch (err) {
            alert(err.message);
        }
    });
}

document.addEventListener("DOMContentLoaded", initWelcomePage);
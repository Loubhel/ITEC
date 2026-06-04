/** Session check and logout for admin pages */
async function requireAdmin() {
    try {
        const session = await api.get("/auth/session");
        if (!session.authenticated || session.role !== "admin") {
            window.location.href = "/guest.html?admin=1";
            return false;
        }
        const userEl = document.getElementById("adminUser");
        if (userEl) {
            userEl.textContent = `Logged in: ${session.username}`;
        }
        return true;
    } catch {
        window.location.href = "/guest.html?admin=1";
        return false;
    }
}

async function logoutAdmin(event) {
    if (event) event.preventDefault();
    try {
        await api.post("/auth/logout", {});
    } catch {
        /* continue */
    }
    window.location.href = "/guest.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
        logoutLink.addEventListener("click", logoutAdmin);
    }
});
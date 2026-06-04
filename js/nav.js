/** Updates public navigation based on guest/admin session */
async function updatePublicNav() {
    const nav = document.querySelector("nav .nav-links");
    if (!nav) return;

    let session = { authenticated: false };
    try {
        session = await api.get("/auth/session");
    } catch {
        return;
    }

    const adminLink = nav.querySelector('[data-nav="admin"]');
    const guestLabel = nav.querySelector('[data-nav="user"]');

    if (session.authenticated && session.role === "admin") {
        if (adminLink) {
            adminLink.textContent = "Admin Dashboard";
            adminLink.href = "/admin.html";
        }
        if (guestLabel) {
            guestLabel.textContent = `Staff: ${session.username}`;
            guestLabel.href = "/admin.html";
        }
    } else if (session.authenticated && session.role === "guest") {
        if (guestLabel) {
            guestLabel.textContent = `Hi, ${session.username}`;
            guestLabel.href = "/menu.html";
        }
        if (adminLink) {
            adminLink.textContent = "Staff Login";
            adminLink.href = "/guest.html?admin=1";
        }
    }
}

document.addEventListener("DOMContentLoaded", updatePublicNav);
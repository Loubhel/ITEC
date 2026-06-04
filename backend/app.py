"""
Flask server for Milk Tea Shop — serves static HTML and JSON API backed by XML files.
Run from project root: python run.py
"""

from __future__ import annotations

import os
import sys
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, redirect, request, send_from_directory, session

# Allow imports when running as script
sys.path.insert(0, str(Path(__file__).resolve().parent))
import xml_db
from xml_db import (
    DuplicateError,
    NotFoundError,
    XmlDbError,
    complete_order,
    create_order,
    create_product,
    create_user,
    delete_order,
    delete_product,
    delete_transaction,
    delete_user,
    list_orders,
    list_products,
    list_transactions,
    update_order,
    update_product,
    verify_user,
)

ROOT = Path(__file__).resolve().parent.parent
ADMIN_PAGES = {"admin.html", "orders.html", "history.html", "archive.html"}
BLOCKED_PREFIXES = ("data/", "backend/", "terminals/", "mcps/")

app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "milk-tea-xml-dev-secret-2026")


def is_admin_session() -> bool:
    return session.get("role") == "admin" and session.get("user_id") is not None


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_admin_session():
            return jsonify({"error": "Unauthorized", "authenticated": False}), 401
        return f(*args, **kwargs)

    return decorated


def _json_error(message: str, status: int = 400):
    return jsonify({"error": message}), status


# ——— Static files ———


@app.route("/")
def index():
    return redirect("/guest.html")


@app.route("/<path:path>")
def serve_static(path: str):
    if path.startswith("api/"):
        return _json_error("Not found", 404)

    if any(path.startswith(prefix) for prefix in BLOCKED_PREFIXES):
        return _json_error("Forbidden", 403)

    if path in ADMIN_PAGES and not is_admin_session():
        return redirect("/guest.html?admin=1")

    if path == "login.html":
        if is_admin_session():
            return redirect("/admin.html")
        return redirect("/guest.html?admin=1")

    target = ROOT / path
    if target.is_file():
        return send_from_directory(ROOT, path)

    html_target = ROOT / f"{path}.html" if not path.endswith(".html") else None
    if html_target and html_target.is_file():
        name = html_target.name
        if name in ADMIN_PAGES and not is_admin_session():
            return redirect("/guest.html?admin=1")
        return send_from_directory(ROOT, name)

    return _json_error("Not found", 404)


# ——— Auth API ———


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = verify_user(username, password)
    if not user:
        return _json_error("Invalid username or password", 401)

    session.clear()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["role"] = user.get("role", "admin")
    return jsonify(
        {
            "authenticated": True,
            "username": user["username"],
            "role": user.get("role", "admin"),
        }
    )


@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"authenticated": False})


@app.route("/api/auth/guest", methods=["POST"])
def api_guest():
    """Start a guest browsing session (can order; cannot access admin)."""
    session.clear()
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "Guest").strip() or "Guest"
    session["user_id"] = "guest"
    session["username"] = name
    session["role"] = "guest"
    return jsonify({"authenticated": True, "role": "guest", "username": name})


@app.route("/api/auth/session")
def api_session():
    role = session.get("role")
    if role == "admin" and session.get("user_id"):
        return jsonify(
            {
                "authenticated": True,
                "username": session.get("username"),
                "role": "admin",
            }
        )
    if role == "guest" and session.get("user_id"):
        return jsonify(
            {
                "authenticated": True,
                "username": session.get("username", "Guest"),
                "role": "guest",
            }
        )
    return jsonify({"authenticated": False})


@app.route("/api/auth/register", methods=["POST"])
def api_register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    try:
        user = create_user(username, password)
        return jsonify({"message": "User created", "user": user}), 201
    except DuplicateError as e:
        return _json_error(str(e), 409)
    except XmlDbError as e:
        return _json_error(str(e), 400)


@app.route("/api/auth/users/<username>", methods=["DELETE"])
def api_delete_user(username: str):
    try:
        delete_user(username)
        if session.get("username") == username:
            session.clear()
        return jsonify({"message": "User deleted"})
    except NotFoundError as e:
        return _json_error(str(e), 404)


# ——— Products API ———


@app.route("/api/products", methods=["GET"])
def api_list_products():
    available_only = request.args.get("available") == "true"
    return jsonify({"products": list_products(available_only=available_only)})


@app.route("/api/products", methods=["POST"])
@login_required
def api_create_product():
    data = request.get_json(silent=True) or {}
    try:
        product = create_product(
            name=data.get("name", ""),
            price=float(data.get("price", 0)),
            status=data.get("status", "Available"),
            category=data.get("category", "milktea"),
        )
        return jsonify({"product": product}), 201
    except XmlDbError as e:
        return _json_error(str(e), 400)


@app.route("/api/products/<int:product_id>", methods=["PUT"])
@login_required
def api_update_product(product_id: int):
    data = request.get_json(silent=True) or {}
    try:
        product = update_product(product_id, **data)
        return jsonify({"product": product})
    except NotFoundError as e:
        return _json_error(str(e), 404)


@app.route("/api/products/<int:product_id>", methods=["DELETE"])
@login_required
def api_delete_product(product_id: int):
    try:
        delete_product(product_id)
        return jsonify({"message": "Product deleted"})
    except NotFoundError as e:
        return _json_error(str(e), 404)


# ——— Orders API ———


@app.route("/api/orders", methods=["GET"])
@login_required
def api_list_orders():
    return jsonify({"orders": list_orders()})


@app.route("/api/orders", methods=["POST"])
def api_create_order():
    """Public: customers can place orders from the menu."""
    data = request.get_json(silent=True) or {}
    try:
        order = create_order(
            product_id=int(data.get("product_id", 0)),
            product_name=data.get("product_name", ""),
            price=float(data.get("price", 0)),
            quantity=int(data.get("quantity", 1)),
            payment=data.get("payment", "Cash"),
            status=data.get("status", "Pending"),
            customer_name=data.get("customer_name", session.get("username", "Guest")),
        )
        return jsonify({"order": order}), 201
    except XmlDbError as e:
        return _json_error(str(e), 400)


@app.route("/api/orders/<int:order_id>", methods=["PUT"])
@login_required
def api_update_order(order_id: int):
    data = request.get_json(silent=True) or {}
    try:
        if data.get("action") == "complete":
            transaction = complete_order(order_id)
            return jsonify({"transaction": transaction, "message": "Order completed"})
        order = update_order(order_id, **data)
        return jsonify({"order": order})
    except NotFoundError as e:
        return _json_error(str(e), 404)


@app.route("/api/orders/<int:order_id>", methods=["DELETE"])
@login_required
def api_delete_order(order_id: int):
    try:
        delete_order(order_id)
        return jsonify({"message": "Order deleted"})
    except NotFoundError as e:
        return _json_error(str(e), 404)


# ——— Transactions API ———


@app.route("/api/transactions", methods=["GET"])
@login_required
def api_list_transactions():
    return jsonify({"transactions": list_transactions()})


@app.route("/api/transactions/<int:transaction_id>", methods=["DELETE"])
@login_required
def api_delete_transaction(transaction_id: int):
    try:
        delete_transaction(transaction_id)
        return jsonify({"message": "Transaction deleted"})
    except NotFoundError as e:
        return _json_error(str(e), 404)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
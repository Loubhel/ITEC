"""
XML database layer using xml.etree.ElementTree (DOM-style CRUD).
All writes are atomic (temp file + rename) so data persists across restarts.
"""

from __future__ import annotations

import os
import shutil
import tempfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "xml"

FILES = {
    "users": ("users", "user"),
    "products": ("products", "product"),
    "orders": ("orders", "order"),
    "transactions": ("transactions", "transaction"),
}


class XmlDbError(Exception):
    pass


class DuplicateError(XmlDbError):
    pass


class NotFoundError(XmlDbError):
    pass


def _file_path(name: str) -> Path:
    return DATA_DIR / f"{name}.xml"


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _save_tree(tree: ET.ElementTree, path: Path) -> None:
    _ensure_data_dir()
    if hasattr(ET, "indent"):
        ET.indent(tree, space="  ")

    fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    os.close(fd)
    try:
        tree.write(tmp_path, encoding="utf-8", xml_declaration=True)
        shutil.move(tmp_path, path)
    except Exception:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise


def _load_tree(filename: str, root_tag: str) -> ET.ElementTree:
    path = _file_path(filename)
    _ensure_data_dir()
    if not path.exists():
        root = ET.Element(root_tag)
        tree = ET.ElementTree(root)
        _save_tree(tree, path)
    return ET.parse(path)


def _child_text(element: ET.Element, tag: str, default: str = "") -> str:
    child = element.find(tag)
    return child.text.strip() if child is not None and child.text else default


def _set_child(element: ET.Element, tag: str, value: Any) -> None:
    child = element.find(tag)
    if child is None:
        child = ET.SubElement(element, tag)
    child.text = str(value)


def _next_id(root: ET.Element, item_tag: str) -> int:
    ids = []
    for item in root.findall(item_tag):
        raw = item.get("id")
        if raw and raw.isdigit():
            ids.append(int(raw))
    return max(ids, default=0) + 1


def _element_to_dict(element: ET.Element) -> dict:
    data = dict(element.attrib)
    for child in element:
        if len(child) == 0:
            data[child.tag] = (child.text or "").strip()
        else:
            data[child.tag] = child.text or ""
    if "id" in data:
        try:
            data["id"] = int(data["id"])
        except ValueError:
            pass
    for key in ("price", "quantity", "total"):
        if key in data:
            try:
                data[key] = float(data[key])
            except ValueError:
                pass
    return data


# ——— Users ———


def list_users() -> list[dict]:
    root_tag, item_tag = FILES["users"]
    root = _load_tree("users", root_tag).getroot()
    return [_element_to_dict(u) for u in root.findall(item_tag)]


def get_user_by_username(username: str) -> Optional[dict]:
    username = username.strip().lower()
    for user in list_users():
        if user.get("username", "").lower() == username:
            return user
    return None


def create_user(username: str, password: str, role: str = "admin") -> dict:
    username = username.strip()
    if not username or not password:
        raise XmlDbError("Username and password are required")

    if get_user_by_username(username):
        raise DuplicateError(f"Username '{username}' already exists")

    root_tag, item_tag = FILES["users"]
    tree = _load_tree("users", root_tag)
    root = tree.getroot()
    new_id = _next_id(root, item_tag)

    user_el = ET.SubElement(root, item_tag, {"id": str(new_id)})
    _set_child(user_el, "username", username)
    _set_child(user_el, "password", password)
    _set_child(user_el, "role", role)

    _save_tree(tree, _file_path("users"))
    return _element_to_dict(user_el)


def delete_user(username: str) -> bool:
    username = username.strip()
    root_tag, item_tag = FILES["users"]
    tree = _load_tree("users", root_tag)
    root = tree.getroot()

    for user_el in root.findall(item_tag):
        if _child_text(user_el, "username") == username:
            root.remove(user_el)
            _save_tree(tree, _file_path("users"))
            return True
    raise NotFoundError(f"User '{username}' not found")


def verify_user(username: str, password: str) -> Optional[dict]:
    user = get_user_by_username(username)
    if user and user.get("password") == password:
        return user
    return None


# ——— Products ———


def list_products(available_only: bool = False) -> list[dict]:
    root_tag, item_tag = FILES["products"]
    root = _load_tree("products", root_tag).getroot()
    products = [_element_to_dict(p) for p in root.findall(item_tag)]
    if available_only:
        products = [p for p in products if p.get("status") == "Available"]
    return sorted(products, key=lambda p: p.get("id", 0))


def get_product(product_id: int) -> Optional[dict]:
    for product in list_products():
        if product.get("id") == product_id:
            return product
    return None


def create_product(
    name: str,
    price: float,
    status: str = "Available",
    category: str = "milktea",
) -> dict:
    name = name.strip()
    if not name:
        raise XmlDbError("Product name is required")

    root_tag, item_tag = FILES["products"]
    tree = _load_tree("products", root_tag)
    root = tree.getroot()
    new_id = _next_id(root, item_tag)

    product_el = ET.SubElement(root, item_tag, {"id": str(new_id)})
    _set_child(product_el, "name", name)
    _set_child(product_el, "price", f"{float(price):.2f}")
    _set_child(product_el, "status", status)
    _set_child(product_el, "category", category)

    _save_tree(tree, _file_path("products"))
    return _element_to_dict(product_el)


def update_product(product_id: int, **fields: Any) -> dict:
    root_tag, item_tag = FILES["products"]
    tree = _load_tree("products", root_tag)
    root = tree.getroot()

    for product_el in root.findall(item_tag):
        if int(product_el.get("id", 0)) == product_id:
            if "name" in fields and fields["name"]:
                _set_child(product_el, "name", str(fields["name"]).strip())
            if "price" in fields and fields["price"] is not None:
                _set_child(product_el, "price", f"{float(fields['price']):.2f}")
            if "status" in fields and fields["status"]:
                _set_child(product_el, "status", fields["status"])
            if "category" in fields and fields["category"]:
                _set_child(product_el, "category", fields["category"])
            _save_tree(tree, _file_path("products"))
            return _element_to_dict(product_el)

    raise NotFoundError(f"Product id {product_id} not found")


def delete_product(product_id: int) -> bool:
    root_tag, item_tag = FILES["products"]
    tree = _load_tree("products", root_tag)
    root = tree.getroot()

    for product_el in root.findall(item_tag):
        if int(product_el.get("id", 0)) == product_id:
            root.remove(product_el)
            _save_tree(tree, _file_path("products"))
            return True
    raise NotFoundError(f"Product id {product_id} not found")


# ——— Orders ———


def list_orders() -> list[dict]:
    root_tag, item_tag = FILES["orders"]
    root = _load_tree("orders", root_tag).getroot()
    return sorted(
        [_element_to_dict(o) for o in root.findall(item_tag)],
        key=lambda o: o.get("id", 0),
        reverse=True,
    )


def get_order(order_id: int) -> Optional[dict]:
    for order in list_orders():
        if order.get("id") == order_id:
            return order
    return None


def create_order(
    product_id: int,
    product_name: str,
    price: float,
    quantity: int,
    payment: str,
    status: str = "Pending",
    customer_name: str = "Guest",
) -> dict:
    if quantity < 1:
        raise XmlDbError("Quantity must be at least 1")

    total = round(float(price) * quantity, 2)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    root_tag, item_tag = FILES["orders"]
    tree = _load_tree("orders", root_tag)
    root = tree.getroot()
    new_id = _next_id(root, item_tag)

    order_el = ET.SubElement(root, item_tag, {"id": str(new_id)})
    _set_child(order_el, "product_id", product_id)
    _set_child(order_el, "product_name", product_name)
    _set_child(order_el, "price", f"{float(price):.2f}")
    _set_child(order_el, "quantity", quantity)
    _set_child(order_el, "total", f"{total:.2f}")
    _set_child(order_el, "payment", payment)
    _set_child(order_el, "status", status)
    _set_child(order_el, "customer_name", customer_name.strip() or "Guest")
    _set_child(order_el, "created_at", now)

    _save_tree(tree, _file_path("orders"))
    return _element_to_dict(order_el)


def update_order(order_id: int, **fields: Any) -> dict:
    root_tag, item_tag = FILES["orders"]
    tree = _load_tree("orders", root_tag)
    root = tree.getroot()

    for order_el in root.findall(item_tag):
        if int(order_el.get("id", 0)) == order_id:
            if "status" in fields and fields["status"]:
                _set_child(order_el, "status", fields["status"])
            if "quantity" in fields:
                qty = int(fields["quantity"])
                price = float(_child_text(order_el, "price", "0"))
                _set_child(order_el, "quantity", qty)
                _set_child(order_el, "total", f"{price * qty:.2f}")
            if "payment" in fields:
                _set_child(order_el, "payment", fields["payment"])
            _save_tree(tree, _file_path("orders"))
            return _element_to_dict(order_el)

    raise NotFoundError(f"Order id {order_id} not found")


def delete_order(order_id: int) -> bool:
    root_tag, item_tag = FILES["orders"]
    tree = _load_tree("orders", root_tag)
    root = tree.getroot()

    for order_el in root.findall(item_tag):
        if int(order_el.get("id", 0)) == order_id:
            root.remove(order_el)
            _save_tree(tree, _file_path("orders"))
            return True
    raise NotFoundError(f"Order id {order_id} not found")


def complete_order(order_id: int) -> dict:
    """Move order to transactions.xml and remove from orders.xml."""
    order = get_order(order_id)
    if not order:
        raise NotFoundError(f"Order id {order_id} not found")

    transaction = create_transaction(
        order_id=order_id,
        product_id=int(order.get("product_id", 0)),
        product_name=order.get("product_name", ""),
        price=float(order.get("price", 0)),
        quantity=int(order.get("quantity", 1)),
        total=float(order.get("total", 0)),
        payment=order.get("payment", ""),
        customer_name=order.get("customer_name", "Guest"),
        status="Completed",
    )
    delete_order(order_id)
    return transaction


# ——— Transactions ———


def list_transactions() -> list[dict]:
    root_tag, item_tag = FILES["transactions"]
    root = _load_tree("transactions", root_tag).getroot()
    return sorted(
        [_element_to_dict(t) for t in root.findall(item_tag)],
        key=lambda t: t.get("id", 0),
        reverse=True,
    )


def create_transaction(
    order_id: int,
    product_id: int,
    product_name: str,
    price: float,
    quantity: int,
    total: float,
    payment: str,
    customer_name: str = "Guest",
    status: str = "Completed",
) -> dict:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    root_tag, item_tag = FILES["transactions"]
    tree = _load_tree("transactions", root_tag)
    root = tree.getroot()
    new_id = _next_id(root, item_tag)

    tx_el = ET.SubElement(root, item_tag, {"id": str(new_id)})
    _set_child(tx_el, "order_id", order_id)
    _set_child(tx_el, "product_id", product_id)
    _set_child(tx_el, "product_name", product_name)
    _set_child(tx_el, "price", f"{float(price):.2f}")
    _set_child(tx_el, "quantity", quantity)
    _set_child(tx_el, "total", f"{float(total):.2f}")
    _set_child(tx_el, "payment", payment)
    _set_child(tx_el, "customer_name", customer_name.strip() or "Guest")
    _set_child(tx_el, "status", status)
    _set_child(tx_el, "completed_at", now)

    _save_tree(tree, _file_path("transactions"))
    return _element_to_dict(tx_el)


def delete_transaction(transaction_id: int) -> bool:
    root_tag, item_tag = FILES["transactions"]
    tree = _load_tree("transactions", root_tag)
    root = tree.getroot()

    for tx_el in root.findall(item_tag):
        if int(tx_el.get("id", 0)) == transaction_id:
            root.remove(tx_el)
            _save_tree(tree, _file_path("transactions"))
            return True
    raise NotFoundError(f"Transaction id {transaction_id} not found")
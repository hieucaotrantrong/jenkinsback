from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from .db import engine, init_db
import os
from typing import List

app = FastAPI(title="Demo API (FastAPI + Postgres)")

# CORS cho phép frontend (Vite dev server) gọi API
origins = [
    os.getenv("CORS_ORIGINS", "http://localhost:5173"),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class ItemIn(BaseModel):
    title: str

class CartItem(BaseModel):
    item_id: int
    quantity: int = 1

class CartIn(BaseModel):
    items: List[CartItem]

# --- Events ---
@app.on_event("startup")
def on_startup():
    init_db()

# --- API Endpoints ---
@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/items")
def list_items():
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT id, title FROM items ORDER BY id DESC")).mappings().all()
        return {"items": list(rows)}

@app.post("/api/items", status_code=201)
def create_item(item: ItemIn):
    if not item.title.strip():
        raise HTTPException(status_code=400, detail="Title is required.")
    with engine.begin() as conn:
        conn.execute(text("INSERT INTO items(title) VALUES(:t)"), {"t": item.title})
    return {"message": "created"}

@app.post("/api/cart/checkout")
def checkout(cart: CartIn):
    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty.")
    
    with engine.begin() as conn:
        # Tạo đơn hàng mới và lấy ID
        # Dùng RETURNING cho Postgres, lastrowid cho SQLite
        if engine.dialect.name == "postgresql":
            res = conn.execute(text("INSERT INTO orders DEFAULT VALUES RETURNING id"))
            order_id = res.scalar_one()
        else: # SQLite
            res = conn.execute(text("INSERT INTO orders (created_at) VALUES (CURRENT_TIMESTAMP)"))
            order_id = res.lastrowid

        # Chuẩn bị các item trong giỏ hàng để insert
        items_to_insert = [
            {"order_id": order_id, "item_id": i.item_id, "quantity": i.quantity}
            for i in cart.items
        ]
        # Insert tất cả item vào bảng order_items
        conn.execute(
            text("INSERT INTO order_items(order_id, item_id, quantity) VALUES (:order_id, :item_id, :quantity)"),
            items_to_insert
        )

    return {"message": "Purchase successful", "order_id": order_id}

@app.get("/api/orders")
def list_orders():
    with engine.connect() as conn:
        # Lấy tất cả đơn hàng
        orders_rows = conn.execute(text("SELECT id, created_at FROM orders ORDER BY id DESC")).mappings().all()
        result = []
        for o in orders_rows:
            # Với mỗi đơn hàng, lấy các sản phẩm tương ứng
            items_rows = conn.execute(
                text("SELECT oi.item_id, i.title, oi.quantity FROM order_items oi JOIN items i ON i.id = oi.item_id WHERE oi.order_id = :oid"),
                {"oid": o["id"]}
            ).mappings().all()
            result.append({
                "order_id": o["id"],
                "created_at": o["created_at"].isoformat() if hasattr(o["created_at"], 'isoformat') else str(o["created_at"]),
                "items": [dict(i) for i in items_rows]
            })
        return {"orders": result}
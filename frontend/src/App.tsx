import React, { useEffect, useState } from "react";
import './App.css'; // Tạo file App.css để style cho đẹp

// --- Type Definitions ---
type Item = { id: number; title: string };
type CartItem = { item_id: number; quantity: number };
type OrderItem = { item_id: number; title: string; quantity: number };
type Order = { order_id: number; created_at: string; items: OrderItem[] };

const API_BASE = ""; // Sửa dòng này: Bỏ "http://localhost:8000"

// --- Main App Component ---
export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Data Fetching ---
  async function refreshAll() {
    // Fetch products
    fetch(`${API_BASE}/api/items`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(j => setItems(j.items || []))
      .catch(() => console.error("Failed to fetch items."));

    // Fetch orders
    fetch(`${API_BASE}/api/orders`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(j => setOrders(j.orders || []))
      .catch(() => console.error("Failed to fetch orders."));
  }

  useEffect(() => {
    refreshAll();
  }, []);

  // --- Cart & Checkout Logic ---
  function addToCart(item: Item) {
    setCart(currentCart => {
      const existing = currentCart.find(ci => ci.item_id === item.id);
      if (existing) {
        return currentCart.map(ci =>
          ci.item_id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...currentCart, { item_id: item.id, quantity: 1 }];
    });
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cart/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Mua hàng thành công! Mã đơn hàng: ${data.order_id}`);
        setCart([]); // Clear cart
        refreshAll(); // Refresh orders list
      } else {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        alert(`Lỗi: ${err.detail}`);
      }
    } catch (e) {
      alert("Lỗi kết nối đến server.");
    } finally {
      setLoading(false);
    }
  }

  // --- Render ---
  return (
    <>
      <div className="card">
        <h2>Sản phẩm</h2>
        <div className="grid">
          {items.map(it => (
            <div key={it.id} className="item-card">
              <div className="item-title">{it.title}</div>
              <button onClick={() => addToCart(it)}>Thêm vào giỏ</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Giỏ hàng</h2>
        {cart.length === 0 ? (
          <p>Giỏ hàng trống</p>
        ) : (
          <>
            {cart.map(ci => {
              const item = items.find(it => it.id === ci.item_id);
              return (
                <div key={ci.item_id} className="cart-item">
                  <span>{item?.title || `Item #${ci.item_id}`}</span>
                  <span>Số lượng: {ci.quantity}</span>
                </div>
              );
            })}
            <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
              {loading ? "Đang xử lý..." : "Thanh toán"}
            </button>
          </>
        )}
      </div>

      <div className="card">
        <h2>Lịch sử mua hàng</h2>
        {orders.length === 0 ? (
          <p>Chưa có đơn hàng nào.</p>
        ) : (
          orders.map(order => {
            // Kiểm tra chắc chắn rằng 'order' và 'order.items' tồn tại
            if (!order || !order.items) {
              return null; // Bỏ qua nếu dữ liệu không hợp lệ
            }
            return (
              <div key={order.order_id} className="order-card">
                <h3>Đơn hàng #{order.order_id} - <small>{new Date(order.created_at).toLocaleString()}</small></h3>
                <ul>
                  {order.items.map(item => (
                    // Dùng item.item_id trực tiếp vì đã kiểm tra ở trên
                    <li key={item.item_id}>{item.title} (x{item.quantity})</li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
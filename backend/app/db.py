import os
from sqlalchemy import create_engine, text, MetaData, Table, Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.exc import OperationalError

# Nếu bạn muốn dùng Postgres, set env DATABASE_URL (ví dụ postgresql://user:pass@host:port/db)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Dùng Postgres nếu được cấu hình
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    # Fallback: dùng file SQLite local trong thư mục backend
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_file = os.path.join(base_dir, "data.db")
    DATABASE_URL = f"sqlite:///{db_file}"
    # check_same_thread=False để tiện cho dev server
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Định nghĩa bảng (dùng chung cho cả SQLite và Postgres)
metadata = MetaData()

items = Table(
    "items", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("title", String(200), nullable=False),
)

orders = Table(
    "orders", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("created_at", DateTime, server_default=func.now()),
)

order_items = Table(
    "order_items", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("order_id", Integer, ForeignKey("orders.id", ondelete="CASCADE")),
    Column("item_id", Integer, ForeignKey("items.id")),
    Column("quantity", Integer, nullable=False, default=1),
)

def init_db():
    """Tạo các bảng nếu chưa có."""
    try:
        metadata.create_all(engine)
        # Thêm 2 sản phẩm mẫu nếu bảng items rỗng
        with engine.begin() as conn:
            count = conn.execute(text("SELECT count(1) FROM items")).scalar()
            if count == 0:
                conn.execute(items.insert(), [{"title": "Sản phẩm A"}, {"title": "Sản phẩm B"}])
    except OperationalError as e:
        print(f"Lỗi khởi tạo DB: {e}")
        raise
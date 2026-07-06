import sys
import os  # Thêm thư viện này để đọc môi trường
from pathlib import Path

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import pool, create_engine
from sqlalchemy.engine import Connection

sys.path.append(str(Path(__file__).parents[1]))
load_dotenv()

config = context.config

if config.config_file_name is not None:
    from logging.config import fileConfig
    fileConfig(config.config_file_name)

from app.core.database import Base
from app.models import *

target_metadata = Base.metadata

# Hàm phụ trợ lấy URL từ file .env, nếu không có mới lấy trong alembic.ini
def get_url():
    return os.getenv("ALEMBIC_DATABASE_URL", config.get_main_option("sqlalchemy.url"))

def run_migrations_offline() -> None:
    url = get_url()  # Đổi ở đây
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    url = get_url()  # Đổi ở đây
    connectable = create_engine(url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
from sqlmodel import SQLModel, Session, create_engine

DATABASE_URL = "sqlite:///./atrium.db"

# check_same_thread=False нужен только для SQLite + FastAPI (несколько потоков)
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def init_db() -> None:
    """Создаёт таблицы, если их ещё нет. Вызывается при старте приложения."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency для FastAPI: выдаёт сессию БД на время запроса."""
    with Session(engine) as session:
        yield session

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, declarative_base, sessionmaker, with_loader_criteria

from app.config import settings
from app.models.ownership import UserOwnedMixin


connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


@event.listens_for(Session, "do_orm_execute")
def _apply_user_scope(execute_state):
    """Automatically scope ORM SELECT statements to the authenticated user."""

    if not execute_state.is_select:
        return

    if execute_state.is_column_load or execute_state.is_relationship_load:
        return

    if execute_state.session.info.get("skip_user_scope"):
        return

    user_id = execute_state.session.info.get("user_id")
    if user_id is None:
        return

    execute_state.statement = execute_state.statement.options(
        with_loader_criteria(
            UserOwnedMixin,
            lambda owned: owned.user_id == user_id,
            include_aliases=True,
        )
    )


@event.listens_for(Session, "before_flush")
def _stamp_new_records_with_owner(session, _flush_context, _instances):
    """Attach the authenticated user's ID to every new owned record."""

    user_id = session.info.get("user_id")

    for item in session.new:
        if not isinstance(item, UserOwnedMixin):
            continue

        if getattr(item, "user_id", None) is not None:
            continue

        if user_id is None:
            raise RuntimeError(
                "Cannot save a user-owned record without an authenticated "
                "user bound to the database session."
            )

        item.user_id = user_id


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import declared_attr


class UserOwnedMixin:
    """Adds mandatory user ownership to persisted Digital Twin records."""

    @declared_attr
    def user_id(cls):
        return Column(
            Integer,
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )

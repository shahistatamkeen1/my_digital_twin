from __future__ import annotations

from sqlalchemy import Column, Float, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from starlette.requests import Request
from starlette.responses import Response

from app.api.pagination import (
    SortOrder,
    apply_sort,
    apply_text_search,
    paginate_query,
    paginate_sequence,
)


Base = declarative_base()


class SampleRecord(Base):
    __tablename__ = "phase4c_sample_records"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    amount = Column(Float, nullable=False)


def _request(query_string: str = "") -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "scheme": "http",
            "server": ("testserver", 80),
            "path": "/api/v1/samples",
            "raw_path": b"/api/v1/samples",
            "query_string": query_string.encode("utf-8"),
            "headers": [],
        }
    )


def run_smoke_test() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        db.add_all(
            [
                SampleRecord(name="Alpha Role", status="Applied", amount=10),
                SampleRecord(name="Beta Role", status="Saved", amount=20),
                SampleRecord(name="Gamma Role", status="Applied", amount=30),
                SampleRecord(name="Alpha Course", status="Applied", amount=40),
                SampleRecord(name="Delta Role", status="Rejected", amount=50),
            ]
        )
        db.commit()

        query = db.query(SampleRecord)
        query = apply_text_search(query, "alpha", (SampleRecord.name,))
        query = query.filter(SampleRecord.status == "Applied")
        query = apply_sort(
            query,
            SampleRecord,
            sort_by="amount",
            sort_order=SortOrder.desc,
            allowed_fields=("id", "name", "status", "amount"),
            default_field="id",
        )

        response = Response()
        result = paginate_query(
            query,
            request=_request("page=1&page_size=1"),
            response=response,
            page=1,
            page_size=1,
            sort_by="amount",
            sort_order=SortOrder.desc,
        )

        assert isinstance(result, dict)
        assert result["pagination"]["total_items"] == 2
        assert result["pagination"]["total_pages"] == 2
        assert result["items"][0].amount == 40
        assert response.headers["X-Total-Count"] == "2"
        assert response.headers["X-Pagination-Mode"] == "page"
        assert 'rel="next"' in response.headers["Link"]

        legacy_response = Response()
        legacy_result = paginate_query(
            query,
            request=_request(),
            response=legacy_response,
            page=None,
            page_size=None,
            sort_by="amount",
            sort_order=SortOrder.desc,
        )

        assert isinstance(legacy_result, list)
        assert len(legacy_result) == 2
        assert legacy_response.headers["X-Pagination-Mode"] == "legacy"

        sequence_response = Response()
        sequence = paginate_sequence(
            [{"id": index} for index in range(5)],
            request=_request("page=2&page_size=2"),
            response=sequence_response,
            page=2,
            page_size=2,
        )

        assert isinstance(sequence, dict)
        assert [item["id"] for item in sequence["items"]] == [2, 3]
        assert sequence["pagination"]["has_next"] is True
        assert sequence["pagination"]["has_previous"] is True

    finally:
        db.close()
        engine.dispose()

    print("Phase 4C pagination, filtering, search, and sorting smoke test passed.")


if __name__ == "__main__":
    run_smoke_test()

from __future__ import annotations

import math
from dataclasses import dataclass
from enum import Enum
from typing import Any, Iterable, Sequence

from fastapi import Request, Response
from sqlalchemy import or_
from sqlalchemy.orm import Query

from app.config import settings


PAGINATION_HEADERS = (
    "X-Total-Count",
    "X-Page",
    "X-Page-Size",
    "X-Total-Pages",
    "X-Pagination-Mode",
    "X-Sort-By",
    "X-Sort-Order",
    "Link",
)


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


@dataclass(frozen=True)
class PaginationMeta:
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool

    def as_dict(self) -> dict[str, int | bool]:
        return {
            "page": self.page,
            "page_size": self.page_size,
            "total_items": self.total_items,
            "total_pages": self.total_pages,
            "has_next": self.has_next,
            "has_previous": self.has_previous,
        }


def pagination_requested(
    page: int | None,
    page_size: int | None,
) -> bool:
    return page is not None or page_size is not None


def _escape_like(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
    )


def apply_text_search(
    query: Query,
    search: str | None,
    columns: Iterable[Any],
) -> Query:
    normalized = (search or "").strip()
    if not normalized:
        return query

    pattern = f"%{_escape_like(normalized)}%"
    predicates = [
        column.ilike(pattern, escape="\\")
        for column in columns
        if column is not None
    ]

    if predicates:
        query = query.filter(or_(*predicates))

    return query


def apply_sort(
    query: Query,
    model: Any,
    *,
    sort_by: str,
    sort_order: SortOrder,
    allowed_fields: Sequence[str],
    default_field: str,
) -> Query:
    resolved_field = (
        sort_by
        if sort_by in allowed_fields and hasattr(model, sort_by)
        else default_field
    )
    column = getattr(model, resolved_field)
    ordering = column.asc() if sort_order == SortOrder.asc else column.desc()

    query = query.order_by(ordering)

    if resolved_field != "id" and hasattr(model, "id"):
        query = query.order_by(
            model.id.asc()
            if sort_order == SortOrder.asc
            else model.id.desc()
        )

    return query


def _page_link(
    request: Request,
    *,
    page: int,
    page_size: int,
) -> str:
    return str(
        request.url.include_query_params(
            page=str(page),
            page_size=str(page_size),
        )
    )


def _set_pagination_headers(
    response: Response,
    request: Request,
    meta: PaginationMeta,
    *,
    paginated: bool,
    sort_by: str | None = None,
    sort_order: SortOrder | None = None,
) -> None:
    response.headers["X-Total-Count"] = str(meta.total_items)
    response.headers["X-Page"] = str(meta.page)
    response.headers["X-Page-Size"] = str(meta.page_size)
    response.headers["X-Total-Pages"] = str(meta.total_pages)
    response.headers["X-Pagination-Mode"] = (
        "page" if paginated else "legacy"
    )

    if sort_by:
        response.headers["X-Sort-By"] = sort_by
    if sort_order:
        response.headers["X-Sort-Order"] = sort_order.value

    links: list[str] = []

    if meta.has_previous:
        links.append(
            f'<{_page_link(request, page=meta.page - 1, page_size=meta.page_size)}>'
            '; rel="prev"'
        )
    if meta.has_next:
        links.append(
            f'<{_page_link(request, page=meta.page + 1, page_size=meta.page_size)}>'
            '; rel="next"'
        )

    if links:
        response.headers["Link"] = ", ".join(links)


def paginate_query(
    query: Query,
    *,
    request: Request,
    response: Response,
    page: int | None,
    page_size: int | None,
    sort_by: str | None = None,
    sort_order: SortOrder | None = None,
    legacy_limit: int | None = None,
) -> list[Any] | dict[str, Any]:
    total_items = query.order_by(None).count()
    use_pagination = pagination_requested(page, page_size)

    if not use_pagination:
        items_query = query
        if legacy_limit is not None:
            items_query = items_query.limit(legacy_limit)
        items = items_query.all()
        displayed_count = len(items)
        effective_page_size = displayed_count or (
            legacy_limit or settings.api_default_page_size
        )
        total_pages = (
            math.ceil(total_items / effective_page_size)
            if total_items > 0
            else 0
        )
        meta = PaginationMeta(
            page=1,
            page_size=displayed_count,
            total_items=total_items,
            total_pages=total_pages,
            has_next=(
                legacy_limit is not None and total_items > displayed_count
            ),
            has_previous=False,
        )
        _set_pagination_headers(
            response,
            request,
            meta,
            paginated=False,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return items

    resolved_page = page or 1
    resolved_page_size = page_size or settings.api_default_page_size
    resolved_page_size = min(
        resolved_page_size,
        settings.api_max_page_size,
    )
    total_pages = (
        math.ceil(total_items / resolved_page_size)
        if total_items > 0
        else 0
    )
    offset = (resolved_page - 1) * resolved_page_size
    items = query.offset(offset).limit(resolved_page_size).all()

    meta = PaginationMeta(
        page=resolved_page,
        page_size=resolved_page_size,
        total_items=total_items,
        total_pages=total_pages,
        has_next=resolved_page < total_pages,
        has_previous=resolved_page > 1,
    )
    _set_pagination_headers(
        response,
        request,
        meta,
        paginated=True,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    return {
        "items": items,
        "pagination": meta.as_dict(),
    }


def paginate_sequence(
    items: Sequence[Any],
    *,
    request: Request,
    response: Response,
    page: int | None,
    page_size: int | None,
    sort_by: str | None = None,
    sort_order: SortOrder | None = None,
) -> list[Any] | dict[str, Any]:
    total_items = len(items)
    use_pagination = pagination_requested(page, page_size)

    if not use_pagination:
        meta = PaginationMeta(
            page=1,
            page_size=total_items,
            total_items=total_items,
            total_pages=1 if total_items > 0 else 0,
            has_next=False,
            has_previous=False,
        )
        _set_pagination_headers(
            response,
            request,
            meta,
            paginated=False,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return list(items)

    resolved_page = page or 1
    resolved_page_size = page_size or settings.api_default_page_size
    resolved_page_size = min(
        resolved_page_size,
        settings.api_max_page_size,
    )
    total_pages = (
        math.ceil(total_items / resolved_page_size)
        if total_items > 0
        else 0
    )
    start = (resolved_page - 1) * resolved_page_size
    end = start + resolved_page_size
    page_items = list(items[start:end])

    meta = PaginationMeta(
        page=resolved_page,
        page_size=resolved_page_size,
        total_items=total_items,
        total_pages=total_pages,
        has_next=resolved_page < total_pages,
        has_previous=resolved_page > 1,
    )
    _set_pagination_headers(
        response,
        request,
        meta,
        paginated=True,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    return {
        "items": page_items,
        "pagination": meta.as_dict(),
    }

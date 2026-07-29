import pytest

from app.migrations.phase4c_smoke_test import run_smoke_test


@pytest.mark.contract
def test_phase4c_collection_queries() -> None:
    run_smoke_test()

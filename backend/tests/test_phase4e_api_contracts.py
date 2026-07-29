import pytest

from app.migrations.phase4e_smoke_test import run_smoke_test


@pytest.mark.contract
def test_phase4e_api_contracts() -> None:
    run_smoke_test()

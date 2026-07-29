import pytest


from app.migrations.phase4d_smoke_test import run_smoke_test


@pytest.mark.contract
def test_phase4d_monitoring() -> None:
    run_smoke_test()

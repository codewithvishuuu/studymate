import pytest

from app.core import db
from app.core.config import settings


@pytest.fixture(autouse=True)
def _tmp_data_dir(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "data_dir", str(tmp_path))
    db.init_db()

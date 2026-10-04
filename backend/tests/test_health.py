from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_unknown_route_envelope():
    r = client.get("/api/does-not-exist")
    assert r.status_code == 404
    assert "error" in r.json()

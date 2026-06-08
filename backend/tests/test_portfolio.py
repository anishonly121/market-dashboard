"""
Portfolio CRUD tests — no external API calls needed.
"""

from unittest.mock import patch


def test_list_portfolios_empty(client):
    r = client.get("/api/portfolios")
    assert r.status_code == 200
    assert r.json() == []


def test_create_portfolio(client):
    r = client.post("/api/portfolios", json={"name": "My Portfolio", "description": "Test"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "My Portfolio"
    assert data["description"] == "Test"
    assert data["id"] >= 1
    assert data["holdings"] == []


def test_create_portfolio_with_holdings(client):
    payload = {
        "name": "Tech Portfolio",
        "description": "",
        "holdings": [
            {"ticker": "AAPL", "shares": 10, "avg_cost": 150.0},
            {"ticker": "MSFT", "shares": 5,  "avg_cost": 300.0},
        ],
    }
    r = client.post("/api/portfolios", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert len(data["holdings"]) == 2
    tickers = {h["ticker"] for h in data["holdings"]}
    assert tickers == {"AAPL", "MSFT"}


def test_get_portfolio(client):
    create_r = client.post("/api/portfolios", json={"name": "P1"})
    pid = create_r.json()["id"]
    r = client.get(f"/api/portfolios/{pid}")
    assert r.status_code == 200
    assert r.json()["id"] == pid


def test_get_portfolio_not_found(client):
    r = client.get("/api/portfolios/9999")
    assert r.status_code == 404


def test_update_portfolio_name(client):
    pid = client.post("/api/portfolios", json={"name": "Old Name"}).json()["id"]
    r = client.put(f"/api/portfolios/{pid}", json={"name": "New Name"})
    assert r.status_code == 200
    assert r.json()["name"] == "New Name"


def test_delete_portfolio(client):
    pid = client.post("/api/portfolios", json={"name": "To Delete"}).json()["id"]
    r = client.delete(f"/api/portfolios/{pid}")
    assert r.status_code == 204
    assert client.get(f"/api/portfolios/{pid}").status_code == 404


def test_add_holding(client):
    pid = client.post("/api/portfolios", json={"name": "P"}).json()["id"]
    r = client.post(f"/api/portfolios/{pid}/holdings",
                    json={"ticker": "nvda", "shares": 3, "avg_cost": 400.0})
    assert r.status_code == 201
    data = r.json()
    assert data["ticker"] == "NVDA"   # auto-uppercased
    assert data["shares"] == 3.0


def test_add_holding_upserts(client):
    pid = client.post("/api/portfolios", json={"name": "P"}).json()["id"]
    client.post(f"/api/portfolios/{pid}/holdings",
                json={"ticker": "AAPL", "shares": 5, "avg_cost": 150.0})
    # Update same ticker
    r = client.post(f"/api/portfolios/{pid}/holdings",
                    json={"ticker": "AAPL", "shares": 10, "avg_cost": 160.0})
    assert r.status_code == 201
    assert r.json()["shares"] == 10.0
    # Should still be one AAPL holding
    p = client.get(f"/api/portfolios/{pid}").json()
    aapl = [h for h in p["holdings"] if h["ticker"] == "AAPL"]
    assert len(aapl) == 1


def test_remove_holding(client):
    pid = client.post("/api/portfolios", json={"name": "P"}).json()["id"]
    hid = client.post(f"/api/portfolios/{pid}/holdings",
                      json={"ticker": "TSLA", "shares": 2, "avg_cost": 200.0}).json()["id"]
    r = client.delete(f"/api/portfolios/{pid}/holdings/{hid}")
    assert r.status_code == 204


def test_remove_holding_not_found(client):
    pid = client.post("/api/portfolios", json={"name": "P"}).json()["id"]
    r = client.delete(f"/api/portfolios/{pid}/holdings/9999")
    assert r.status_code == 404


def test_portfolio_value(client):
    pid = client.post("/api/portfolios", json={"name": "P"}).json()["id"]
    client.post(f"/api/portfolios/{pid}/holdings",
                json={"ticker": "AAPL", "shares": 10, "avg_cost": 100.0})

    with patch("app.routers.portfolio.get_current_price", return_value=150.0):
        r = client.get(f"/api/portfolios/{pid}/value")

    assert r.status_code == 200
    data = r.json()
    assert data["total_value"] == pytest.approx(1500.0)
    assert data["total_cost"]  == pytest.approx(1000.0)
    assert data["total_pnl"]   == pytest.approx(500.0)
    assert data["total_pnl_pct"] == pytest.approx(50.0)


import pytest

"""Confirms the per-IP rate limit on auth endpoints actually trips (20
requests/minute allowed, the 21st rejected with 429) and that it doesn't
leak onto unrelated routes."""


async def test_login_is_rate_limited_after_twenty_attempts(client):
    payload = {"email": "nobody@example.com", "password": "wrong"}
    statuses = []
    for _ in range(22):
        r = await client.post("/api/auth/login", json=payload)
        statuses.append(r.status_code)
    assert statuses[:20] == [401] * 20
    assert statuses[20] == 429
    assert statuses[21] == 429


async def test_register_is_rate_limited_after_twenty_attempts(client):
    statuses = []
    for i in range(22):
        r = await client.post(
            "/api/auth/register",
            json={
                "email": f"spam{i}@example.com",
                "password": "password123",
                "name": "Spam",
            },
        )
        statuses.append(r.status_code)
    assert 429 in statuses
    assert statuses.index(429) == 20


async def test_unrelated_endpoint_is_not_rate_limited(client):
    for _ in range(10):
        r = await client.get("/api/")
        assert r.status_code == 200

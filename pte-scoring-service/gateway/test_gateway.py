import unittest
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
from fastapi.testclient import TestClient

import app as gateway


class GatewayTests(unittest.TestCase):
    def setUp(self):
        self.token = patch.object(gateway, "SHARED_TOKEN", "test-only-token")
        self.token.start()
        self.addCleanup(self.token.stop)
        self.client = TestClient(gateway.app)
        self.headers = {"Authorization": "Bearer test-only-token"}
        self.payload = {"promptText": "Discuss education.", "text": "Education matters."}

    def test_missing_token_fails_closed(self):
        with patch.object(gateway, "SHARED_TOKEN", None):
            response = self.client.post("/score/writing", json=self.payload, headers=self.headers)
        self.assertEqual(response.status_code, 503)

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.post("/score/writing", json=self.payload)
        self.assertEqual(response.status_code, 401)

    def test_oversized_text_is_rejected(self):
        response = self.client.post("/score/writing", json={**self.payload, "text": "x" * 8001}, headers=self.headers)
        self.assertEqual(response.status_code, 422)

    def upstream(self, result=None, error=None):
        response = MagicMock()
        response.json.return_value = result
        client = AsyncMock()
        client.post = AsyncMock(return_value=response, side_effect=error)
        manager = AsyncMock()
        manager.__aenter__.return_value = client
        return patch.object(gateway.httpx, "AsyncClient", return_value=manager)

    def test_service_failure_does_not_produce_full_marks(self):
        with self.upstream(error=httpx.ConnectError("test outage")):
            response = self.client.post("/score/writing", json=self.payload, headers=self.headers)
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("grammarScore", response.json())

    def test_invalid_service_response_is_rejected(self):
        for result in ({}, [], {"matches": ["invalid"]}):
            with self.subTest(result=result), self.upstream(result):
                response = self.client.post("/score/writing", json=self.payload, headers=self.headers)
            self.assertEqual(response.status_code, 503)

    def test_successful_empty_issue_list_is_valid(self):
        with self.upstream({"matches": []}):
            response = self.client.post("/score/writing", json=self.payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["grammarScore"], 1)


if __name__ == "__main__":
    unittest.main()

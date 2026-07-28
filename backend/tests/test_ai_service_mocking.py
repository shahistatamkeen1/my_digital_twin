from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.services import ai_service


class FakeCompletions:
    def __init__(self, content: str):
        self.content = content
        self.calls: list[dict] = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content=self.content),
                )
            ]
        )


class FakeOpenAIClient:
    def __init__(self, content: str):
        self.completions = FakeCompletions(content)
        self.chat = SimpleNamespace(completions=self.completions)


@pytest.mark.unit
def test_ask_ai_uses_a_mocked_client_without_network(monkeypatch) -> None:
    fake_client = FakeOpenAIClient("A safe mocked response")
    monkeypatch.setattr(ai_service, "_client", fake_client)

    result = ai_service.ask_ai("system", "user", temperature=0.1)

    assert result == "A safe mocked response"
    assert len(fake_client.completions.calls) == 1
    assert fake_client.completions.calls[0]["model"]


@pytest.mark.unit
def test_ask_ai_json_parses_mocked_json(monkeypatch) -> None:
    fake_client = FakeOpenAIClient('{"score": 91, "status": "ready"}')
    monkeypatch.setattr(ai_service, "_client", fake_client)

    result = ai_service.ask_ai_json("system", "user")

    assert result == {"score": 91, "status": "ready"}
    assert fake_client.completions.calls[0]["response_format"] == {
        "type": "json_object"
    }

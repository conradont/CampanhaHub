import secrets

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_secret_key_is_required():
    assert Settings.model_fields["secret_key"].is_required()


@pytest.mark.parametrize(
    "secret_key",
    [
        "short",
        "a" * 42,
        "altere-esta-chave-em-producao",
        "campanhahub-dev-secret-altere-em-producao",
        "gere-uma-chave-longa-e-aleatoria",
    ],
)
def test_secret_key_rejects_short_or_example_values(secret_key):
    with pytest.raises(ValidationError):
        Settings(secret_key=secret_key, _env_file=None)


def test_secret_key_accepts_long_custom_value():
    secret_key = secrets.token_urlsafe(48)
    settings = Settings(secret_key=secret_key, _env_file=None)
    assert settings.secret_key == secret_key

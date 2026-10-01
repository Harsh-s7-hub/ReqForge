import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

def _get_encryption_key() -> bytes:
    try:
        key = base64.b64decode(
            settings.ENCRYPTION_KEY,
            altchars=b"-_",
            validate=True
        )
    except Exception as exc:
        raise ValueError("Invalid Encrytion key format.") from exc

    if len(key)!=32:
        raise ValueError("Encryption key must contain exactly 32 bytes.")

    return key

def encrypt_secret(plaintext : str) -> str:

    if not isinstance(plaintext,str) or not plaintext:
        raise ValueError("Plaintext must be a non-empty string.")

    key = _get_encryption_key()
    nonce = os.urandom(12)

    aes = AESGCM(key)

    ciphertext = aes.encrypt(
        nonce,
        plaintext.encode("utf-8"),
        None
    )

    encrypted_data = nonce+ciphertext

    return base64.urlsafe_b64encode(
        encrypted_data
    ).decode("ascii")


def decrypt_secret(encrypted_value : str) -> str :
    if not isinstance(encrypted_value,str):
        raise ValueError("Encrypted value must be string.")

    try:
        key = _get_encryption_key()

        encrypted_data = base64.b64decode(
            encrypted_value,
            altchars=b"-_",
            validate=True
        )

        if len(encrypted_data) < 28 :
            raise ValueError("Invalid Encrypted Data.")

        nonce = encrypted_data[:12]
        ciphertext = encrypted_data[12:]

        aes = AESGCM(key)

        plaintext = aes.decrypt(
            nonce,
            ciphertext,
            None
        )

        return plaintext.decode("utf-8")
    except Exception as exc:
        raise ValueError("Unable to decrypt the supplied value.") from exc
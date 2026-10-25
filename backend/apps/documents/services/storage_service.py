import os
import uuid
import hashlib
from django.conf import settings


class DocumentStorageService:
    """Manages secure on-disk file storage with randomized UUID keys."""

    @staticmethod
    def get_upload_dir() -> str:
        upload_dir = getattr(settings, 'PRIVATE_UPLOADS_DIR', os.path.join(settings.MEDIA_ROOT, 'private', 'uploads'))
        os.makedirs(upload_dir, exist_ok=True)
        return upload_dir

    @classmethod
    def save_file(cls, uploaded_file) -> tuple[str, str, int]:
        """
        Saves uploaded file into private uploads directory.
        Returns: (storage_key, checksum_sha256, file_size)
        """
        upload_dir = cls.get_upload_dir()
        ext = os.path.splitext(uploaded_file.name)[1].lower()
        unique_name = f"{uuid.uuid4().hex}{ext}"
        target_path = os.path.join(upload_dir, unique_name)

        sha256 = hashlib.sha256()
        size = 0

        with open(target_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
                sha256.update(chunk)
                size += len(chunk)

        storage_key = os.path.relpath(target_path, settings.MEDIA_ROOT)
        return storage_key, sha256.hexdigest(), size

    @staticmethod
    def get_absolute_path(storage_key: str) -> str:
        return os.path.join(settings.MEDIA_ROOT, storage_key)

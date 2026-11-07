import io
import zipfile

import pytest
from PIL import Image

import zip_utils
from zip_utils import InvalidUpload, extract_slices


def _png(size=(32, 32)) -> bytes:
    buf = io.BytesIO()
    Image.new("L", size, 128).save(buf, format="PNG")
    return buf.getvalue()


def make_zip(count=16, extra: dict | None = None, size=(32, 32)) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        for i in range(count):
            z.writestr(f"slice_{i:02d}.png", _png(size))
        for name, content in (extra or {}).items():
            z.writestr(name, content)
    return buf.getvalue()


def test_valid_archive_returns_16_images():
    images = extract_slices(make_zip())
    assert len(images) == 16


def test_macosx_junk_is_ignored():
    data = make_zip(extra={"__MACOSX/._slice_00.png": b"junk", "dossier/._x.png": b"junk"})
    assert len(extract_slices(data)) == 16


def test_wrong_number_of_slices():
    with pytest.raises(InvalidUpload, match="15 reçues"):
        extract_slices(make_zip(count=15))


def test_not_a_zip():
    with pytest.raises(InvalidUpload):
        extract_slices(b"ceci n'est pas un zip")


def test_fake_png_is_rejected():
    buf = io.BytesIO()
    Image.new("RGB", (16, 16)).save(buf, format="JPEG")
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as z:
        for i in range(15):
            z.writestr(f"s{i:02d}.png", _png())
        z.writestr("s15.png", buf.getvalue())  # JPEG déguisé en PNG
    with pytest.raises(InvalidUpload, match="vraie image PNG"):
        extract_slices(out.getvalue())


def test_corrupted_png_is_rejected():
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as z:
        for i in range(15):
            z.writestr(f"s{i:02d}.png", _png())
        z.writestr("s15.png", _png()[:40])  # PNG tronqué
    with pytest.raises(InvalidUpload):
        extract_slices(out.getvalue())


def test_too_many_pixels(monkeypatch):
    monkeypatch.setattr(zip_utils, "MAX_PIXELS", 100)
    with pytest.raises(InvalidUpload, match="trop grande"):
        extract_slices(make_zip(size=(32, 32)))


def test_zip_bomb_total_size(monkeypatch):
    monkeypatch.setattr(zip_utils, "MAX_TOTAL_BYTES", 10)
    with pytest.raises(InvalidUpload, match="trop volumineux"):
        extract_slices(make_zip())


def test_too_many_entries(monkeypatch):
    monkeypatch.setattr(zip_utils, "MAX_ENTRIES", 5)
    with pytest.raises(InvalidUpload, match="trop de fichiers"):
        extract_slices(make_zip())


def test_upload_too_large(monkeypatch):
    monkeypatch.setattr(zip_utils, "MAX_ZIP_BYTES", 100)
    with pytest.raises(InvalidUpload, match="trop volumineux"):
        extract_slices(make_zip())

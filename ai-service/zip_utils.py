"""Lecture sécurisée du ZIP d'IRM reçu par /predict.

Protège contre : zip bombs (taille décompressée, nombre de fichiers), faux PNG,
images gigantesques, archives corrompues ou chiffrées. Rien n'est extrait sur le disque.
"""
import io
import os
import zipfile
import zlib

from PIL import Image, UnidentifiedImageError


def _mb(name: str, default: int) -> int:
    return int(os.getenv(name, str(default))) * 1024 * 1024


EXPECTED_SLICES = int(os.getenv("EXPECTED_SLICES", "16"))
MAX_ZIP_BYTES = _mb("MAX_ZIP_MB", 100)  # taille du ZIP envoyé
MAX_ENTRY_BYTES = _mb("MAX_ENTRY_MB", 20)  # taille décompressée d'une image
MAX_TOTAL_BYTES = _mb("MAX_TOTAL_UNCOMPRESSED_MB", 200)  # taille décompressée totale
MAX_ENTRIES = int(os.getenv("MAX_ZIP_ENTRIES", "200"))  # fichiers dans l'archive (tous types)
MAX_PIXELS = int(os.getenv("MAX_IMAGE_PIXELS", str(2048 * 2048)))  # par coupe


class InvalidUpload(ValueError):
    """Le fichier envoyé n'est pas une IRM exploitable (erreur côté client, HTTP 400)."""


def _is_slice(name: str) -> bool:
    lower = name.lower()
    base = lower.rsplit("/", 1)[-1]
    return lower.endswith(".png") and "__macosx" not in lower and not base.startswith("._")


def _decode_png(raw: bytes, name: str) -> Image.Image:
    try:
        img = Image.open(io.BytesIO(raw))
        if img.format != "PNG":
            raise InvalidUpload(f"« {name} » n'est pas une vraie image PNG.")
        if img.width * img.height > MAX_PIXELS:
            raise InvalidUpload(f"« {name} » est trop grande ({img.width}x{img.height} pixels).")
        img.load()  # décode entièrement : détecte les fichiers tronqués ou corrompus
    except InvalidUpload:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError) as exc:
        raise InvalidUpload(f"« {name} » est illisible ou corrompue.") from exc
    return img


def extract_slices(data: bytes) -> list[Image.Image]:
    """Retourne exactement EXPECTED_SLICES images PNG validées, ou lève InvalidUpload."""
    if len(data) > MAX_ZIP_BYTES:
        raise InvalidUpload(f"Fichier trop volumineux ({MAX_ZIP_BYTES // (1024 * 1024)} Mo maximum).")

    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            infos = archive.infolist()
            if len(infos) > MAX_ENTRIES:
                raise InvalidUpload("Archive invalide : trop de fichiers.")

            slices = sorted((i for i in infos if _is_slice(i.filename)), key=lambda i: i.filename)
            if len(slices) != EXPECTED_SLICES:
                raise InvalidUpload(f"{EXPECTED_SLICES} images PNG attendues, {len(slices)} reçues.")
            if sum(i.file_size for i in slices) > MAX_TOTAL_BYTES:
                raise InvalidUpload("Archive invalide : contenu décompressé trop volumineux.")

            images = []
            for info in slices:
                if info.file_size > MAX_ENTRY_BYTES:
                    raise InvalidUpload(f"« {info.filename} » est trop volumineuse.")
                images.append(_decode_png(archive.read(info), info.filename))
            return images
    except InvalidUpload:
        raise
    except (zipfile.BadZipFile, RuntimeError, NotImplementedError, EOFError, zlib.error) as exc:
        # RuntimeError : archive chiffrée ; NotImplementedError : méthode de compression inconnue
        raise InvalidUpload(
            f"Envoyez un fichier ZIP valide contenant {EXPECTED_SLICES} images PNG."
        ) from exc

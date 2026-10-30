from pathlib import Path

from PIL import Image

from main_new import predire_patient

chemins = sorted(Path("/app/test_patient").rglob("*.png"))
images = [Image.open(p) for p in chemins]
print(chemins[0].name, "...", len(images), "images")
print("Score AD du patient :", round(predire_patient(images), 3))
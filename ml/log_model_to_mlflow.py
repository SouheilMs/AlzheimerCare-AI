"""Enregistre le modèle ResNet18 déjà entraîné et ses métriques dans MLflow.

Usage (depuis la racine du projet, MLflow lancé via docker-compose.mlops.yml) :

    pip install mlflow==2.22.5 torch torchvision
    python ml/log_model_to_mlflow.py \
        --weights ai-service/models/modele_final_graine1.pt \
        --metrics ml/metrics.json \
        --seed 1

metrics.json contient VOS résultats d'évaluation sur le jeu de test (jamais d'entraînement), par ex. :
    {"accuracy": 0.0, "recall": 0.0, "specificity": 0.0, "auc": 0.0}
Remplacez les valeurs par les vraies : ne publiez jamais des chiffres inventés.
"""
import argparse
import json
import os

import mlflow
import mlflow.pytorch
import torch
import torch.nn as nn
from torchvision import models


def build_model() -> nn.Module:
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 2)
    return model


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", required=True, help="Fichier .pt (state_dict)")
    parser.add_argument("--metrics", required=True, help="JSON {nom_metrique: valeur}")
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--dataset", default="ADNI + OASIS", help="Jeux de données utilisés")
    parser.add_argument("--run-name", default="resnet18-graine1")
    parser.add_argument("--registered-name", default="alzheimercare-resnet18")
    args = parser.parse_args()

    mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000"))
    mlflow.set_experiment("alzheimercare-irm")

    with open(args.metrics, encoding="utf-8") as fh:
        metrics = json.load(fh)

    model = build_model()
    model.load_state_dict(torch.load(args.weights, map_location="cpu"))
    model.eval()

    with mlflow.start_run(run_name=args.run_name):
        mlflow.log_params(
            {
                "architecture": "resnet18",
                "classes": 2,
                "input_size": "224x224",
                "slices_per_patient": 16,
                "aggregation": "moyenne des probabilités par coupe",
                "normalisation": "ImageNet (mean/std)",
                "seed": args.seed,
                "dataset": args.dataset,
            }
        )
        for name, value in metrics.items():
            mlflow.log_metric(name, float(value))
        mlflow.log_artifact(args.metrics, artifact_path="evaluation")
        mlflow.pytorch.log_model(model, artifact_path="model", registered_model_name=args.registered_name)
    print("Modèle et métriques enregistrés dans MLflow.")


if __name__ == "__main__":
    main()

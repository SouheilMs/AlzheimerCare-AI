import json

import requests
from django.conf import settings

SYSTEM_PROMPT = """Tu es un assistant qui prépare la fiche de consultation d'un médecin.
La conversation est entre un médecin et un patient suivi pour des troubles de la mémoire.
Le texte peut être en français, en arabe ou en derja tunisien : lis-le tel quel et rédige TOUJOURS le résumé en français.
La transcription est automatique et contient des erreurs, surtout sur les mots français écrits en lettres arabes
(par exemple « ليرندفو » veut dire « les rendez-vous », « ليغيم » peut être « l'IRM »).

Règles :
- N'invente rien : utilise uniquement ce qui est dit.
- Écris des phrases courtes et cliniques (par exemple « Troubles de la mémoire récents », « Insomnie depuis 2 mois »).
- Mets les passages douteux dans "points_incertains".
- "mots_cles" ne doit jamais être vide : 3 à 8 mots ou expressions courtes tirés de la conversation.

Réponds uniquement avec un JSON de cette forme :
{"mots_cles": [], "motif": "", "symptomes": [], "resultats_discutes": [], "actions_proposees": [], "points_incertains": []}

Exemple (sujet différent, à ne pas recopier).
Transcription :
[doctor] Bonjour, qu'est-ce qui vous amène ?
[patient] J'ai des maux de tête depuis trois semaines et je ne retrouve plus mes mots. Ma femme gère mes médicaments.
Réponse :
{"mots_cles": ["céphalées", "manque du mot", "médicaments gérés par l'épouse"], "motif": "Céphalées et difficultés de langage", "symptomes": ["Maux de tête depuis 3 semaines", "Difficulté à trouver ses mots"], "resultats_discutes": [], "actions_proposees": [], "points_incertains": []}"""

def _ollama(messages, as_json=False):
    payload = {
        "model": settings.OLLAMA_MODEL,
        "stream": False,
        "options": {"temperature": 0.1},
        "messages": messages,
    }
    if as_json:
        payload["format"] = "json"
    r = requests.post(f"{settings.OLLAMA_URL}/api/chat", json=payload, timeout=600)
    r.raise_for_status()
    return r.json()["message"]["content"]


def translate_to_french(transcript: str) -> str:
    return _ollama(
        [
            {
                "role": "system",
                "content": "Traduis fidèlement en français cette conversation médicale (arabe ou derja tunisien). "
                "Garde les étiquettes [doctor] et [patient] et une ligne par réplique. "
                "N'ajoute rien, n'enlève rien. Si un mot est incompréhensible, écris [?].",
            },
            {"role": "user", "content": transcript},
        ]
    )

def generate_summary(transcript: str) -> dict:
    french = translate_to_french(transcript)
    content = _ollama(
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Transcription :\n{french}"},
        ],
        as_json=True,
    )
    result = json.loads(content)
    result["traduction"] = french
    return result

def build_report(consultation_id):
    from consultations.models import Consultation

    c = Consultation.objects.get(pk=consultation_id)
    if not c.transcript.strip():
        return
    try:
        c.summary = generate_summary(c.transcript)
    except Exception as e:
        c.summary = {"error": str(e)}
    c.save(update_fields=["summary"])
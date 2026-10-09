from fastapi import FastAPI

app = FastAPI(title="AlzheimerCare AI Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

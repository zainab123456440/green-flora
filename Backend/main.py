from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time

from config.settings import settings
from routes import farmer
from routes import auth

app = FastAPI(
    title="Green Flora API",
    description="Smart agriculture platform for Pakistani farmers.",
    version="0.1.0",
)

# Allow the frontend dev server(s) to call this API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_timing(request: Request, call_next):
    """Add X-Process-Time header to every response for debugging."""
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    response.headers["X-Process-Time"] = f"{duration:.3f}s"
    return response


app.include_router(farmer.router)
app.include_router(auth.router)


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

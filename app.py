"""
FastAPI backend wrapper for the Agentic RAG LangGraph workflow.
Exposes POST /api/chat, GET /health, and serves the frontend UI from /dist.
"""

import sys
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Startup: import the compiled LangGraph app (runs module-level init once)
# ---------------------------------------------------------------------------
print("⏳  Initialising Agentic RAG workflow — this may take 30–60 s on first run…")
_INIT_ERROR: str | None = None
try:
    from Agentic_RAG import app as langgraph_app  # the compiled StateGraph
    _READY = True
    print("✅  Agentic RAG workflow ready.")
except Exception as exc:
    _READY = False
    _INIT_ERROR = str(exc)
    print(f"❌  Failed to initialise Agentic RAG: {exc}")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(application: FastAPI):
    yield  # startup already done at module import


api = FastAPI(
    title="Agentic RAG API",
    description="LangGraph-powered Agentic RAG exposed via FastAPI",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow CORS requests
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    question: str


class WorkflowStep(BaseModel):
    node: str
    status: str = "completed"


class ChatResponse(BaseModel):
    answer: str
    source_used: str
    nodes_visited: List[str]
    retry_count: int
    steps: List[WorkflowStep]


# ---------------------------------------------------------------------------
# Helper: friendly label per node
# ---------------------------------------------------------------------------
NODE_LABELS: Dict[str, str] = {
    "route_question":    "Routing Question",
    "retrieve_kb":       "Retrieving from Knowledge Base",
    "grade_kb_evidence": "Grading KB Evidence",
    "search_web":        "Searching the Web",
    "grade_web_evidence":"Grading Web Evidence",
    "rewrite_query":     "Rewriting Query",
    "generate_from_kb":  "Generating Answer (KB)",
    "generate_from_web": "Generating Answer (Web)",
    "direct_answer":     "Generating Direct Answer",
    "answer_insufficient":"Handling Insufficient Evidence",
}


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@api.get("/health")
async def health():
    """Readiness probe — returns 503 if workflow failed to initialise."""
    if not _READY:
        raise HTTPException(status_code=503, detail=f"Workflow not ready: {_INIT_ERROR}")
    return {"status": "ready", "message": "Agentic RAG workflow is initialised and ready."}


@api.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Run the Agentic RAG LangGraph workflow and return the result + metadata."""
    if not _READY:
        raise HTTPException(status_code=503, detail="Workflow is still initialising. Try again shortly.")

    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    initial_state: Dict[str, Any] = {
        "question": question,
        "retry_count": 0,
        "kb_docs": [],
        "web_results": "",
        "kb_grade": "",
        "web_grade": "",
        "answer": "",
        "source_used": "",
        "current_query": "",
    }

    nodes_visited: List[str] = []
    final_state: Dict[str, Any] = {}

    try:
        for step in langgraph_app.stream(initial_state, stream_mode="updates"):
            for node_name, state_update in step.items():
                nodes_visited.append(node_name)
                final_state.update(state_update)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {exc}")

    steps = [
        WorkflowStep(node=node, status="completed")
        for node in nodes_visited
    ]

    return ChatResponse(
        answer=final_state.get("answer", "No answer was generated."),
        source_used=final_state.get("source_used", "unknown"),
        nodes_visited=nodes_visited,
        retry_count=int(final_state.get("retry_count", 0)),
        steps=steps,
    )


# ---------------------------------------------------------------------------
# Static Frontend Files & Client-Side Routing Fallback
# ---------------------------------------------------------------------------
frontend_dist = os.path.join(os.path.dirname(__file__), "dist")

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        api.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @api.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Exclude backend API routes
        if full_path.startswith("api/") or full_path == "health":
            raise HTTPException(status_code=404, detail="API endpoint not found")

        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        # Fallback to index.html for Single Page Applications
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        raise HTTPException(status_code=404, detail="Index file not found")
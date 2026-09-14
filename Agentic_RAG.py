import os
import time
from getpass import getpass
from typing import List, Literal, Optional
from typing_extensions import TypedDict
from pydantic import BaseModel, Field

from dotenv import load_dotenv
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceInferenceAPIEmbeddings
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq
from langchain_tavily import TavilySearch
from langchain_core.documents import Document
from langgraph.graph import StateGraph, START, END

# ==========================================
# 1. Configure Environment & API Keys
# ==========================================
try:
    load_dotenv()
except Exception:
    pass

if not os.getenv("GROQ_API_KEY"):
    os.environ["GROQ_API_KEY"] = getpass("Enter GROQ_API_KEY: ")
if not os.getenv("TAVILY_API_KEY"):
    os.environ["TAVILY_API_KEY"] = getpass("Enter TAVILY_API_KEY: ")
if not os.getenv("PINECONE_API_KEY"):
    os.environ["PINECONE_API_KEY"] = getpass("Enter PINECONE_API_KEY: ")

# Hugging Face token is required for remote serverless embeddings
HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN")

# ==========================================
# 2. Load Documents & Prepare Vector DB
# ==========================================
SOURCE_URL = "https://docs.langchain.com/oss/python/langgraph/agentic-rag"
loader = WebBaseLoader(
    web_paths=(SOURCE_URL,),
    requests_kwargs={"headers": {"User-Agent": "Mozilla/5.0 Agentic-RAG-Industry-Demo"}},
)
raw_docs = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150,
    add_start_index=True,
)
chunks = splitter.split_documents(raw_docs)

# Use Hugging Face Inference API instead of downloading local PyTorch weights into RAM
embeddings = HuggingFaceInferenceAPIEmbeddings(
    api_key=HF_TOKEN,
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

INDEX_NAME = "industry-agentic-rag-kb"
NAMESPACE = "langgraph-agentic-rag"

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
existing_indexes = [index_info["name"] for index_info in pc.list_indexes()]

if INDEX_NAME not in existing_indexes:
    pc.create_index(
        name=INDEX_NAME,
        dimension=384,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    while not pc.describe_index(INDEX_NAME).status["ready"]:
        time.sleep(1)

vectorstore = PineconeVectorStore.from_documents(
    documents=chunks,
    embedding=embeddings,
    index_name=INDEX_NAME,
    namespace=NAMESPACE,
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 4, "namespace": NAMESPACE})

# ==========================================
# 3. Initialize LLM & Search Tools
# ==========================================
llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0)

web_search = TavilySearch(
    max_results=5,
    topic="general",
    include_answer=True,
    include_raw_content=False,
)

# ==========================================
# 4. Data Models and State Definition
# ==========================================
class RouteDecision(BaseModel):
    route: Literal["kb", "direct"] = Field(
        description="Use kb for questions needing Agentic RAG docs; direct for greetings/simple chat."
    )

class EvidenceGrade(BaseModel):
    grade: Literal["good", "weak"] = Field(
        description="good means evidence can answer the question; weak means not enough evidence."
    )

class AgentState(TypedDict):
    question: str
    current_query: str
    kb_docs: List[Document]
    web_results: str
    kb_grade: str
    web_grade: str
    answer: str
    source_used: str
    retry_count: int

# ==========================================
# 5. Graph Nodes and Edge Logic
# ==========================================
router_llm = llm.with_structured_output(RouteDecision, method="json_mode")
kb_grader_llm = llm.with_structured_output(EvidenceGrade, method="json_mode")
web_grader_llm = llm.with_structured_output(EvidenceGrade, method="json_mode")

def route_question(state: AgentState):
    question = state["question"]
    decision = router_llm.invoke(
        f""" You are a router for an Agentic RAG assistant. Route to "kb" if the user asks about:
- Agentic RAG
- LangGraph Agentic RAG workflow
- retrieval grading
- query rewriting
- RAG architecture
- retriever tools
- web fallback in RAG
Route to "direct" only for greetings, thanks, or very simple conversation.
Question: {question}
Return your response as valid JSON. Example: {{ "route": "kb" }}"""
    )
    return {"current_query": question, "source_used": decision.route}

def route_after_router(state: AgentState) -> Literal["retrieve_kb", "direct_answer"]:
    if state["source_used"] == "kb":
        return "retrieve_kb"
    return "direct_answer"

def retrieve_kb(state: AgentState):
    query = state["current_query"]
    docs = retriever.invoke(query)
    return {"kb_docs": docs}

def grade_kb_evidence(state: AgentState):
    question = state["question"]
    context = "\n\n".join(
        f"Source: {doc.metadata.get('source')}\n{doc.page_content}" for doc in state["kb_docs"]
    )
    grade = kb_grader_llm.invoke(
        f"""You are an evidence grader.
Question: {question}
Private KB evidence: {context}
Can this private KB evidence answer the question? Return "good" if it can answer. Return "weak" if it cannot answer or is incomplete.
Return your response as valid JSON. Example: {{ "grade": "good" }}"""
    )
    return {"kb_grade": grade.grade}

def decide_after_kb_grade(state: AgentState) -> Literal["generate_from_kb", "search_web"]:
    if state["kb_grade"] == "good":
        return "generate_from_kb"
    return "search_web"

def search_web(state: AgentState):
    query = state["current_query"]
    result = web_search.invoke({"query": query})
    if isinstance(result, dict):
        answer = result.get("answer", "")
        results = result.get("results", [])
        lines = []
        if answer:
            lines.append(f"Tavily answer: {answer}")
        for item in results:
            lines.append(f"Title: {item.get('title', '')}\nURL: {item.get('url', '')}\nContent: {item.get('content', '')}")
        web_text = "\n\n".join(lines) if lines else str(result)
    else:
        web_text = str(result)
    return {"web_results": web_text, "source_used": "web"}

def grade_web_evidence(state: AgentState):
    question = state["question"]
    web_results = state["web_results"]
    grade = web_grader_llm.invoke(
        f"""You are an evidence grader.
Question: {question}
Web search evidence: {web_results}
Can this web evidence answer the question? Return "good" if it can answer. Return "weak" if it cannot answer or is incomplete.
Return your response as valid JSON. Example: {{ "grade": "good" }}"""
    )
    return {"web_grade": grade.grade}

MAX_RETRIES = 1

def decide_after_web_grade(state: AgentState) -> Literal["generate_from_web", "rewrite_query", "answer_insufficient"]:
    if state["web_grade"] == "good":
        return "generate_from_web"
    if state.get("retry_count", 0) < MAX_RETRIES:
        return "rewrite_query"
    return "answer_insufficient"

def rewrite_query(state: AgentState):
    question = state["question"]
    retry_count = state.get("retry_count", 0) + 1
    rewritten = llm.invoke(
        f"""Rewrite the question for better retrieval and web search.
Rules:
- Preserve original intent.
- Make it specific and search-friendly.
- Do not answer.
- Return only the rewritten query.
Original question: {question}"""
    ).content.strip()
    return {"current_query": rewritten, "retry_count": retry_count}

def generate_from_kb(state: AgentState):
    question = state["question"]
    context = "\n\n".join(
        f"[KB Source: {doc.metadata.get('source')}]\n{doc.page_content}" for doc in state["kb_docs"]
    )
    answer = llm.invoke(
        f"""You are a technical instructor. Answer using ONLY the private KB context.
Rules:
- Beginner-friendly explanation.
- Do not invent unsupported details.
- Mention that the answer is based on the private KB.
- Include source type: Private KB.
Question: {question}
Private KB context: {context}"""
    ).content
    return {"answer": answer, "source_used": "private_kb"}

def generate_from_web(state: AgentState):
    question = state["question"]
    web_context = state["web_results"]
    answer = llm.invoke(
        f"""You are a technical instructor. The private KB was insufficient, so web search was used.
Answer using ONLY the web search context.
Rules:
- Beginner-friendly explanation.
- Do not invent unsupported details.
- Mention that the answer is based on Tavily web search.
- Include source type: Web Search.
- If URLs are present in context, include the most useful URLs.
Question: {question}
Web search context: {web_context}"""
    ).content
    return {"answer": answer, "source_used": "web_search"}

def direct_answer(state: AgentState):
    question = state["question"]
    answer = llm.invoke(f"Respond briefly and naturally. Message: {question}").content
    return {"answer": answer, "source_used": "direct"}

def answer_insufficient(state: AgentState):
    answer = (
        "I could not find enough reliable evidence in the private knowledge base "
        "or the web search results to answer this confidently. "
        "Please provide more specific documents or rephrase the question."
    )
    return {"answer": answer, "source_used": "insufficient_evidence"}

# ==========================================
# 6. Build and Compile LangGraph Workflow
# ==========================================
workflow = StateGraph(AgentState)

workflow.add_node("route_question", route_question)
workflow.add_node("retrieve_kb", retrieve_kb)
workflow.add_node("grade_kb_evidence", grade_kb_evidence)
workflow.add_node("search_web", search_web)
workflow.add_node("grade_web_evidence", grade_web_evidence)
workflow.add_node("rewrite_query", rewrite_query)
workflow.add_node("generate_from_kb", generate_from_kb)
workflow.add_node("generate_from_web", generate_from_web)
workflow.add_node("direct_answer", direct_answer)
workflow.add_node("answer_insufficient", answer_insufficient)

workflow.add_edge(START, "route_question")
workflow.add_conditional_edges("route_question", route_after_router)

workflow.add_edge("retrieve_kb", "grade_kb_evidence")
workflow.add_conditional_edges("grade_kb_evidence", decide_after_kb_grade)

workflow.add_edge("search_web", "grade_web_evidence")
workflow.add_conditional_edges("grade_web_evidence", decide_after_web_grade)

workflow.add_edge("rewrite_query", "retrieve_kb")

workflow.add_edge("generate_from_kb", END)
workflow.add_edge("generate_from_web", END)
workflow.add_edge("direct_answer", END)
workflow.add_edge("answer_insufficient", END)

app = workflow.compile()

# ==========================================
# 7. Run Example Invocation
# ==========================================
if __name__ == "__main__":
    initial_state = {
        "question": "What is the current LangChain Tavily package used for Python web search integration?",
        "retry_count": 0,
    }
    result = app.invoke(initial_state)
    print("\nFINAL ANSWER:\n", result["answer"])
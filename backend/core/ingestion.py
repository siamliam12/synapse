import os
import shutil
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma

CHROMA_PATH = os.path.join(os.getcwd(), "chroma_db")

def run_ingestion(repo_name: str = "test_repo") -> dict:
    repo_path = os.path.join(os.getcwd(), repo_name)
    if not os.path.exists(repo_path):
        raise FileNotFoundError(f"Repository folder '{repo_name}' not found in backend.")

    # 1. Load Files
    html_loader = DirectoryLoader(repo_path, glob="**/*.html", loader_cls=TextLoader, loader_kwargs={'encoding': 'utf-8'})
    css_loader = DirectoryLoader(repo_path, glob="**/*.css", loader_cls=TextLoader, loader_kwargs={'encoding': 'utf-8'})
    all_docs = html_loader.load() + css_loader.load()

    if not all_docs:
        raise ValueError("No HTML or CSS files found to ingest.")

    # 2. Chunking
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, length_function=len)
    chunks = text_splitter.split_documents(all_docs)

    # 3. Vectorization & Database Storage
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH) # Clear old memory before ingesting new repo

    Chroma.from_documents(documents=chunks, embedding=embeddings, persist_directory=CHROMA_PATH)

    return {"status": "success", "chunks_processed": len(chunks)}
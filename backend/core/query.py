# core/query.py
import os
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains import create_retrieval_chain

CHROMA_PATH = os.path.join(os.getcwd(), "chroma_db")

def execute_rag_query(question: str) -> dict:
    if not os.path.exists(CHROMA_PATH):
        raise FileNotFoundError("Vector database does not exist. Please run ingestion first.")

    # Initialize assets
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
    retriever = db.as_retriever(search_kwargs={"k": 4})
    llm = OllamaLLM(model="llama3.2:1b")

    system_prompt = (
        "You are an expert codebase mentor named Synapse. "
        "Use the following retrieved context from the codebase to answer the user's question.\n"
        "CRITICAL INSTRUCTIONS FOR FORMATTING:\n"
        "- ALWAYS use Markdown to format your answer.\n"
        "- Use bolding for file names, class names, and key concepts.\n"
        "- Use bullet points and numbered lists to break down complex logic.\n"
        "- Use inline code blocks (`like this`) for variables, CSS rules, or short snippets.\n"
        "- Use multi-line code blocks with the language specified (e.g., ```css) for larger code examples.\n\n"
        "Context:\n{context}"
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    # Build and execute the RAG pipeline
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    
    response = rag_chain.invoke({"input": question})

    # Format source names cleanly (extracting file names from absolute paths)
    sources = []
    for doc in response["context"]:
        source_path = doc.metadata.get("source", "Unknown")
        filename = os.path.basename(source_path)
        if filename not in sources:
            sources.append(filename)

    return {
        "answer": response["answer"],
        "sources": sources
    }
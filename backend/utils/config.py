from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GEMINI_API_KEY: str
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "financial_docs"
    EMBED_MODEL: str = "BAAI/bge-small-en-v1.5"
    RERANKER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    TOP_K_RETRIEVE: int = 20
    TOP_K_RERANK: int = 5
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

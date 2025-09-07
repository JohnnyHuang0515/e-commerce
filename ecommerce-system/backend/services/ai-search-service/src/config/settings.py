import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    """AI Search Service Configuration"""
    
    # FastAPI Configuration
    app_name: str = Field(default="AI Search Service", description="Application name")
    debug: bool = Field(default=False, description="Debug mode")
    host: str = Field(default="0.0.0.0", description="Host to bind")
    port: int = Field(default=3015, description="Port to bind")
    
    # Legacy Flask settings (for compatibility)
    flask_env: Optional[str] = Field(default=None, description="Flask environment")
    secret_key: Optional[str] = Field(default=None, description="Secret key")
    
    # Milvus Configuration
    milvus_host: str = Field(default="localhost", description="Milvus host")
    milvus_port: int = Field(default=19530, description="Milvus port")
    milvus_collection_name: str = Field(default="product_vectors", description="Milvus collection name")
    milvus_dimension: int = Field(default=384, description="Vector dimension")
    
    # Redis Configuration
    redis_host: str = Field(default="localhost", description="Redis host")
    redis_port: int = Field(default=6379, description="Redis port")
    redis_password: Optional[str] = Field(default="password123", description="Redis password")
    redis_db: int = Field(default=0, description="Redis database")
    redis_cache_ttl: int = Field(default=3600, description="Cache TTL in seconds")
    
    # Product Service Configuration
    product_service_url: str = Field(default="http://localhost:3001", description="Product service URL")
    
    # AI Model Configuration
    model_name: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", description="Model name")
    model_cache_dir: str = Field(default="./models", description="Model cache directory")
    
    # Search Configuration
    default_search_limit: int = Field(default=20, description="Default search limit")
    max_search_limit: int = Field(default=100, description="Maximum search limit")
    similarity_threshold: float = Field(default=0.7, description="Similarity threshold")
    
    # Logging Configuration
    log_level: str = Field(default="INFO", description="Log level")
    log_file: str = Field(default="logs/ai-search-service.log", description="Log file path")
    
    # Performance Configuration
    batch_size: int = Field(default=32, description="Batch size")
    max_concurrent_requests: int = Field(default=10, description="Max concurrent requests")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields

# Global settings instance
settings = Settings()

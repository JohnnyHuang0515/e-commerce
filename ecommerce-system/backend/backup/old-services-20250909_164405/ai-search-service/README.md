# AI Search Service

AI-powered semantic search service for the e-commerce platform using vector embeddings and Milvus database.

## Features

- **Semantic Search**: Use AI to understand search intent and find relevant products
- **Vector Database**: Powered by Milvus for fast similarity search
- **Caching**: Redis-based caching for improved performance
- **RESTful API**: Clean API interface with Swagger documentation
- **Real-time Indexing**: Index products in real-time for immediate searchability

## Technology Stack

- **Framework**: FastAPI + Uvicorn
- **AI Model**: sentence-transformers/all-MiniLM-L6-v2
- **Vector Database**: Milvus
- **Cache**: Redis
- **Language**: Python 3.9+

## Quick Start

### Prerequisites

- Python 3.9+
- Milvus database running
- Redis server running
- Product service running (for data)

### Installation

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Create necessary directories**:
   ```bash
   mkdir -p logs models
   ```

4. **Start the service**:
   ```bash
   python src/app.py
   ```

### API Endpoints

#### Search Products
```http
POST /api/v1/search/
Content-Type: application/json

{
  "query": "red running shoes",
  "limit": 20,
  "threshold": 0.7,
  "filters": {
    "category": "shoes",
    "price_min": 50,
    "price_max": 200
  }
}
```

#### Index Product
```http
POST /api/v1/search/index
Content-Type: application/json

{
  "id": "product_123",
  "name": "Red Running Shoes",
  "description": "Comfortable running shoes for daily use",
  "category": "shoes",
  "brand": "Nike",
  "price": 99.99,
  "tags": ["running", "sports", "red"]
}
```

#### Remove Product
```http
DELETE /api/v1/search/remove/{product_id}
```

#### Service Statistics
```http
GET /api/v1/search/stats
```

#### Health Check
```http
GET /health
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FLASK_ENV` | Flask environment | `development` |
| `PORT` | Service port | `3014` |
| `MILVUS_HOST` | Milvus server host | `localhost` |
| `MILVUS_PORT` | Milvus server port | `19530` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `MODEL_NAME` | AI model name | `sentence-transformers/all-MiniLM-L6-v2` |

### Milvus Collection Schema

The service creates a collection with the following schema:

- `id`: Primary key (auto-generated)
- `product_id`: Product identifier (VARCHAR)
- `vector`: Embedding vector (FLOAT_VECTOR, 384 dimensions)
- `metadata`: Product metadata (JSON)
- `created_at`: Timestamp (INT64)

## Development

### Project Structure

```
ai-search-service/
├── src/
│   ├── config/
│   │   └── config.py          # Configuration management
│   ├── controllers/
│   │   └── search_controller.py # API controllers
│   ├── models/
│   │   ├── milvus_manager.py   # Milvus database manager
│   │   ├── ai_model_manager.py # AI model manager
│   │   └── redis_cache_manager.py # Redis cache manager
│   └── app.py                  # FastAPI application
├── tests/                      # Test files
├── requirements.txt           # Python dependencies
├── env.example                # Environment variables template
└── README.md                  # This file
```

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black src/ tests/
flake8 src/
```

## Performance Considerations

- **Model Loading**: The AI model is loaded once at startup
- **Caching**: Search results and embeddings are cached in Redis
- **Batch Processing**: Multiple products can be indexed in batches
- **Connection Pooling**: Database connections are reused

## Monitoring

The service provides several monitoring endpoints:

- `/health` - Service health check
- `/api/v1/search/stats` - Service statistics
- `/api-docs/` - API documentation

## Troubleshooting

### Common Issues

1. **Milvus Connection Failed**
   - Check if Milvus is running
   - Verify connection parameters

2. **Model Loading Failed**
   - Check internet connection for model download
   - Verify model cache directory permissions

3. **Redis Connection Failed**
   - Check if Redis is running
   - Verify Redis credentials

### Logs

Service logs are written to:
- Console output
- `logs/ai-search-service.log` file

## License

MIT License

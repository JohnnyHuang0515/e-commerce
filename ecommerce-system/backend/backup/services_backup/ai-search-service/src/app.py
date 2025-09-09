from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
import uvicorn

from src.config.settings import settings
from src.controllers.search_controller import SearchController
from src.models.milvus_manager import MilvusManager
from src.models.ai_model_manager import AIModelManager
from src.models.redis_cache_manager import RedisCacheManager

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.log_file),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Global controller instance
search_controller: Optional[SearchController] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global search_controller
    
    # Startup
    logger.info("Starting AI Search Service...")
    
    try:
        # Initialize components
        milvus_manager = MilvusManager(settings)
        ai_model_manager = AIModelManager(settings)
        redis_cache_manager = RedisCacheManager(settings)
        
        # Initialize search controller
        search_controller = SearchController(
            milvus_manager=milvus_manager,
            ai_model_manager=ai_model_manager,
            redis_cache_manager=redis_cache_manager,
            settings=settings
        )
        
        # Initialize all components
        if await search_controller.initialize():
            logger.info("AI Search Service initialized successfully")
        else:
            logger.error("Failed to initialize AI Search Service")
            raise Exception("Service initialization failed")
            
    except Exception as e:
        logger.error(f"Service initialization failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Search Service...")
    if search_controller:
        await search_controller.cleanup()

# Create FastAPI application
app = FastAPI(
    title="AI Search Service",
    description="AI-powered semantic search service for e-commerce platform",
    version="1.0.0",
    docs_url="/api-docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_search_controller() -> SearchController:
    """Dependency to get search controller"""
    if search_controller is None:
        raise HTTPException(status_code=503, detail="Search service not initialized")
    return search_controller

# Health check endpoint
@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    try:
        if search_controller and search_controller.is_initialized():
            return {
                "success": True,
                "message": "AI Search Service is healthy",
                "status": "running",
                "service": "ai-search-service",
                "version": "1.0.0"
            }
        else:
            return JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "message": "AI Search Service is not initialized",
                    "status": "initializing"
                }
            )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Health check failed: {str(e)}",
                "status": "error"
            }
        )

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "service": "AI Search Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api-docs",
        "redoc": "/redoc"
    }

# Include API routes
from src.routers import search_router
app.include_router(search_router.router, prefix="/api/v1", tags=["Search"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error": "500"
        }
    )

def main():
    """Main function to run the application"""
    try:
        logger.info(f"Starting AI Search Service on {settings.host}:{settings.port}")
        logger.info(f"Debug mode: {settings.debug}")
        
        # Run application
        uvicorn.run(
            "app:app",
            host=settings.host,
            port=settings.port,
            reload=settings.debug,
            log_level=settings.log_level.lower()
        )
        
    except Exception as e:
        logger.error(f"Failed to start AI Search Service: {e}")
        raise

if __name__ == "__main__":
    main()
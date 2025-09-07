from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import logging

from src.config.settings import settings
from src.controllers.search_controller import SearchController, get_search_controller

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Pydantic models for request/response
class SearchRequest(BaseModel):
    """Search request model"""
    query: str = Field(..., description="Search query text", min_length=1)
    limit: int = Field(default=20, description="Maximum number of results", ge=1, le=100)
    threshold: float = Field(default=0.7, description="Similarity threshold", ge=0.0, le=1.0)
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Additional filters")

class SearchResult(BaseModel):
    """Search result model"""
    product_id: str = Field(..., description="Product ID")
    score: float = Field(..., description="Similarity score")
    metadata: Dict[str, Any] = Field(..., description="Product metadata")

class SearchResponse(BaseModel):
    """Search response model"""
    success: bool = Field(..., description="Request success status")
    data: List[SearchResult] = Field(..., description="Search results")
    query: str = Field(..., description="Original query")
    total: int = Field(..., description="Total number of results")
    cached: bool = Field(..., description="Results from cache")
    message: str = Field(..., description="Response message")

class IndexRequest(BaseModel):
    """Index request model"""
    id: str = Field(..., description="Product ID")
    name: str = Field(..., description="Product name")
    description: Optional[str] = Field(default=None, description="Product description")
    category: Optional[str] = Field(default=None, description="Product category")
    brand: Optional[str] = Field(default=None, description="Product brand")
    price: Optional[float] = Field(default=None, description="Product price")
    tags: Optional[List[str]] = Field(default=None, description="Product tags")
    attributes: Optional[Dict[str, Any]] = Field(default=None, description="Product attributes")

class IndexResponse(BaseModel):
    """Index response model"""
    success: bool = Field(..., description="Request success status")
    message: str = Field(..., description="Response message")

class StatsResponse(BaseModel):
    """Stats response model"""
    success: bool = Field(..., description="Request success status")
    data: Dict[str, Any] = Field(..., description="Service statistics")
    message: str = Field(..., description="Response message")

# API Routes
@router.post("/search", response_model=SearchResponse, summary="Search products using AI")
async def search_products(request: SearchRequest):
    """Search products using AI semantic search"""
    try:
        from src.app import search_controller
        if search_controller is None:
            raise HTTPException(status_code=503, detail="Search service not initialized")
        
        result = await search_controller.search_products(
            query=request.query,
            limit=request.limit,
            threshold=request.threshold,
            filters=request.filters
        )
        
        return SearchResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search API error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.post("/search/index", response_model=IndexResponse, summary="Index a product for search")
async def index_product(
    request: IndexRequest,
    controller: SearchController = Depends(get_search_controller)
):
    """Index a product for search"""
    try:
        product_data = request.dict()
        result = await controller.index_product(product_data)
        
        if result["success"]:
            return IndexResponse(**result)
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Index API error: {e}")
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")

@router.delete("/search/remove/{product_id}", response_model=IndexResponse, summary="Remove a product from search index")
async def remove_product(
    product_id: str,
    controller: SearchController = Depends(get_search_controller)
):
    """Remove a product from search index"""
    try:
        result = await controller.remove_product(product_id)
        
        if result["success"]:
            return IndexResponse(**result)
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Remove API error: {e}")
        raise HTTPException(status_code=500, detail=f"Removal failed: {str(e)}")

@router.get("/stats", response_model=StatsResponse, summary="Get service statistics")
async def get_service_stats():
    """Get service statistics"""
    try:
        from src.app import search_controller
        if search_controller is None:
            raise HTTPException(status_code=503, detail="Search service not initialized")
        
        result = await search_controller.get_service_stats()
        return StatsResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stats API error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@router.get("/suggestions", summary="Get search suggestions")
async def get_search_suggestions(query: str, limit: int = 10):
    """Get search suggestions based on partial query"""
    try:
        from src.app import search_controller
        if search_controller is None:
            raise HTTPException(status_code=503, detail="Search service not initialized")
        
        result = await search_controller.get_search_suggestions(query, limit)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Suggestions API error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")

# Dependency function for FastAPI
async def get_search_controller() -> SearchController:
    """Get search controller instance"""
    # This will be injected by the main app
    from src.app import search_controller
    if search_controller is None:
        raise HTTPException(status_code=503, detail="Search service not initialized")
    return search_controller

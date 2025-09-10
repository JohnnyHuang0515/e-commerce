import logging
from typing import Dict, Any, List, Optional
import asyncio
from src.config.settings import Settings
from src.models.milvus_manager import MilvusManager
from src.models.ai_model_manager import AIModelManager
from src.models.redis_cache_manager import RedisCacheManager

logger = logging.getLogger(__name__)

class SearchController:
    """AI Search Controller (FastAPI Version)"""
    
    def __init__(self, milvus_manager: MilvusManager, ai_model_manager: AIModelManager, 
                 redis_cache_manager: RedisCacheManager, settings: Settings):
        self.milvus_manager = milvus_manager
        self.ai_model_manager = ai_model_manager
        self.redis_cache_manager = redis_cache_manager
        self.settings = settings
        self._initialized = False
    
    async def initialize(self) -> bool:
        """Initialize all components asynchronously"""
        try:
            logger.info("Initializing AI Search Service components...")
            
            # Connect to Milvus
            if not await self.milvus_manager.connect():
                logger.error("Failed to connect to Milvus")
                return False
            
            # Create collection if not exists
            if not await self.milvus_manager.create_collection():
                logger.error("Failed to create Milvus collection")
                return False
            
            # Load collection
            if not await self.milvus_manager.load_collection():
                logger.error("Failed to load Milvus collection")
                return False
            
            # Connect to Redis
            if not await self.redis_cache_manager.connect():
                logger.warning("Failed to connect to Redis cache")
                # Continue without cache
            
            # Load AI model
            if not self.ai_model_manager.load_model():
                logger.error("Failed to load AI model")
                return False
            
            self._initialized = True
            logger.info("Search controller initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize search controller: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            logger.info("Cleaning up search controller...")
            
            if self.milvus_manager:
                await self.milvus_manager.disconnect()
            
            if self.redis_cache_manager:
                await self.redis_cache_manager.disconnect()
            
            self._initialized = False
            logger.info("Search controller cleanup completed")
            
        except Exception as e:
            logger.error(f"Failed to cleanup search controller: {e}")
    
    async def search_products(self, query: str, limit: int = 20, 
                             threshold: float = 0.7, filters: Optional[Dict] = None) -> Dict[str, Any]:
        """Search products using AI"""
        try:
            if not self._initialized:
                return {
                    "success": False,
                    "message": "Search service not initialized",
                    "data": [],
                    "query": query,
                    "total": 0,
                    "cached": False
                }
            
            # Check cache first
            cached_results = await self.redis_cache_manager.get_cached_search_result(query)
            if cached_results:
                return {
                    "success": True,
                    "data": cached_results[:limit],
                    "query": query,
                    "total": len(cached_results),
                    "cached": True,
                    "message": "Search results from cache"
                }
            
            # Encode query to vector
            query_vector = await self.ai_model_manager.encode_text(query)
            if query_vector is None:
                return {
                    "success": False,
                    "message": "Failed to encode query",
                    "data": [],
                    "query": query,
                    "total": 0,
                    "cached": False
                }
            
            # Search in Milvus
            search_results = await self.milvus_manager.search_vectors(
                query_vector=query_vector,
                limit=limit,
                score_threshold=threshold
            )
            
            # Apply additional filters if provided
            if filters:
                search_results = await self._apply_filters(search_results, filters)
            
            # Cache results
            await self.redis_cache_manager.cache_search_result(query, search_results)
            
            return {
                "success": True,
                "data": search_results,
                "query": query,
                "total": len(search_results),
                "cached": False,
                "message": f"Found {len(search_results)} similar products"
            }
            
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return {
                "success": False,
                "message": f"Search failed: {str(e)}",
                "data": [],
                "query": query,
                "total": 0,
                "cached": False
            }
    
    async def _apply_filters(self, results: List[Dict], filters: Dict) -> List[Dict]:
        """Apply additional filters to search results"""
        try:
            filtered_results = []
            
            for result in results:
                metadata = result.get("metadata", {})
                include = True
                
                # Apply category filter
                if "category" in filters and metadata.get("category") != filters["category"]:
                    include = False
                
                # Apply brand filter
                if "brand" in filters and metadata.get("brand") != filters["brand"]:
                    include = False
                
                # Apply price range filter
                if "price_min" in filters:
                    price = metadata.get("price", 0)
                    if price < filters["price_min"]:
                        include = False
                
                if "price_max" in filters:
                    price = metadata.get("price", float('inf'))
                    if price > filters["price_max"]:
                        include = False
                
                if include:
                    filtered_results.append(result)
            
            return filtered_results
            
        except Exception as e:
            logger.error(f"Failed to apply filters: {e}")
            return results
    
    async def index_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Index a product for search"""
        try:
            if not self._initialized:
                return {
                    "success": False,
                    "message": "Search service not initialized"
                }
            
            product_id = product_data.get("id")
            if not product_id:
                return {
                    "success": False,
                    "message": "Product ID is required"
                }
            
            # Create embedding
            embedding = await self.ai_model_manager.create_product_embedding(product_data)
            if not embedding:
                return {
                    "success": False,
                    "message": "Failed to create product embedding"
                }
            
            # Insert into Milvus
            success = await self.milvus_manager.insert_vectors(
                vectors=[embedding],
                product_ids=[str(product_id)],
                metadata=[product_data]
            )
            
            if success:
                # Cache embedding
                await self.redis_cache_manager.cache_product_embedding(
                    str(product_id), embedding
                )
                
                return {
                    "success": True,
                    "message": f"Product {product_id} indexed successfully"
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to index product"
                }
                
        except Exception as e:
            logger.error(f"Failed to index product: {e}")
            return {
                "success": False,
                "message": f"Indexing failed: {str(e)}"
            }
    
    async def remove_product(self, product_id: str) -> Dict[str, Any]:
        """Remove a product from search index"""
        try:
            if not self._initialized:
                return {
                    "success": False,
                    "message": "Search service not initialized"
                }
            
            # Remove from Milvus
            success = await self.milvus_manager.delete_vectors([str(product_id)])
            
            if success:
                # Invalidate cache
                await self.redis_cache_manager.invalidate_product_cache(str(product_id))
                
                return {
                    "success": True,
                    "message": f"Product {product_id} removed from index"
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to remove product from index"
                }
                
        except Exception as e:
            logger.error(f"Failed to remove product: {e}")
            return {
                "success": False,
                "message": f"Removal failed: {str(e)}"
            }
    
    async def get_search_suggestions(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """Get search suggestions"""
        try:
            if not self._initialized:
                return {
                    "success": False,
                    "message": "Search service not initialized",
                    "suggestions": []
                }
            
            # This is a simplified implementation
            # In production, you would use a more sophisticated approach
            suggestions = await self.redis_cache_manager.get_search_suggestions(query, limit)
            
            return {
                "success": True,
                "data": suggestions,
                "query": query,
                "message": f"Found {len(suggestions)} suggestions"
            }
            
        except Exception as e:
            logger.error(f"Failed to get suggestions: {e}")
            return {
                "success": False,
                "message": f"Failed to get suggestions: {str(e)}",
                "suggestions": []
            }
    
    async def get_service_stats(self) -> Dict[str, Any]:
        """Get service statistics"""
        try:
            stats = {
                "milvus": await self.milvus_manager.get_collection_stats(),
                "ai_model": await self.ai_model_manager.get_model_info(),
                "redis": await self.redis_cache_manager.get_cache_stats(),
                "initialized": self._initialized
            }
            
            return {
                "success": True,
                "data": stats,
                "message": "Service statistics retrieved"
            }
            
        except Exception as e:
            logger.error(f"Failed to get service stats: {e}")
            return {
                "success": False,
                "message": f"Failed to get stats: {str(e)}"
            }
    
    def is_initialized(self) -> bool:
        """Check if service is initialized"""
        return self._initialized

# Dependency function for FastAPI
async def get_search_controller() -> SearchController:
    """Get search controller instance"""
    # This will be injected by the main app
    pass
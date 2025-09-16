#!/usr/bin/env python3
"""
Milvus 電商系統初始化腳本
向量資料庫：AI 推薦、相似商品檢索、個人化搜尋
"""

import sys
import json
import numpy as np
from pymilvus import (
    connections,
    Collection,
    CollectionSchema,
    FieldSchema,
    DataType,
    utility
)

# Milvus 連線設定
MILVUS_HOST = "localhost"
MILVUS_PORT = 19530
MILVUS_USER = "root"
MILVUS_PASSWORD = "Milvus"

def connect_to_milvus():
    """連接到 Milvus 伺服器"""
    try:
        connections.connect(
            alias="default",
            host=MILVUS_HOST,
            port=MILVUS_PORT,
            user=MILVUS_USER,
            password=MILVUS_PASSWORD
        )
        print("✅ Milvus 連線成功！")
        return True
    except Exception as e:
        print(f"❌ Milvus 連線失敗: {e}")
        return False

def create_product_vectors_collection():
    """建立商品向量集合"""
    print("建立商品向量集合...")
    
    # 定義欄位
    fields = [
        FieldSchema(name="product_id", dtype=DataType.INT64, is_primary=True, auto_id=False),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=512),
        FieldSchema(name="category_id", dtype=DataType.INT64),
        FieldSchema(name="price_range", dtype=DataType.INT64),
        FieldSchema(name="brand", dtype=DataType.VARCHAR, max_length=100),
        FieldSchema(name="created_at", dtype=DataType.INT64)
    ]
    
    # 建立集合 Schema
    schema = CollectionSchema(
        fields=fields,
        description="商品特徵向量集合",
        enable_dynamic_field=True
    )
    
    # 建立集合
    collection_name = "product_vectors"
    if utility.has_collection(collection_name):
        print(f"集合 {collection_name} 已存在，刪除舊集合...")
        utility.drop_collection(collection_name)
    
    collection = Collection(
        name=collection_name,
        schema=schema,
        using='default',
        shards_num=2
    )
    
    # 建立索引
    index_params = {
        "metric_type": "L2",
        "index_type": "IVF_SQ8",
        "params": {"nlist": 1024}
    }
    
    collection.create_index(
        field_name="embedding",
        index_params=index_params
    )
    
    print(f"✅ 商品向量集合 {collection_name} 建立完成")
    return collection

def create_user_vectors_collection():
    """建立用戶向量集合"""
    print("建立用戶向量集合...")
    
    # 定義欄位
    fields = [
        FieldSchema(name="user_id", dtype=DataType.INT64, is_primary=True, auto_id=False),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=256),
        FieldSchema(name="age_group", dtype=DataType.INT64),
        FieldSchema(name="preference_category", dtype=DataType.INT64),
        FieldSchema(name="gender", dtype=DataType.VARCHAR, max_length=10),
        FieldSchema(name="created_at", dtype=DataType.INT64)
    ]
    
    # 建立集合 Schema
    schema = CollectionSchema(
        fields=fields,
        description="用戶行為特徵向量集合",
        enable_dynamic_field=True
    )
    
    # 建立集合
    collection_name = "user_vectors"
    if utility.has_collection(collection_name):
        print(f"集合 {collection_name} 已存在，刪除舊集合...")
        utility.drop_collection(collection_name)
    
    collection = Collection(
        name=collection_name,
        schema=schema,
        using='default',
        shards_num=2
    )
    
    # 建立索引
    index_params = {
        "metric_type": "L2",
        "index_type": "IVF_SQ8",
        "params": {"nlist": 512}
    }
    
    collection.create_index(
        field_name="embedding",
        index_params=index_params
    )
    
    print(f"✅ 用戶向量集合 {collection_name} 建立完成")
    return collection

def create_search_history_collection():
    """建立搜尋歷史集合"""
    print("建立搜尋歷史集合...")
    
    # 定義欄位
    fields = [
        FieldSchema(name="search_id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="user_id", dtype=DataType.INT64),
        FieldSchema(name="query_vector", dtype=DataType.FLOAT_VECTOR, dim=256),
        FieldSchema(name="query_text", dtype=DataType.VARCHAR, max_length=500),
        FieldSchema(name="results_count", dtype=DataType.INT64),
        FieldSchema(name="clicked_products", dtype=DataType.VARCHAR, max_length=1000),
        FieldSchema(name="search_timestamp", dtype=DataType.INT64)
    ]
    
    # 建立集合 Schema
    schema = CollectionSchema(
        fields=fields,
        description="用戶搜尋歷史集合",
        enable_dynamic_field=True
    )
    
    # 建立集合
    collection_name = "search_history"
    if utility.has_collection(collection_name):
        print(f"集合 {collection_name} 已存在，刪除舊集合...")
        utility.drop_collection(collection_name)
    
    collection = Collection(
        name=collection_name,
        schema=schema,
        using='default',
        shards_num=2
    )
    
    # 建立索引
    index_params = {
        "metric_type": "L2",
        "index_type": "IVF_SQ8",
        "params": {"nlist": 512}
    }
    
    collection.create_index(
        field_name="query_vector",
        index_params=index_params
    )
    
    # 建立其他索引
    collection.create_index(
        field_name="user_id",
        index_params={"index_type": "STL_SORT"}
    )
    
    print(f"✅ 搜尋歷史集合 {collection_name} 建立完成")
    return collection

def insert_sample_product_data(collection):
    """插入範例商品向量資料"""
    print("插入範例商品向量資料...")
    
    # 生成範例資料
    product_ids = [1, 2, 3, 4, 5]
    category_ids = [1, 1, 1, 2, 2]  # 電子產品, 電子產品, 電子產品, 服飾, 服飾
    price_ranges = [3, 4, 2, 1, 1]  # 價格區間編碼
    brands = ["Apple", "Apple", "Apple", "Nike", "Adidas"]
    
    # 生成隨機向量 (512 維)
    embeddings = []
    for i in range(len(product_ids)):
        # 根據類別和品牌生成相似的向量
        base_vector = np.random.random(512).astype(np.float32)
        # 讓同類別的商品向量更相似
        if category_ids[i] == 1:  # 電子產品
            base_vector[:100] += 0.5  # 增加電子產品特徵
        elif category_ids[i] == 2:  # 服飾
            base_vector[100:200] += 0.5  # 增加服飾特徵
        
        embeddings.append(base_vector.tolist())
    
    # 準備插入資料
    data = [
        product_ids,
        embeddings,
        category_ids,
        price_ranges,
        brands,
        [int(np.datetime64('now').astype('datetime64[s]').astype(int))] * len(product_ids)
    ]
    
    # 插入資料
    collection.insert(data)
    collection.flush()
    
    print(f"✅ 已插入 {len(product_ids)} 筆商品向量資料")

def insert_sample_user_data(collection):
    """插入範例用戶向量資料"""
    print("插入範例用戶向量資料...")
    
    # 生成範例資料
    user_ids = [1, 2, 3]
    age_groups = [2, 3, 1]  # 年齡層編碼: 1=青年, 2=中年, 3=老年
    preference_categories = [1, 1, 2]  # 偏好類別: 1=電子產品, 2=服飾
    genders = ["M", "F", "M"]
    
    # 生成隨機向量 (256 維)
    embeddings = []
    for i in range(len(user_ids)):
        # 根據偏好生成向量
        base_vector = np.random.random(256).astype(np.float32)
        if preference_categories[i] == 1:  # 偏好電子產品
            base_vector[:50] += 0.3
        elif preference_categories[i] == 2:  # 偏好服飾
            base_vector[50:100] += 0.3
        
        embeddings.append(base_vector.tolist())
    
    # 準備插入資料
    data = [
        user_ids,
        embeddings,
        age_groups,
        preference_categories,
        genders,
        [int(np.datetime64('now').astype('datetime64[s]').astype(int))] * len(user_ids)
    ]
    
    # 插入資料
    collection.insert(data)
    collection.flush()
    
    print(f"✅ 已插入 {len(user_ids)} 筆用戶向量資料")

def insert_sample_search_data(collection):
    """插入範例搜尋歷史資料"""
    print("插入範例搜尋歷史資料...")
    
    # 生成範例資料
    user_ids = [1, 1, 2, 2, 3]
    query_texts = [
        "iPhone 15 Pro 手機",
        "MacBook Pro 筆記型電腦",
        "Nike 運動鞋",
        "Adidas 衣服",
        "藍牙耳機"
    ]
    
    # 生成查詢向量 (256 維)
    query_vectors = []
    for i in range(len(user_ids)):
        base_vector = np.random.random(256).astype(np.float32)
        # 根據查詢內容調整向量
        if "iPhone" in query_texts[i] or "MacBook" in query_texts[i]:
            base_vector[:50] += 0.4  # 電子產品特徵
        elif "Nike" in query_texts[i] or "Adidas" in query_texts[i]:
            base_vector[50:100] += 0.4  # 服飾特徵
        
        query_vectors.append(base_vector.tolist())
    
    results_counts = [5, 3, 8, 12, 6]
    clicked_products = ["1", "2", "4", "5", "3"]
    
    # 準備插入資料
    data = [
        user_ids,
        query_vectors,
        query_texts,
        results_counts,
        clicked_products,
        [int(np.datetime64('now').astype('datetime64[s]').astype(int))] * len(user_ids)
    ]
    
    # 插入資料
    collection.insert(data)
    collection.flush()
    
    print(f"✅ 已插入 {len(user_ids)} 筆搜尋歷史資料")

def create_recommendation_collection():
    """建立推薦結果集合"""
    print("建立推薦結果集合...")
    
    # 定義欄位
    fields = [
        FieldSchema(name="rec_id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="user_id", dtype=DataType.INT64),
        FieldSchema(name="product_id", dtype=DataType.INT64),
        FieldSchema(name="score", dtype=DataType.FLOAT),
        FieldSchema(name="algorithm", dtype=DataType.VARCHAR, max_length=50),
        FieldSchema(name="created_at", dtype=DataType.INT64)
    ]
    
    # 建立集合 Schema
    schema = CollectionSchema(
        fields=fields,
        description="推薦結果集合",
        enable_dynamic_field=True
    )
    
    # 建立集合
    collection_name = "recommendations"
    if utility.has_collection(collection_name):
        print(f"集合 {collection_name} 已存在，刪除舊集合...")
        utility.drop_collection(collection_name)
    
    collection = Collection(
        name=collection_name,
        schema=schema,
        using='default',
        shards_num=2
    )
    
    # 建立索引
    collection.create_index(
        field_name="user_id",
        index_params={"index_type": "STL_SORT"}
    )
    
    collection.create_index(
        field_name="score",
        index_params={"index_type": "STL_SORT"}
    )
    
    print(f"✅ 推薦結果集合 {collection_name} 建立完成")
    return collection

def insert_sample_recommendations(collection):
    """插入範例推薦資料"""
    print("插入範例推薦資料...")
    
    # 生成範例推薦資料
    user_ids = [1, 1, 1, 2, 2, 2, 3, 3, 3]
    product_ids = [1, 2, 3, 1, 3, 4, 2, 4, 5]
    scores = [0.95, 0.87, 0.82, 0.91, 0.78, 0.85, 0.88, 0.79, 0.83]
    algorithms = ["collaborative_filtering", "content_based", "hybrid"] * 3
    
    # 準備插入資料
    data = [
        user_ids,
        product_ids,
        scores,
        algorithms,
        [int(np.datetime64('now').astype('datetime64[s]').astype(int))] * len(user_ids)
    ]
    
    # 插入資料
    collection.insert(data)
    collection.flush()
    
    print(f"✅ 已插入 {len(user_ids)} 筆推薦資料")

def test_vector_search():
    """測試向量搜尋功能"""
    print("測試向量搜尋功能...")
    
    # 載入集合
    product_collection = Collection("product_vectors")
    product_collection.load()
    
    user_collection = Collection("user_vectors")
    user_collection.load()
    
    # 生成測試查詢向量
    query_vector = np.random.random(512).astype(np.float32).tolist()
    
    # 執行搜尋
    search_params = {
        "metric_type": "L2",
        "params": {"nprobe": 10}
    }
    
    results = product_collection.search(
        data=[query_vector],
        anns_field="embedding",
        param=search_params,
        limit=3,
        output_fields=["product_id", "category_id", "brand"]
    )
    
    print("✅ 向量搜尋測試完成")
    print(f"搜尋結果數量: {len(results[0])}")
    for hit in results[0]:
        print(f"  - 商品ID: {hit.entity.get('product_id')}, 距離: {hit.distance:.4f}")

def create_collections_and_insert_data():
    """建立所有集合並插入資料"""
    print("開始建立 Milvus 集合和插入資料...")
    
    # 建立集合
    product_collection = create_product_vectors_collection()
    user_collection = create_user_vectors_collection()
    search_collection = create_search_history_collection()
    rec_collection = create_recommendation_collection()
    
    # 插入範例資料
    insert_sample_product_data(product_collection)
    insert_sample_user_data(user_collection)
    insert_sample_search_data(search_collection)
    insert_sample_recommendations(rec_collection)
    
    print("✅ 所有集合建立和資料插入完成")

def show_collection_info():
    """顯示集合資訊"""
    print("\n📊 Milvus 集合資訊:")
    print("=" * 50)
    
    collections = utility.list_collections()
    for collection_name in collections:
        collection = Collection(collection_name)
        print(f"\n集合名稱: {collection_name}")
        print(f"描述: {collection.description}")
        print(f"分片數: {collection.num_shards}")
        print(f"實體數量: {collection.num_entities}")
        
        # 顯示欄位資訊
        print("欄位:")
        for field in collection.schema.fields:
            print(f"  - {field.name}: {field.dtype}")

def main():
    """主函數"""
    print("🚀 開始初始化 Milvus 電商系統...")
    print("=" * 50)
    
    # 連接到 Milvus
    if not connect_to_milvus():
        sys.exit(1)
    
    try:
        # 建立集合和插入資料
        create_collections_and_insert_data()
        
        # 測試搜尋功能
        test_vector_search()
        
        # 顯示集合資訊
        show_collection_info()
        
        print("\n" + "=" * 50)
        print("🎉 Milvus 電商系統初始化完成！")
        print("=" * 50)
        print("已建立的集合:")
        print("- product_vectors: 商品特徵向量")
        print("- user_vectors: 用戶行為向量")
        print("- search_history: 搜尋歷史")
        print("- recommendations: 推薦結果")
        print("\nMilvus 連線資訊:")
        print(f"Host: {MILVUS_HOST}")
        print(f"Port: {MILVUS_PORT}")
        print(f"User: {MILVUS_USER}")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ 初始化過程中發生錯誤: {e}")
        sys.exit(1)
    
    finally:
        # 關閉連線
        connections.disconnect("default")
        print("🔌 Milvus 連線已關閉")

if __name__ == "__main__":
    main()

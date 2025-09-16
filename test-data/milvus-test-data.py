#!/usr/bin/env python3
"""
Milvus 電商系統測試資料
擴展現有初始化腳本的測試資料
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

def insert_extended_product_data(collection):
    """插入擴展商品向量資料"""
    print("插入擴展商品向量資料...")
    
    # 生成擴展商品資料
    product_ids = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    category_ids = [6, 6, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 10, 10, 1, 1, 1, 2, 2]  # 對應新分類
    price_ranges = [4, 3, 3, 2, 2, 2, 1, 1, 2, 1, 1, 3, 1, 3, 4, 3, 4, 2, 1, 1]  # 價格區間編碼
    brands = ["SK-II", "Lancôme", "Estée Lauder", "MAC", "Dior", "日本直送", "台灣茶葉", "維他命", 
              "Royal Canin", "貓砂品牌", "魚缸品牌", "Garmin", "機油品牌", "登山品牌", "露營品牌",
              "Apple", "Apple", "Apple", "Nike", "Adidas"]
    
    # 生成隨機向量 (512 維)
    embeddings = []
    for i in range(len(product_ids)):
        # 根據類別和品牌生成相似的向量
        base_vector = np.random.random(512).astype(np.float32)
        
        # 讓同類別的商品向量更相似
        if category_ids[i] == 6:  # 美妝保養
            base_vector[:100] += 0.6  # 增加美妝特徵
        elif category_ids[i] == 7:  # 食品飲料
            base_vector[100:200] += 0.6  # 增加食品特徵
        elif category_ids[i] == 8:  # 寵物用品
            base_vector[200:300] += 0.6  # 增加寵物特徵
        elif category_ids[i] == 9:  # 汽車用品
            base_vector[300:400] += 0.6  # 增加汽車特徵
        elif category_ids[i] == 10:  # 戶外運動
            base_vector[400:512] += 0.6  # 增加戶外特徵
        
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
    
    print(f"✅ 已插入 {len(product_ids)} 筆擴展商品向量資料")

def insert_extended_user_data(collection):
    """插入擴展用戶向量資料"""
    print("插入擴展用戶向量資料...")
    
    # 生成擴展用戶資料
    user_ids = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    age_groups = [3, 2, 1, 4, 2, 1, 3, 2, 1, 3]  # 年齡層編碼: 1=18-24, 2=25-34, 3=35-44, 4=45+
    preference_categories = [6, 6, 6, 7, 7, 8, 8, 9, 9, 10]  # 偏好類別
    genders = ["F", "F", "F", "M", "F", "M", "F", "M", "F", "M"]
    
    # 生成隨機向量 (256 維)
    embeddings = []
    for i in range(len(user_ids)):
        # 根據偏好生成向量
        base_vector = np.random.random(256).astype(np.float32)
        
        if preference_categories[i] == 6:  # 偏好美妝保養
            base_vector[:50] += 0.4
        elif preference_categories[i] == 7:  # 偏好食品飲料
            base_vector[50:100] += 0.4
        elif preference_categories[i] == 8:  # 偏好寵物用品
            base_vector[100:150] += 0.4
        elif preference_categories[i] == 9:  # 偏好汽車用品
            base_vector[150:200] += 0.4
        elif preference_categories[i] == 10:  # 偏好戶外運動
            base_vector[200:256] += 0.4
        
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
    
    print(f"✅ 已插入 {len(user_ids)} 筆擴展用戶向量資料")

def insert_extended_search_data(collection):
    """插入擴展搜尋歷史資料"""
    print("插入擴展搜尋歷史資料...")
    
    # 生成擴展搜尋資料
    user_ids = [4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
    query_texts = [
        "SK-II 青春露 護膚",
        "蘭蔻 小黑瓶 精華",
        "MAC 口紅 色號",
        "Dior 香水 推薦",
        "日本零食 禮盒",
        "台灣茶葉 高山",
        "維他命C 發泡錠",
        "皇家狗糧 成犬",
        "貓砂 除臭",
        "魚缸 過濾器",
        "汽車 行車記錄器",
        "機油 保養",
        "登山 背包",
        "露營 帳篷",
        "iPhone 15 Pro 手機",
        "MacBook Pro 筆記型電腦",
        "AirPods Pro 耳機",
        "Nike 運動鞋",
        "Adidas 衣服",
        "藍牙耳機 推薦"
    ]
    
    # 生成查詢向量 (256 維)
    query_vectors = []
    for i in range(len(user_ids)):
        base_vector = np.random.random(256).astype(np.float32)
        
        # 根據查詢內容調整向量
        if "SK-II" in query_texts[i] or "蘭蔻" in query_texts[i] or "MAC" in query_texts[i]:
            base_vector[:50] += 0.5  # 美妝特徵
        elif "日本零食" in query_texts[i] or "茶葉" in query_texts[i] or "維他命" in query_texts[i]:
            base_vector[50:100] += 0.5  # 食品特徵
        elif "狗糧" in query_texts[i] or "貓砂" in query_texts[i] or "魚缸" in query_texts[i]:
            base_vector[100:150] += 0.5  # 寵物特徵
        elif "汽車" in query_texts[i] or "機油" in query_texts[i]:
            base_vector[150:200] += 0.5  # 汽車特徵
        elif "登山" in query_texts[i] or "露營" in query_texts[i]:
            base_vector[200:256] += 0.5  # 戶外特徵
        
        query_vectors.append(base_vector.tolist())
    
    results_counts = [5, 3, 8, 6, 12, 4, 7, 9, 5, 3, 6, 4, 8, 2, 10, 3, 15, 20, 12, 18]
    clicked_products = ["6", "7", "9", "10", "11", "12", "13", "14", "15", "16", "18", "19", "22", "23", "1", "2", "3", "4", "5", "3"]
    
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
    
    print(f"✅ 已插入 {len(user_ids)} 筆擴展搜尋歷史資料")

def insert_extended_recommendations(collection):
    """插入擴展推薦資料"""
    print("插入擴展推薦資料...")
    
    # 生成擴展推薦資料
    user_ids = [4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12, 13, 13, 13]
    product_ids = [7, 8, 9, 6, 8, 10, 9, 10, 11, 11, 12, 13, 12, 13, 14, 14, 15, 16, 15, 16, 17, 17, 18, 19, 18, 19, 20, 20, 21, 22]
    scores = [0.95, 0.87, 0.82, 0.91, 0.78, 0.85, 0.88, 0.79, 0.83, 0.92, 0.76, 0.89, 0.85, 0.81, 0.94, 0.77, 0.86, 0.80, 0.93, 0.75, 0.84, 0.90, 0.78, 0.82, 0.87, 0.74, 0.79, 0.91, 0.73, 0.77]
    algorithms = ["collaborative_filtering", "content_based", "hybrid"] * 10
    
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
    
    print(f"✅ 已插入 {len(user_ids)} 筆擴展推薦資料")

def create_user_behavior_collection():
    """建立用戶行為集合"""
    print("建立用戶行為集合...")
    
    # 定義欄位
    fields = [
        FieldSchema(name="behavior_id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="user_id", dtype=DataType.INT64),
        FieldSchema(name="product_id", dtype=DataType.INT64),
        FieldSchema(name="behavior_vector", dtype=DataType.FLOAT_VECTOR, dim=128),
        FieldSchema(name="behavior_type", dtype=DataType.VARCHAR, max_length=50),
        FieldSchema(name="duration", dtype=DataType.INT64),
        FieldSchema(name="timestamp", dtype=DataType.INT64)
    ]
    
    # 建立集合 Schema
    schema = CollectionSchema(
        fields=fields,
        description="用戶行為特徵向量集合",
        enable_dynamic_field=True
    )
    
    # 建立集合
    collection_name = "user_behavior"
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
        "params": {"nlist": 256}
    }
    
    collection.create_index(
        field_name="behavior_vector",
        index_params=index_params
    )
    
    collection.create_index(
        field_name="user_id",
        index_params={"index_type": "STL_SORT"}
    )
    
    print(f"✅ 用戶行為集合 {collection_name} 建立完成")
    return collection

def insert_user_behavior_data(collection):
    """插入用戶行為資料"""
    print("插入用戶行為資料...")
    
    # 生成用戶行為資料
    user_ids = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10]
    product_ids = [1, 2, 3, 1, 3, 4, 2, 4, 5, 6, 7, 8, 7, 8, 9, 9, 10, 11, 11, 12, 13, 12, 13, 14, 14, 15, 16, 15, 16, 17]
    behavior_types = ["view", "click", "add_to_cart", "view", "click", "purchase", "view", "click", "add_to_cart", 
                     "view", "click", "wishlist_add", "view", "click", "add_to_cart", "view", "click", "purchase",
                     "view", "click", "add_to_cart", "view", "click", "wishlist_add", "view", "click", "add_to_cart",
                     "view", "click", "purchase"]
    durations = [120, 5, 30, 180, 10, 300, 90, 8, 45, 200, 12, 60, 150, 7, 40, 160, 9, 280, 140, 11, 50, 170, 6, 35, 130, 8, 55, 190, 10, 320]
    
    # 生成行為向量 (128 維)
    behavior_vectors = []
    for i in range(len(user_ids)):
        base_vector = np.random.random(128).astype(np.float32)
        
        # 根據行為類型調整向量
        if behavior_types[i] == "view":
            base_vector[:32] += 0.3
        elif behavior_types[i] == "click":
            base_vector[32:64] += 0.3
        elif behavior_types[i] == "add_to_cart":
            base_vector[64:96] += 0.3
        elif behavior_types[i] == "purchase":
            base_vector[96:128] += 0.3
        elif behavior_types[i] == "wishlist_add":
            base_vector[64:96] += 0.2
            base_vector[96:128] += 0.1
        
        behavior_vectors.append(base_vector.tolist())
    
    # 準備插入資料
    data = [
        user_ids,
        product_ids,
        behavior_vectors,
        behavior_types,
        durations,
        [int(np.datetime64('now').astype('datetime64[s]').astype(int))] * len(user_ids)
    ]
    
    # 插入資料
    collection.insert(data)
    collection.flush()
    
    print(f"✅ 已插入 {len(user_ids)} 筆用戶行為資料")

def create_product_similarity_collection():
    """建立商品相似度集合"""
    print("建立商品相似度集合...")
    
    # 定義欄位
    fields = [
        FieldSchema(name="similarity_id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="product_id_1", dtype=DataType.INT64),
        FieldSchema(name="product_id_2", dtype=DataType.INT64),
        FieldSchema(name="similarity_score", dtype=DataType.FLOAT),
        FieldSchema(name="similarity_type", dtype=DataType.VARCHAR, max_length=50),
        FieldSchema(name="created_at", dtype=DataType.INT64)
    ]
    
    # 建立集合 Schema
    schema = CollectionSchema(
        fields=fields,
        description="商品相似度集合",
        enable_dynamic_field=True
    )
    
    # 建立集合
    collection_name = "product_similarity"
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
        field_name="product_id_1",
        index_params={"index_type": "STL_SORT"}
    )
    
    collection.create_index(
        field_name="similarity_score",
        index_params={"index_type": "STL_SORT"}
    )
    
    print(f"✅ 商品相似度集合 {collection_name} 建立完成")
    return collection

def insert_product_similarity_data(collection):
    """插入商品相似度資料"""
    print("插入商品相似度資料...")
    
    # 生成商品相似度資料
    product_id_1s = [1, 1, 1, 2, 2, 2, 3, 3, 3, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 11, 11, 11, 14, 14, 14, 18, 18, 18]
    product_id_2s = [2, 3, 4, 1, 3, 5, 1, 2, 4, 7, 8, 9, 6, 8, 9, 6, 7, 9, 6, 7, 8, 12, 13, 14, 15, 16, 17, 19, 20, 21]
    similarity_scores = [0.85, 0.78, 0.72, 0.85, 0.82, 0.75, 0.78, 0.82, 0.80, 0.90, 0.88, 0.85, 0.90, 0.88, 0.87, 0.88, 0.87, 0.86, 0.85, 0.87, 0.86, 0.92, 0.89, 0.85, 0.94, 0.91, 0.88, 0.93, 0.90, 0.87]
    similarity_types = ["content_based", "collaborative_filtering", "hybrid"] * 10
    
    # 準備插入資料
    data = [
        product_id_1s,
        product_id_2s,
        similarity_scores,
        similarity_types,
        [int(np.datetime64('now').astype('datetime64[s]').astype(int))] * len(product_id_1s)
    ]
    
    # 插入資料
    collection.insert(data)
    collection.flush()
    
    print(f"✅ 已插入 {len(product_id_1s)} 筆商品相似度資料")

def test_extended_vector_search():
    """測試擴展向量搜尋功能"""
    print("測試擴展向量搜尋功能...")
    
    # 載入集合
    product_collection = Collection("product_vectors")
    product_collection.load()
    
    user_collection = Collection("user_vectors")
    user_collection.load()
    
    behavior_collection = Collection("user_behavior")
    behavior_collection.load()
    
    # 生成測試查詢向量
    query_vector = np.random.random(512).astype(np.float32).tolist()
    user_query_vector = np.random.random(256).astype(np.float32).tolist()
    behavior_query_vector = np.random.random(128).astype(np.float32).tolist()
    
    # 執行商品搜尋
    search_params = {
        "metric_type": "L2",
        "params": {"nprobe": 10}
    }
    
    product_results = product_collection.search(
        data=[query_vector],
        anns_field="embedding",
        param=search_params,
        limit=5,
        output_fields=["product_id", "category_id", "brand"]
    )
    
    # 執行用戶搜尋
    user_results = user_collection.search(
        data=[user_query_vector],
        anns_field="embedding",
        param=search_params,
        limit=3,
        output_fields=["user_id", "age_group", "preference_category"]
    )
    
    # 執行行為搜尋
    behavior_results = behavior_collection.search(
        data=[behavior_query_vector],
        anns_field="behavior_vector",
        param=search_params,
        limit=5,
        output_fields=["user_id", "product_id", "behavior_type"]
    )
    
    print("✅ 擴展向量搜尋測試完成")
    print(f"商品搜尋結果數量: {len(product_results[0])}")
    print(f"用戶搜尋結果數量: {len(user_results[0])}")
    print(f"行為搜尋結果數量: {len(behavior_results[0])}")
    
    for hit in product_results[0][:3]:
        print(f"  - 商品ID: {hit.entity.get('product_id')}, 距離: {hit.distance:.4f}")

def show_extended_collection_info():
    """顯示擴展集合資訊"""
    print("\n📊 Milvus 擴展集合資訊:")
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
    print("🚀 開始插入 Milvus 擴展測試資料...")
    print("=" * 50)
    
    # 連接到 Milvus
    if not connect_to_milvus():
        sys.exit(1)
    
    try:
        # 載入現有集合
        product_collection = Collection("product_vectors")
        user_collection = Collection("user_vectors")
        search_collection = Collection("search_history")
        rec_collection = Collection("recommendations")
        
        # 插入擴展資料
        insert_extended_product_data(product_collection)
        insert_extended_user_data(user_collection)
        insert_extended_search_data(search_collection)
        insert_extended_recommendations(rec_collection)
        
        # 建立新集合
        behavior_collection = create_user_behavior_collection()
        similarity_collection = create_product_similarity_collection()
        
        # 插入新集合資料
        insert_user_behavior_data(behavior_collection)
        insert_product_similarity_data(similarity_collection)
        
        # 測試搜尋功能
        test_extended_vector_search()
        
        # 顯示集合資訊
        show_extended_collection_info()
        
        print("\n" + "=" * 50)
        print("🎉 Milvus 擴展測試資料插入完成！")
        print("=" * 50)
        print("已插入的擴展集合:")
        print("- product_vectors: 擴展商品特徵向量")
        print("- user_vectors: 擴展用戶行為向量")
        print("- search_history: 擴展搜尋歷史")
        print("- recommendations: 擴展推薦結果")
        print("- user_behavior: 用戶行為特徵向量")
        print("- product_similarity: 商品相似度")
        print("\nMilvus 連線資訊:")
        print(f"Host: {MILVUS_HOST}")
        print(f"Port: {MILVUS_PORT}")
        print(f"User: {MILVUS_USER}")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ 插入過程中發生錯誤: {e}")
        sys.exit(1)
    
    finally:
        # 關閉連線
        connections.disconnect("default")
        print("🔌 Milvus 連線已關閉")

if __name__ == "__main__":
    main()

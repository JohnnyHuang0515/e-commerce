#!/usr/bin/env python3
"""
Milvus 測試資料生成腳本
在主機上運行，連接到 Milvus 容器生成測試向量資料
"""

import numpy as np
import time
import sys

try:
    from pymilvus import connections, Collection, CollectionSchema, DataType, FieldSchema, utility
except ImportError:
    print("❌ 請安裝 pymilvus: pip3 install pymilvus")
    sys.exit(1)

def connect_to_milvus():
    """連接到 Milvus 服務"""
    try:
        connections.connect(
            alias="default",
            host="localhost",
            port="19531",
            user="root",
            password="Milvus"
        )
        print("✅ 成功連接到 Milvus")
        return True
    except Exception as e:
        print(f"❌ 連接 Milvus 失敗: {e}")
        return False

def create_test_collection():
    """創建測試集合"""
    collection_name = "ecommerce_products"
    
    # 檢查集合是否已存在
    if utility.has_collection(collection_name):
        print(f"⚠️ 集合 {collection_name} 已存在，先刪除...")
        utility.drop_collection(collection_name)
    
    # 定義集合架構
    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=False),
        FieldSchema(name="product_id", dtype=DataType.INT64),
        FieldSchema(name="product_name", dtype=DataType.VARCHAR, max_length=200),
        FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=100),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=128)
    ]
    
    schema = CollectionSchema(fields, "電商商品向量集合")
    collection = Collection(collection_name, schema)
    
    print(f"✅ 成功創建集合 {collection_name}")
    return collection

def generate_test_vectors():
    """生成測試向量資料"""
    # 模擬商品資料
    products = [
        {"id": 1, "product_id": 101, "name": "iPhone 15 Pro", "category": "電子產品"},
        {"id": 2, "product_id": 102, "name": "MacBook Air M2", "category": "電腦"},
        {"id": 3, "product_id": 103, "name": "AirPods Pro", "category": "音響"},
        {"id": 4, "product_id": 104, "name": "iPad Air", "category": "平板"},
        {"id": 5, "product_id": 105, "name": "Apple Watch", "category": "穿戴裝置"},
        {"id": 6, "product_id": 106, "name": "Samsung Galaxy S24", "category": "電子產品"},
        {"id": 7, "product_id": 107, "name": "Dell XPS 13", "category": "電腦"},
        {"id": 8, "product_id": 108, "name": "Sony WH-1000XM5", "category": "音響"},
        {"id": 9, "product_id": 109, "name": "Surface Pro 9", "category": "平板"},
        {"id": 10, "product_id": 110, "name": "Garmin Fenix 7", "category": "穿戴裝置"},
        {"id": 11, "product_id": 111, "name": "Nike Air Max", "category": "運動鞋"},
        {"id": 12, "product_id": 112, "name": "Adidas Ultraboost", "category": "運動鞋"},
        {"id": 13, "product_id": 113, "name": "Levi's 501 牛仔褲", "category": "服裝"},
        {"id": 14, "product_id": 114, "name": "Uniqlo 發熱衣", "category": "服裝"},
        {"id": 15, "product_id": 115, "name": "IKEA 書桌", "category": "家具"},
        {"id": 16, "product_id": 116, "name": "無印良品收納盒", "category": "家具"},
        {"id": 17, "product_id": 117, "name": "Dyson 吸塵器", "category": "家電"},
        {"id": 18, "product_id": 118, "name": "Panasonic 電飯鍋", "category": "家電"},
        {"id": 19, "product_id": 119, "name": "星巴克咖啡豆", "category": "食品"},
        {"id": 20, "product_id": 120, "name": "雀巢即溶咖啡", "category": "食品"},
    ]
    
    # 為每個商品生成 128 維向量
    data = {
        "id": [],
        "product_id": [],
        "product_name": [],
        "category": [],
        "embedding": []
    }
    
    for product in products:
        data["id"].append(int(product["id"]))
        data["product_id"].append(int(product["product_id"]))
        data["product_name"].append(str(product["name"]))
        data["category"].append(str(product["category"]))
        
        # 生成隨機向量（實際應用中會使用真實的商品特徵向量）
        vector = np.random.random(128).astype(np.float32)
        data["embedding"].append(vector)
    
    return data

def insert_test_data(collection, data):
    """插入測試資料"""
    try:
        mr = collection.insert(data)
        print(f"✅ 成功插入 {len(data['id'])} 條測試資料")
        
        # 建立索引以提高查詢性能
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        
        collection.create_index("embedding", index_params)
        print("✅ 成功創建索引")
        
        # 載入集合到記憶體
        collection.load()
        print("✅ 成功載入集合")
        
        return True
    except Exception as e:
        print(f"❌ 插入資料失敗: {e}")
        return False

def test_search(collection):
    """測試向量搜尋"""
    try:
        # 生成查詢向量
        search_vector = np.random.random(128).astype(np.float32).tolist()
        
        search_params = {
            "metric_type": "L2",
            "params": {"nprobe": 10}
        }
        
        results = collection.search(
            data=[search_vector],
            anns_field="embedding",
            param=search_params,
            limit=5,
            output_fields=["product_name", "category"]
        )
        
        print("✅ 搜尋測試成功，找到相似商品：")
        for i, result in enumerate(results[0]):
            print(f"  {i+1}. {result.entity.get('product_name')} ({result.entity.get('category')}) - 距離: {result.distance:.4f}")
        
        return True
    except Exception as e:
        print(f"❌ 搜尋測試失敗: {e}")
        return False

def main():
    """主函數"""
    print("🚀 開始生成 Milvus 測試資料...")
    
    # 連接到 Milvus
    if not connect_to_milvus():
        return False
    
    try:
        # 創建測試集合
        collection = create_test_collection()
        
        # 生成測試資料
        print("📊 生成測試向量資料...")
        test_data = generate_test_vectors()
        
        # 插入測試資料
        print("💾 插入測試資料...")
        if not insert_test_data(collection, test_data):
            return False
        
        # 測試搜尋功能
        print("🔍 測試向量搜尋...")
        if not test_search(collection):
            return False
        
        print("✅ Milvus 測試資料生成完成！")
        
        # 顯示統計資訊
        print(f"\n📈 統計資訊:")
        print(f"  集合名稱: ecommerce_products")
        print(f"  資料筆數: {collection.num_entities}")
        print(f"  向量維度: 128")
        print(f"  索引類型: IVF_FLAT")
        
        return True
        
    except Exception as e:
        print(f"❌ 生成測試資料失敗: {e}")
        return False
    
    finally:
        # 斷開連接
        connections.disconnect("default")
        print("🔌 已斷開 Milvus 連接")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

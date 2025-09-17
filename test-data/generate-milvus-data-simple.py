#!/usr/bin/env python3
"""
簡化版 Milvus 測試資料生成腳本
"""

import numpy as np
import sys

try:
    from pymilvus import connections, Collection, CollectionSchema, DataType, FieldSchema, utility
except ImportError:
    print("❌ 請安裝 pymilvus: pip3 install pymilvus")
    sys.exit(1)

def main():
    """主函數"""
    print("🚀 開始生成 Milvus 測試資料...")
    
    try:
        # 連接到 Milvus
        connections.connect(
            alias="default",
            host="localhost",
            port="19531",
            user="root",
            password="Milvus"
        )
        print("✅ 成功連接到 Milvus")
        
        collection_name = "test_collection"
        
        # 檢查並刪除現有集合
        if utility.has_collection(collection_name):
            utility.drop_collection(collection_name)
            print(f"⚠️ 已刪除現有集合 {collection_name}")
        
        # 創建簡單的集合架構
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=False),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=8)
        ]
        
        schema = CollectionSchema(fields, "簡單測試集合")
        collection = Collection(collection_name, schema)
        print(f"✅ 成功創建集合 {collection_name}")
        
        # 準備測試資料
        entities = [
            [1, 2, 3, 4, 5],  # id
            [
                [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
                [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
                [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
                [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.1],
                [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.1, 0.2]
            ]  # embedding
        ]
        
        # 插入資料
        mr = collection.insert(entities)
        print(f"✅ 成功插入 {len(entities[0])} 條測試資料")
        
        # 建立索引
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        
        collection.create_index("embedding", index_params)
        print("✅ 成功創建索引")
        
        # 載入集合
        collection.load()
        print("✅ 成功載入集合")
        
        # 測試搜尋
        search_vector = [[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]]
        search_params = {"metric_type": "L2", "params": {"nprobe": 10}}
        
        results = collection.search(
            data=search_vector,
            anns_field="embedding",
            param=search_params,
            limit=3
        )
        
        print("✅ 搜尋測試成功")
        print(f"📈 集合統計: {collection.num_entities} 條資料")
        
        return True
        
    except Exception as e:
        print(f"❌ 操作失敗: {e}")
        return False
    
    finally:
        try:
            connections.disconnect("default")
            print("🔌 已斷開 Milvus 連接")
        except:
            pass

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

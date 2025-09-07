// MongoDB 初始化腳本
db = db.getSiblingDB('ecommerce');

// 建立用戶
db.createUser({
  user: 'ecommerce_user',
  pwd: 'ecommerce_password',
  roles: [
    {
      role: 'readWrite',
      db: 'ecommerce'
    }
  ]
});

// 建立測試分類
const categories = db.categories.insertMany([
  {
    name: '智慧型手機',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '筆記型電腦',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '平板電腦',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 取得智慧型手機分類的 ID
const smartphoneCategory = db.categories.findOne({name: '智慧型手機'});
const laptopCategory = db.categories.findOne({name: '筆記型電腦'});
const tabletCategory = db.categories.findOne({name: '平板電腦'});

// 建立子分類
db.categories.insertMany([
  {
    name: 'iPhone',
    parentId: smartphoneCategory._id,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Android',
    parentId: smartphoneCategory._id,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 取得 iPhone 分類的 ID
const iphoneCategory = db.categories.findOne({name: 'iPhone'});

// 建立測試商品
db.products.insertMany([
  {
    name: 'iPhone 15 Pro',
    description: '最新款 iPhone，搭載 A17 Pro 晶片，拍照功能強大',
    price: 35900,
    categoryId: iphoneCategory._id,
    stock: 50,
    status: 'active',
    attributes: {
      color: '藍色鈦金屬',
      storage: '256GB',
      camera: '48MP 主鏡頭系統'
    },
    images: [
      'https://example.com/iphone15pro-1.jpg',
      'https://example.com/iphone15pro-2.jpg'
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'MacBook Pro 14"',
    description: '專業級筆記型電腦，搭載 M3 Pro 晶片',
    price: 69900,
    categoryId: laptopCategory._id,
    stock: 30,
    status: 'active',
    attributes: {
      color: '太空灰',
      storage: '512GB',
      memory: '16GB'
    },
    images: [
      'https://example.com/macbookpro-1.jpg',
      'https://example.com/macbookpro-2.jpg'
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'iPad Pro 12.9"',
    description: '專業級平板電腦，支援 Apple Pencil',
    price: 42900,
    categoryId: tabletCategory._id,
    stock: 25,
    status: 'active',
    attributes: {
      color: '銀色',
      storage: '256GB',
      cellular: 'WiFi + Cellular'
    },
    images: [
      'https://example.com/ipadpro-1.jpg',
      'https://example.com/ipadpro-2.jpg'
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('✅ MongoDB 初始化完成');
print('📊 已建立測試資料:');
print('   - 5 個分類');
print('   - 3 個商品');
print('   - 1 個資料庫用戶');

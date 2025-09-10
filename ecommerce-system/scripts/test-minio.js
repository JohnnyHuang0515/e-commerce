const Minio = require('minio');

// MinIO 配置
const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9010,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin123'
});

async function testMinIO() {
  console.log('🧪 開始測試 MinIO 功能...\n');

  try {
    // 1. 測試連接
    console.log('1️⃣ 測試 MinIO 連接...');
    const buckets = await minioClient.listBuckets();
    console.log('✅ MinIO 連接成功');
    console.log('📦 現有存儲桶:', buckets.map(b => b.name).join(', '));
    console.log('');

    // 2. 測試文件上傳
    console.log('2️⃣ 測試文件上傳...');
    const testContent = 'Hello from Node.js MinIO Test!';
    const testFileName = `test-${Date.now()}.txt`;
    
    await minioClient.putObject('product-images', testFileName, Buffer.from(testContent), {
      'Content-Type': 'text/plain'
    });
    console.log(`✅ 文件上傳成功: ${testFileName}`);
    console.log('');

    // 3. 測試文件列表
    console.log('3️⃣ 測試文件列表...');
    const objectsList = [];
    const stream = minioClient.listObjects('product-images', '', true);
    
    stream.on('data', (obj) => {
      objectsList.push(obj);
    });
    
    stream.on('end', () => {
      console.log('✅ 文件列表獲取成功');
      console.log('📄 文件列表:');
      objectsList.forEach(obj => {
        console.log(`   - ${obj.name} (${obj.size} bytes)`);
      });
      console.log('');
    });

    // 4. 測試文件下載
    console.log('4️⃣ 測試文件下載...');
    const dataStream = await minioClient.getObject('product-images', testFileName);
    const chunks = [];
    
    dataStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    dataStream.on('end', () => {
      const content = Buffer.concat(chunks).toString();
      console.log('✅ 文件下載成功');
      console.log('📄 文件內容:', content);
      console.log('');

      // 5. 測試文件刪除
      console.log('5️⃣ 測試文件刪除...');
      minioClient.removeObject('product-images', testFileName)
        .then(() => {
          console.log('✅ 文件刪除成功');
          console.log('');
          console.log('🎉 MinIO 功能測試完成！所有功能正常運作。');
        })
        .catch(err => {
          console.error('❌ 文件刪除失敗:', err);
        });
    });

  } catch (error) {
    console.error('❌ MinIO 測試失敗:', error);
  }
}

// 執行測試
testMinIO();

import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Upload,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  message,
  Popconfirm,
  Tooltip,
  Progress,
  Badge,
  DatePicker,
  Divider,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  FileOutlined,
  FolderOutlined,
  DatabaseOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  BarChartOutlined,
  ExportOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { UtilityService, FileInfo, BackupInfo, RestoreInfo, SystemStats } from '../../services/utilityService';
import dayjs from 'dayjs';

// TabPane 已棄用，使用 items 屬性
const { Option } = Select;
const { RangePicker } = DatePicker;

const UtilityManagement: React.FC = () => {
  // 狀態管理
  const [activeTab, setActiveTab] = useState('files');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SystemStats | null>(null);
  
  // 檔案管理狀態
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filePagination, setFilePagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [fileFilter, setFileFilter] = useState<any>({});
  
  // 備份管理狀態
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [backupPagination, setBackupPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [backupFilter, setBackupFilter] = useState<any>({});
  
  // 還原管理狀態
  const [restores, setRestores] = useState<RestoreInfo[]>([]);
  const [restorePagination, setRestorePagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [restoreFilter, setRestoreFilter] = useState<any>({});
  
  // 模態框狀態
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  
  // 表單實例
  const [uploadForm] = Form.useForm();
  const [backupForm] = Form.useForm();
  const [restoreForm] = Form.useForm();

  // 載入數據
  useEffect(() => {
    loadStats();
    loadFiles();
    loadBackups();
    loadRestores();
  }, []);

  // 載入統計數據
  const loadStats = async () => {
    try {
      const response = await UtilityService.getSystemStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('載入統計數據失敗:', error);
    }
  };

  // Tabs items 配置
  const tabItems = [
    {
      key: 'files',
      label: '檔案管理',
      children: (
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                上傳檔案
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadFiles}>
                刷新
              </Button>
            </Space>
          </div>
          
          <Table
            columns={fileColumns}
            dataSource={files}
            loading={loading}
            rowKey="id"
            pagination={{
              current: filePagination.page,
              pageSize: filePagination.limit,
              total: filePagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (page, pageSize) => {
                setFilePagination({ ...filePagination, page, limit: pageSize || 10 });
                loadFiles();
              },
            }}
          />
        </Card>
      ),
    },
    {
      key: 'backups',
      label: '備份管理',
      children: (
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={() => setBackupModalVisible(true)}
              >
                創建備份
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadBackups}>
                刷新
              </Button>
            </Space>
          </div>
          
          <Table
            columns={backupColumns}
            dataSource={backups}
            loading={loading}
            rowKey="id"
            pagination={{
              current: backupPagination.page,
              pageSize: backupPagination.limit,
              total: backupPagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (page, pageSize) => {
                setBackupPagination({ ...backupPagination, page, limit: pageSize || 10 });
                loadBackups();
              },
            }}
          />
        </Card>
      ),
    },
    {
      key: 'restores',
      label: '還原管理',
      children: (
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <Button
                type="primary"
                icon={<CloudDownloadOutlined />}
                onClick={() => setRestoreModalVisible(true)}
              >
                創建還原
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadRestores}>
                刷新
              </Button>
            </Space>
          </div>
          
          <Table
            columns={restoreColumns}
            dataSource={restores}
            loading={loading}
            rowKey="id"
            pagination={{
              current: restorePagination.page,
              pageSize: restorePagination.limit,
              total: restorePagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (page, pageSize) => {
                setRestorePagination({ ...restorePagination, page, limit: pageSize || 10 });
                loadRestores();
              },
            }}
          />
        </Card>
      ),
    },
  ];

  // 載入檔案列表
  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await UtilityService.getFiles({
        ...fileFilter,
        page: filePagination.page,
        limit: filePagination.limit,
      });
      
      if (response.success) {
        setFiles(response.data.data);
        setFilePagination(response.data.pagination);
      }
    } catch (error) {
      message.error('載入檔案列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入備份列表
  const loadBackups = async () => {
    try {
      const response = await UtilityService.getBackups({
        ...backupFilter,
        page: backupPagination.page,
        limit: backupPagination.limit,
      });
      
      if (response.success) {
        setBackups(response.data.data);
        setBackupPagination(response.data.pagination);
      }
    } catch (error) {
      message.error('載入備份列表失敗');
    }
  };

  // 載入還原列表
  const loadRestores = async () => {
    try {
      const response = await UtilityService.getRestores({
        ...restoreFilter,
        page: restorePagination.page,
        limit: restorePagination.limit,
      });
      
      if (response.success) {
        setRestores(response.data.data);
        setRestorePagination(response.data.pagination);
      }
    } catch (error) {
      message.error('載入還原列表失敗');
    }
  };

  // 檔案上傳
  const handleUpload = async () => {
    try {
      const values = await uploadForm.validateFields();
      const filesToUpload = fileList.map(file => file.originFileObj).filter(Boolean);
      
      if (filesToUpload.length === 0) {
        message.warning('請選擇要上傳的檔案');
        return;
      }

      const response = await UtilityService.uploadFiles(filesToUpload, {
        uploadedBy: values.uploadedBy,
        uploadedByType: values.uploadedByType,
        tags: values.tags,
        isPublic: values.isPublic,
      });

      if (response.success) {
        message.success(`成功上傳 ${response.data.length} 個檔案`);
        setUploadModalVisible(false);
        setFileList([]);
        uploadForm.resetFields();
        loadFiles();
        loadStats();
      }
    } catch (error) {
      message.error('檔案上傳失敗');
    }
  };

  // 創建備份
  const handleCreateBackup = async () => {
    try {
      const values = await backupForm.validateFields();
      
      const response = await UtilityService.createBackup({
        name: values.name,
        description: values.description,
        type: values.type,
        createdBy: values.createdBy,
        createdByType: values.createdByType,
      });

      if (response.success) {
        message.success('備份任務已創建');
        setBackupModalVisible(false);
        backupForm.resetFields();
        loadBackups();
        loadStats();
      }
    } catch (error) {
      message.error('創建備份失敗');
    }
  };

  // 創建還原
  const handleCreateRestore = async () => {
    try {
      const values = await restoreForm.validateFields();
      
      const response = await UtilityService.createRestore({
        backupId: values.backupId,
        name: values.name,
        description: values.description,
        destination: values.destination,
        createdBy: values.createdBy,
        createdByType: values.createdByType,
      });

      if (response.success) {
        message.success('還原任務已創建');
        setRestoreModalVisible(false);
        restoreForm.resetFields();
        loadRestores();
        loadStats();
      }
    } catch (error) {
      message.error('創建還原失敗');
    }
  };

  // 刪除檔案
  const handleDeleteFile = async (id: string) => {
    try {
      const response = await UtilityService.deleteFile(id);
      if (response.success) {
        message.success('檔案刪除成功');
        loadFiles();
        loadStats();
      }
    } catch (error) {
      message.error('檔案刪除失敗');
    }
  };

  // 下載檔案
  const handleDownloadFile = async (id: string) => {
    try {
      const response = await UtilityService.downloadFile(id);
      if (response.success) {
        message.success('檔案下載成功');
        loadFiles();
      }
    } catch (error) {
      message.error('檔案下載失敗');
    }
  };

  // CSV匯出
  const handleExportCSV = async (type: 'files' | 'backups' | 'restores') => {
    try {
      const blob = await UtilityService.exportToCSV(type);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-export.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      message.success('CSV匯出成功');
    } catch (error) {
      message.error('CSV匯出失敗');
    }
  };

  // 檔案表格列定義
  const fileColumns = [
    {
      title: '檔案名稱',
      dataIndex: 'originalName',
      key: 'originalName',
      render: (text: string, record: FileInfo) => (
        <Space>
          <span>{UtilityService.getFileCategoryIcon(record.category)}</span>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '類型',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => UtilityService.formatFileSize(size),
    },
    {
      title: '上傳者',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
    },
    {
      title: '標籤',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space>
          {tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
        </Space>
      ),
    },
    {
      title: '下載次數',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
    },
    {
      title: '上傳時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: FileInfo) => (
        <Space>
          <Tooltip title="下載">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadFile(record.id)}
            />
          </Tooltip>
          <Tooltip title="查看">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => window.open(record.url, '_blank')}
            />
          </Tooltip>
          <Popconfirm
            title="確定要刪除這個檔案嗎？"
            onConfirm={() => handleDeleteFile(record.id)}
          >
            <Tooltip title="刪除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 備份表格列定義
  const backupColumns = [
    {
      title: '備份名稱',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '類型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="purple">{type}</Tag>,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge
          status={UtilityService.getStatusColor(status) as any}
          text={status}
        />
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => size ? UtilityService.formatFileSize(size) : '-',
    },
    {
      title: '檔案數量',
      dataIndex: 'fileCount',
      key: 'fileCount',
    },
    {
      title: '創建者',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '完成時間',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  // 還原表格列定義
  const restoreColumns = [
    {
      title: '還原名稱',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '備份ID',
      dataIndex: 'backupId',
      key: 'backupId',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge
          status={UtilityService.getStatusColor(status) as any}
          text={status}
        />
      ),
    },
    {
      title: '創建者',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '完成時間',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="工具管理" extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => {
            loadStats();
            loadFiles();
            loadBackups();
            loadRestores();
          }}>
            刷新
          </Button>
          <Button icon={<ExportOutlined />} onClick={() => handleExportCSV('files')}>
            匯出CSV
          </Button>
        </Space>
      }>
        {/* 統計卡片 */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="總檔案數"
                  value={stats.totalFiles}
                  prefix={<FileOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="總檔案大小"
                  value={UtilityService.formatFileSize(stats.totalSize)}
                  prefix={<FolderOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="總備份數"
                  value={stats.totalBackups}
                  prefix={<DatabaseOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="總還原數"
                  value={stats.totalRestores}
                  prefix={<CloudDownloadOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 標籤頁 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* 檔案上傳模態框 */}
      <Modal
        title="上傳檔案"
        open={uploadModalVisible}
        onOk={handleUpload}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
          uploadForm.resetFields();
        }}
        width={600}
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item
            name="uploadedBy"
            label="上傳者"
            rules={[{ required: true, message: '請輸入上傳者' }]}
          >
            <Input placeholder="請輸入上傳者ID" />
          </Form.Item>
          
          <Form.Item
            name="uploadedByType"
            label="上傳者類型"
            initialValue="user"
          >
            <Select>
              <Option value="user">用戶</Option>
              <Option value="admin">管理員</Option>
              <Option value="system">系統</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="tags"
            label="標籤"
          >
            <Select mode="tags" placeholder="請輸入標籤" />
          </Form.Item>
          
          <Form.Item
            name="isPublic"
            label="是否公開"
            valuePropName="checked"
          >
            <Input type="checkbox" />
          </Form.Item>
          
          <Form.Item label="選擇檔案">
            <Upload
              multiple
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>選擇檔案</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 創建備份模態框 */}
      <Modal
        title="創建備份"
        open={backupModalVisible}
        onOk={handleCreateBackup}
        onCancel={() => {
          setBackupModalVisible(false);
          backupForm.resetFields();
        }}
      >
        <Form form={backupForm} layout="vertical">
          <Form.Item
            name="name"
            label="備份名稱"
            rules={[{ required: true, message: '請輸入備份名稱' }]}
          >
            <Input placeholder="請輸入備份名稱" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="備份描述"
          >
            <Input.TextArea placeholder="請輸入備份描述" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="備份類型"
            initialValue="manual"
          >
            <Select>
              <Option value="manual">手動</Option>
              <Option value="scheduled">定時</Option>
              <Option value="automatic">自動</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="createdBy"
            label="創建者"
            rules={[{ required: true, message: '請輸入創建者' }]}
          >
            <Input placeholder="請輸入創建者ID" />
          </Form.Item>
          
          <Form.Item
            name="createdByType"
            label="創建者類型"
            initialValue="admin"
          >
            <Select>
              <Option value="user">用戶</Option>
              <Option value="admin">管理員</Option>
              <Option value="system">系統</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 創建還原模態框 */}
      <Modal
        title="創建還原"
        open={restoreModalVisible}
        onOk={handleCreateRestore}
        onCancel={() => {
          setRestoreModalVisible(false);
          restoreForm.resetFields();
        }}
      >
        <Form form={restoreForm} layout="vertical">
          <Form.Item
            name="backupId"
            label="備份ID"
            rules={[{ required: true, message: '請選擇備份' }]}
          >
            <Select placeholder="請選擇要還原的備份">
              {backups.map(backup => (
                <Option key={backup.id} value={backup.id}>
                  {backup.name} ({backup.status})
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="name"
            label="還原名稱"
            rules={[{ required: true, message: '請輸入還原名稱' }]}
          >
            <Input placeholder="請輸入還原名稱" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="還原描述"
          >
            <Input.TextArea placeholder="請輸入還原描述" />
          </Form.Item>
          
          <Form.Item
            name="destination"
            label="還原目標路徑"
          >
            <Input placeholder="請輸入還原目標路徑" />
          </Form.Item>
          
          <Form.Item
            name="createdBy"
            label="創建者"
            rules={[{ required: true, message: '請輸入創建者' }]}
          >
            <Input placeholder="請輸入創建者ID" />
          </Form.Item>
          
          <Form.Item
            name="createdByType"
            label="創建者類型"
            initialValue="admin"
          >
            <Select>
              <Option value="user">用戶</Option>
              <Option value="admin">管理員</Option>
              <Option value="system">系統</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UtilityManagement;

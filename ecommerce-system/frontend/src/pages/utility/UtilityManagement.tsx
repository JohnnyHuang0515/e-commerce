import React from 'react';
import { Card, Col, List, Row, Skeleton, Statistic } from 'antd';
import { CloudDownloadOutlined, FileOutlined, HistoryOutlined } from '@ant-design/icons';

import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import { useUtilityStats, useMaintenanceTasks } from '../../hooks/useUtility';

const UtilityManagement: React.FC = () => {
  const { data: statsResponse, isLoading: statsLoading, refetch: refetchStats } = useUtilityStats();
  const { data: tasksResponse, isLoading: tasksLoading, refetch: refetchTasks } = useMaintenanceTasks();

  const stats = statsResponse?.data;
  const tasks = tasksResponse?.data ?? [];

  const statsConfig = [
    {
      label: '備份檔案數',
      value: stats?.backups ?? '—',
      icon: <CloudDownloadOutlined />,
      color: 'var(--primary-500)',
    },
    {
      label: '媒體檔案數',
      value: stats?.files ?? '—',
      icon: <FileOutlined />,
      color: 'var(--info-500)',
    },
    {
      label: '系統紀錄檔',
      value: stats?.logs ?? '—',
      icon: <HistoryOutlined />,
      color: 'var(--warning-500)',
    },
  ];

  return (
    <UnifiedPageLayout
      title="系統維運"
      subtitle="掌握備份、檔案與維護任務"
      stats={statsConfig.map((item) => ({ ...item, value: item.value }))}
      loading={statsLoading && tasksLoading}
      extra={<a onClick={() => { refetchStats(); refetchTasks(); }}>重新整理</a>}
    >
      <Row gutter={[16, 16]}>
        <Col span={24} md={12}>
          <Card title="系統概況" bordered={false}>
            {statsLoading ? (
              <Skeleton active />
            ) : (
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="備份檔案數" value={stats?.backups ?? 0} suffix="份" />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="最近一次備份"
                    value={stats?.lastBackupAt ? new Date(stats.lastBackupAt).toLocaleString() : '—'}
                  />
                </Col>
              </Row>
            )}
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card title="維護任務" bordered={false}>
            {tasksLoading ? (
              <Skeleton active />
            ) : (
              <List
                dataSource={tasks}
                renderItem={(task) => (
                  <List.Item>
                    <List.Item.Meta
                      title={task.name}
                      description={
                        <div>
                          <div>{task.description}</div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            最近執行：{new Date(task.lastRunAt).toLocaleString()} / 狀態：{task.status}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </UnifiedPageLayout>
  );
};

export default UtilityManagement;

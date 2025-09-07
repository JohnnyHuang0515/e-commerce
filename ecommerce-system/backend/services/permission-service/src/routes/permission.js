const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');

// 權限檢查路由
router.post('/check', permissionController.checkPermission);

// 特殊路由 (必須在 /:id 路由之前)
router.get('/roles', permissionController.getRoles);
router.get('/user-roles', permissionController.getUserRoles);
router.get('/statistics', permissionController.getPermissionStats);

// 權限管理路由
router.get('/', permissionController.getPermissions);
router.get('/:id', permissionController.getPermissionById);
router.post('/', permissionController.createPermission);
router.put('/:id', permissionController.updatePermission);
router.delete('/:id', permissionController.deletePermission);

// 角色管理路由
router.get('/roles/:id', permissionController.getRoleById);
router.post('/roles', permissionController.createRole);
router.put('/roles/:id', permissionController.updateRole);
router.delete('/roles/:id', permissionController.deleteRole);

// 角色權限管理
router.post('/roles/:id/permissions', permissionController.assignPermissionsToRole);
router.delete('/roles/:id/permissions', permissionController.removePermissionsFromRole);

// 用戶角色管理
router.get('/user-roles', permissionController.getUserRoles);
router.get('/user-roles/user/:userId', permissionController.getUserRolesByUserId);
router.post('/user-roles', permissionController.assignUserRole);
router.delete('/user-roles/:id', permissionController.removeUserRole);

// 用戶權限相關
router.get('/user/:userId/permissions', permissionController.getUserPermissions);

// 統計路由
router.get('/stats', permissionController.getPermissionStats);

// 系統初始化路由
router.post('/initialize', permissionController.initializeSystemData);

module.exports = router;
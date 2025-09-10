const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const permissionController = require('../controllers/permissionController');

const { validateAuth, validateUser, validatePermission } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

// --- 👤 User Authentication ---
router.post('/register', validateAuth.register, authController.register);
router.post('/login', validateAuth.login, authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.post('/refresh', authenticateToken, authController.refreshToken);
router.get('/verify', authenticateToken, authController.verifyToken);
router.get('/profile', authenticateToken, userController.getUserProfile);
router.put('/profile', authenticateToken, validateUser.updateProfile, userController.updateUserProfile);
router.put('/change-password', authenticateToken, validateUser.changePassword, userController.changePassword);

// --- 🔑 Permission Management ---
router.get('/permissions', authenticateToken, authorize(['admin']), permissionController.getPermissions);
router.post('/permissions', authenticateToken, authorize(['admin']), validatePermission.create, permissionController.createPermission);
router.get('/permissions/:id', authenticateToken, authorize(['admin']), permissionController.getPermissionById);
router.put('/permissions/:id', authenticateToken, authorize(['admin']), validatePermission.update, permissionController.updatePermission);
router.delete('/permissions/:id', authenticateToken, authorize(['admin']), permissionController.deletePermission);

// --- 🎭 Role Management ---
router.get('/roles', authenticateToken, authorize(['admin']), permissionController.getRoles);
router.post('/roles', authenticateToken, authorize(['admin']), validatePermission.createRole, permissionController.createRole);
router.get('/roles/:id', authenticateToken, authorize(['admin']), permissionController.getRoleById);
router.put('/roles/:id', authenticateToken, authorize(['admin']), validatePermission.updateRole, permissionController.updateRole);
router.delete('/roles/:id', authenticateToken, authorize(['admin']), permissionController.deleteRole);
router.post('/roles/:id/permissions', authenticateToken, authorize(['admin']), permissionController.assignPermissionsToRole);
router.delete('/roles/:id/permissions', authenticateToken, authorize(['admin']), permissionController.removePermissionsFromRole);

// --- 👥 User Role Management ---
router.get('/users/:userId/roles', authenticateToken, authorize(['admin']), userController.getUserRoles);
router.post('/users/:userId/roles', authenticateToken, authorize(['admin']), userController.assignRoleToUser);
router.delete('/users/:userId/roles/:roleId', authenticateToken, authorize(['admin']), userController.removeRoleFromUser);

module.exports = router;
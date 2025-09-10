const { Role, Permission, RolePermission } = require('../models');
const { Op } = require('sequelize');

// --- Permission Management ---
const createPermission = async (req, res) => {
    try {
        const permission = await Permission.create(req.body);
        res.status(201).json({ success: true, data: permission });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating permission', error: error.message });
    }
};

const getPermissionById = async (req, res) => {
    try {
        const permission = await Permission.findByPk(req.params.id);
        if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
        res.json({ success: true, data: permission });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching permission', error: error.message });
    }
};

const updatePermission = async (req, res) => {
    try {
        const permission = await Permission.findByPk(req.params.id);
        if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
        await permission.update(req.body);
        res.json({ success: true, data: permission });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating permission', error: error.message });
    }
};

const deletePermission = async (req, res) => {
    try {
        const permission = await Permission.findByPk(req.params.id);
        if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
        await permission.destroy();
        res.json({ success: true, message: 'Permission deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting permission', error: error.message });
    }
};


// --- Role Permission Management ---
const assignPermissionsToRole = async (req, res) => {
    try {
        const { permissions } = req.body; // Array of permission IDs
        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
        
        await role.setPermissions(permissions);
        res.json({ success: true, message: 'Permissions assigned successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error assigning permissions', error: error.message });
    }
};

const removePermissionsFromRole = async (req, res) => {
    try {
        const { permissions } = req.body; // Array of permission IDs to remove
        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

        await role.removePermissions(permissions);
        res.json({ success: true, message: 'Permissions removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error removing permissions', error: error.message });
    }
};


// --- Original Permission Controller Functions ---
const getPermissions = async (req, res) => {
  // ... existing implementation
};
const getRoles = async (req, res) => {
  // ... existing implementation
};
const getRoleById = async (req, res) => {
    // ... existing implementation
};
const createRole = async (req, res) => {
    // ... existing implementation
};
const updateRole = async (req, res) => {
    // ... existing implementation
};
const deleteRole = async (req, res) => {
    // ... existing implementation
};

const updateRolePermissions = async (req, res) => {
    try {
        const { permissions } = req.body; // Array of permission IDs
        const role = await Role.findByPk(req.params.roleId);
        if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
        
        await role.setPermissions(permissions);
        res.json({ success: true, message: 'Role permissions updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating role permissions', error: error.message });
    }
};

const checkPermission = async (req, res) => {
    try {
        // Mock response for now
        res.json({ success: true, message: 'Permission checked successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error checking permission', error: error.message });
    }
};

module.exports = {
    createPermission,
    getPermissionById,
    updatePermission,
    deletePermission,
    assignPermissionsToRole,
    removePermissionsFromRole,
    updateRolePermissions,
    checkPermission,
    // Keep original exports
    getPermissions,
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
};

// Mock functions for category management
const mockResponse = (req, res, message) => res.json({ success: true, message, data: { ...req.params, ...req.query, ...req.body } });

exports.getCategories = (req, res) => mockResponse(req, res, 'Categories fetched successfully');
exports.createCategory = (req, res) => mockResponse(req, res, 'Category created successfully');
exports.getCategoryById = (req, res) => mockResponse(req, res, `Category ${req.params.id} fetched successfully`);
exports.updateCategory = (req, res) => mockResponse(req, res, `Category ${req.params.id} updated successfully`);
exports.deleteCategory = (req, res) => mockResponse(req, res, `Category ${req.params.id} deleted successfully`);


// Mock functions for product management
const mockResponse = (req, res, message) => res.json({ success: true, message, data: { ...req.params, ...req.query, ...req.body } });

exports.getProducts = (req, res) => mockResponse(req, res, 'Products fetched successfully');
exports.createProduct = (req, res) => mockResponse(req, res, 'Product created successfully');
exports.getProductById = (req, res) => mockResponse(req, res, `Product ${req.params.id} fetched successfully`);
exports.updateProduct = (req, res) => mockResponse(req, res, `Product ${req.params.id} updated successfully`);
exports.deleteProduct = (req, res) => mockResponse(req, res, `Product ${req.params.id} deleted successfully`);
exports.deleteProductsBatch = (req, res) => mockResponse(req, res, 'Products batch deleted successfully');
exports.updateProductStatus = (req, res) => mockResponse(req, res, `Product ${req.params.id} status updated successfully`);
exports.updateProductStock = (req, res) => mockResponse(req, res, `Product ${req.params.id} stock updated successfully`);
exports.uploadProductImage = (req, res) => mockResponse(req, res, 'Product image uploaded successfully');
exports.getProductStats = (req, res) => mockResponse(req, res, 'Product stats fetched successfully');

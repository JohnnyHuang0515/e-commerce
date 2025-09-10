
// Mock functions for brand management
const mockResponse = (req, res, message) => res.json({ success: true, message, data: { ...req.params, ...req.query, ...req.body } });

exports.getBrands = (req, res) => mockResponse(req, res, 'Brands fetched successfully');
exports.createBrand = (req, res) => mockResponse(req, res, 'Brand created successfully');
exports.getBrandById = (req, res) => mockResponse(req, res, `Brand ${req.params.id} fetched successfully`);
exports.updateBrand = (req, res) => mockResponse(req, res, `Brand ${req.params.id} updated successfully`);
exports.deleteBrand = (req, res) => mockResponse(req, res, `Brand ${req.params.id} deleted successfully`);

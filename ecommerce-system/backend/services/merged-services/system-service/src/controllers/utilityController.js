// Mock functions for utility management
const mockResponse = (req, res, message) => res.json({ success: true, message, data: { ...req.params, ...req.query, ...req.body } });

exports.uploadFile = (req, res) => mockResponse(req, res, 'File uploaded successfully');
exports.getFiles = (req, res) => mockResponse(req, res, 'Files fetched successfully');
exports.downloadFile = (req, res) => {
    res.attachment('mock-file.txt');
    res.send('This is a mock file.');
};
exports.createBackup = (req, res) => mockResponse(req, res, 'Backup created successfully');
exports.getBackups = (req, res) => mockResponse(req, res, 'Backups fetched successfully');
exports.createRestore = (req, res) => mockResponse(req, res, 'Restore created successfully');
exports.getSystemStats = (req, res) => mockResponse(req, res, 'System stats fetched successfully');
exports.exportToCsv = (req, res) => {
    res.header('Content-Type', 'text/csv');
    res.attachment('export.csv');
    res.send('col1,col2\nval1,val2');
};

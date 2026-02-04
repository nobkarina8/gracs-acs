const express = require('express');
const cwmpController = require('../controllers/cwmpController');

const router = express.Router();

/**
 * Main TR-069 endpoint
 * CPE devices connect to this endpoint
 */
router.post('/', async (req, res) => {
    await cwmpController.handleRequest(req, res);
});

module.exports = router;

const pool = require("../config/db");

/**
 * Global Utility function to write to activity_logs table
 * @param {Object} req - The Express request object (used to extract user ID and IP address)
 * @param {string} action - Descriptive action name (e.g., 'User Logged In', 'Task Created')
 * @param {string|null} entityType - The table name affected (e.g., 'tasks', 'users', 'task_offers')
 * @param {number|null} entityId - The specific record primary key ID affected
 */
const logActivity = async (req, action, entityType = null, entityId = null) => {
    try {
        const userId = req.user && req.user.id ? req.user.id : null;
        
        // Extract client IP address accurately handling proxies
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, action, entityType, entityId, ipAddress]
        );
    } catch (error) {
        // Log the error locally but don't crash the request lifecycle if a log fails
        console.error("Activity Logging System Failover:", error.message);
    }
};

module.exports = { logActivity };
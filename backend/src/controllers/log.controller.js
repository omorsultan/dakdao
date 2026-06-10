const pool = require("../config/db");

// GET ALL ACTIVITY LOGS (Admin view with pagination and join statistics)
exports.getAllLogs = async (req, res) => {
    try {
        // Enforce administrative checks if not completely covered by middleware
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const [logs] = await pool.query(
            `SELECT l.*, u.name AS user_name, u.role AS user_role, u.mobile AS user_mobile
             FROM activity_logs l
             LEFT JOIN users u ON l.user_id = u.id
             ORDER BY l.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM activity_logs");

        res.json({
            success: true,
            count: logs.length,
            total_records: total,
            logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET CURRENT USER'S OWN PERSONAL RECENT ACTIVITY LOGS
exports.getMyLogs = async (req, res) => {
    try {
        const [logs] = await pool.query(
            `SELECT * FROM activity_logs 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 20`,
            [req.user.id]
        );

        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
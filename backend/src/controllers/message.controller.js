const pool = require("../config/db");
const { logActivity } = require("../utils/logger");

// 1. SEND A MESSAGE
exports.sendMessage = async (req, res) => {
    try {
        const { task_id, message } = req.body;
        const senderId = req.user.id;

        if (!task_id || !message || !message.trim()) {
            return res.status(400).json({ message: "task_id and message are required" });
        }

        // Security check: Is this user allowed to chat on this task?
        // Must be the task owner OR a worker who has interacted (sent an offer)
        const [authCheck] = await pool.query(
            `SELECT t.id 
             FROM tasks t
             LEFT JOIN task_offers o ON t.id = o.task_id
             WHERE t.id = ? AND (t.customer_id = ? OR o.from_user_id = ?)`,
            [task_id, senderId, senderId]
        );

        if (authCheck.length === 0) {
            return res.status(403).json({ message: "Not authorized to message on this task thread" });
        }

        // Insert message
        const [result] = await pool.query(
            `INSERT INTO task_messages (task_id, sender_id, message) VALUES (?, ?, ?)`,
            [task_id, senderId, message.trim()]
        );

        // 📝 LOG ACTIVITY: Message Sent Trace
        await logActivity(req, "Sent a message on task negotiation thread", "tasks", task_id);

        res.status(201).json({
            success: true,
            messageId: result.insertId,
            message: "Message sent successfully"
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET ALL MESSAGES FOR A SPECIFIC TASK (Chat History)
exports.getTaskMessages = async (req, res) => {
    try {
        const { task_id } = req.params;
        const userId = req.user.id;

        // Security check: Verify user is part of this task ecosystem
        const [authCheck] = await pool.query(
            `SELECT t.id 
             FROM tasks t
             LEFT JOIN task_offers o ON t.id = o.task_id
             WHERE t.id = ? AND (t.customer_id = ? OR o.from_user_id = ?)`,
            [task_id, userId, userId]
        );

        if (authCheck.length === 0) {
            return res.status(403).json({ message: "Not authorized to view this chat history" });
        }

        // Fetch messages with sender name and role
        const [messages] = await pool.query(
            `SELECT m.*, u.name AS sender_name, u.role AS sender_role
             FROM task_messages m
             INNER JOIN users u ON m.sender_id = u.id
             WHERE m.task_id = ?
             ORDER BY m.created_at ASC`,
            [task_id]
        );

        res.json({
            success: true,
            count: messages.length,
            messages
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
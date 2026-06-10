const pool = require("../config/db");
const { logActivity } = require("../utils/logger");

// POST A TASK (customer)
exports.createTask = async (req, res) => {
    try {
        const {
            category_id,
            description,
            location_text,
            latitude,
            longitude,
            initial_price
        } = req.body;

        if (!description || !location_text) {
            return res.status(400).json({
                message: "Description and location are required"
            });
        }

        const [result] = await pool.query(
            `
            INSERT INTO tasks
            (customer_id, category_id, description, location_text, latitude, longitude, initial_price, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
            `,
            [
                req.user.id,
                category_id  || null,
                description,
                location_text,
                latitude     || null,
                longitude    || null,
                initial_price|| null
            ]
        );

        const newTaskId = result.insertId;

        // 📝 LOG ACTIVITY: New task requisition opened
        await logActivity(req, `Posted a new service requirement for bidding. Value context set to ৳${initial_price || 0}`, "tasks", newTaskId);

        res.status(201).json({
            success: true,
            taskId: newTaskId,
            message: "Task posted successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET ALL OPEN TASKS (Read-only)
exports.getOpenTasks = async (req, res) => {
    try {
        const { status = "open", limit = 20, offset = 0 } = req.query;

        const [tasks] = await pool.query(
            `
            SELECT
                t.*,
                c.name AS category_name,
                u.name AS customer_name
            FROM tasks t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN users u ON t.customer_id = u.id
            WHERE t.status = ?
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
            `,
            [status, parseInt(limit), parseInt(offset)]
        );

        res.json({ success: true, tasks });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET CUSTOMER'S OWN TASKS (Read-only)
exports.getMyTasks = async (req, res) => {
    try {
        const [tasks] = await pool.query(
            `
            SELECT
                t.*,
                c.name AS category_name
            FROM tasks t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.customer_id = ?
            ORDER BY t.created_at DESC
            `,
            [req.user.id]
        );

        res.json({ success: true, tasks });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET TASKS ASSIGNED TO A WORKER (Read-only)
exports.getAssignedTasks = async (req, res) => {
    try {
        const [tasks] = await pool.query(
            `
            SELECT
                t.*,
                c.name AS category_name,
                u.name AS customer_name,
                o.offer_price AS agreed_price
            FROM tasks t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN users u ON t.customer_id = u.id
            INNER JOIN task_offers o
                ON o.task_id = t.id
                AND o.from_user_id = ?
                AND o.status = 'accepted'
            ORDER BY t.created_at DESC
            `,
            [req.user.id]
        );

        res.json({ success: true, tasks });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET SINGLE TASK (Read-only)
exports.getTaskById = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `
            SELECT
                t.*,
                c.name AS category_name,
                u.name AS customer_name,
                u.mobile AS customer_mobile,
                COALESCE(
                    (SELECT o.offer_price FROM task_offers o WHERE o.task_id = t.id AND o.status = 'accepted' LIMIT 1),
                    t.initial_price
                ) AS final_display_price
            FROM tasks t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN users u ON t.customer_id = u.id
            WHERE t.id = ?
            `,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json({ success: true, task: rows[0] });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE TASK STATUS
exports.updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["open","negotiating","confirmed","completed","cancelled"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const [rows] = await pool.query(
            "SELECT id FROM tasks WHERE id = ? AND customer_id = ?",
            [req.params.id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(403).json({ message: "Not authorised" });
        }

        await pool.query(
            "UPDATE tasks SET status = ? WHERE id = ?",
            [status, req.params.id]
        );

        // 📝 LOG ACTIVITY: State Engine Change Logging
        await logActivity(req, `Manually updated task status execution phase to: ${status}`, "tasks", req.params.id);

        res.json({ success: true, message: `Task marked as ${status}` });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE / CANCEL TASK
exports.deleteTask = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, status FROM tasks WHERE id = ? AND customer_id = ?",
            [req.params.id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(403).json({ message: "Not authorised" });
        }

        if (rows[0].status === "confirmed") {
            return res.status(400).json({
                message: "Cannot delete a confirmed task. Cancel it first."
            });
        }

        await pool.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);

        // 📝 LOG ACTIVITY: Task purged completely 
        await logActivity(req, "Permanently dropped task listing constraint from application lifecycle", "tasks", req.params.id);

        res.json({ success: true, message: "Task deleted" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET ALL CATEGORIES (Read-only)
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            "SELECT * FROM categories ORDER BY name ASC"
        );
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// SEARCH / FILTER TASKS (Read-only)
exports.searchTasks = async (req, res) => {
    try {
        const { category_id, location, min_price } = req.query;
        
        let sql = `
            SELECT t.*, c.name AS category_name, u.name AS customer_name 
            FROM tasks t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN users u ON t.customer_id = u.id
            WHERE t.status = 'open'
        `;
        const queryParams = [];

        if (category_id) {
            sql += " AND t.category_id = ?";
            queryParams.push(category_id);
        }
        if (location) {
            sql += " AND t.location_text LIKE ?";
            queryParams.push(`%${location}%`);
        }
        if (min_price) {
            sql += " AND t.initial_price >= ?";
            queryParams.push(parseFloat(min_price));
        }

        sql += " ORDER BY t.created_at DESC";

        const [tasks] = await pool.query(sql, queryParams);
        res.json({ success: true, count: tasks.length, tasks });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
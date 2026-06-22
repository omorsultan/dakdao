const pool = require("../config/db");
const { logActivity } = require("../utils/logger"); // Import logging utility

// WORKER SENDS OFFER ON A TASK
exports.sendOffer = async (req, res) => {
    try {
        const { task_id, offer_price } = req.body;

        if (!task_id || !offer_price) {
            return res.status(400).json({
                message: "task_id and offer_price are required"
            });
        }

        const [tasks] = await pool.query(
            "SELECT id, customer_id, status FROM tasks WHERE id = ?",
            [task_id]
        );

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        const task = tasks[0];

        if (!["open", "negotiating"].includes(task.status)) {
            return res.status(400).json({
                message: "This task is no longer accepting offers"
            });
        }

        const [existing] = await pool.query(
            `SELECT id FROM task_offers
             WHERE task_id = ? AND from_user_id = ? AND status = 'pending'`,
            [task_id, req.user.id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "You already have a pending offer on this task"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO task_offers
             (task_id, from_user_id, to_user_id, offer_price, offer_type, status)
             VALUES (?, ?, ?, ?, 'initial', 'pending')`,
            [task_id, req.user.id, task.customer_id, offer_price]
        );

        const newOfferId = result.insertId;

        // Move task to negotiating if it was open
        if (task.status === "open") {
            await pool.query(
                "UPDATE tasks SET status = 'negotiating' WHERE id = ?",
                [task_id]
            );
            // 📝 LOG ACTIVITY: Task shifted to negotiation stage
            await logActivity(req, "Task auto-shifted status to negotiating via incoming offer", "tasks", task_id);
        }

        // 📝 LOG ACTIVITY: Worker sent initial proposal bid
        await logActivity(req, `Worker sent an initial task offer of ৳${offer_price}`, "task_offers", newOfferId);

        res.status(201).json({
            success: true,
            offerId: newOfferId,
            message: "Offer sent successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET ALL OFFERS FOR A TASK (Read only - no logging needed)
exports.getTaskOffers = async (req, res) => {
    try {
        const { task_id } = req.params;

        const [tasks] = await pool.query(
            "SELECT id FROM tasks WHERE id = ? AND customer_id = ?",
            [task_id, req.user.id]
        );

        if (tasks.length === 0) {
            return res.status(403).json({ message: "Not authorised" });
        }

        const [offers] = await pool.query(
            `SELECT o.*, u.name AS worker_name, u.mobile AS worker_mobile,
                    wp.skills, wp.is_verified, wp.profile_image
             FROM task_offers o
             INNER JOIN users u ON o.from_user_id = u.id
             LEFT JOIN worker_profile wp ON wp.user_id = o.from_user_id
             WHERE o.task_id = ?
             ORDER BY o.created_at DESC`,
            [task_id]
        );

        res.json({ success: true, offers });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET WORKER'S OWN OFFERS (Read only - no logging needed)
exports.getMyOffers = async (req, res) => {
    try {
        const [offers] = await pool.query(
            `SELECT o.*, t.description, t.location_text, t.status AS task_status,
                    u.name AS customer_name
             FROM task_offers o
             INNER JOIN tasks t ON o.task_id = t.id
             INNER JOIN users u ON t.customer_id = u.id
             WHERE o.from_user_id = ?
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        res.json({ success: true, offers });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CUSTOMER ACCEPTS AN OFFER
exports.acceptOffer = async (req, res) => {
    try {
        const { offer_id } = req.params;

        const [offers] = await pool.query(
            `SELECT o.*, t.customer_id
             FROM task_offers o
             INNER JOIN tasks t ON o.task_id = t.id
             WHERE o.id = ?`,
            [offer_id]
        );

        if (offers.length === 0) {
            return res.status(404).json({ message: "Offer not found" });
        }

        const offer = offers[0];

        if (offer.customer_id !== req.user.id) {
            return res.status(403).json({ message: "Not authorised" });
        }

        if (offer.status !== "pending") {
            return res.status(400).json({ message: "Offer is no longer pending" });
        }

        await pool.query(
            "UPDATE task_offers SET status = 'accepted' WHERE id = ?",
            [offer_id]
        );

        await pool.query(
            `UPDATE task_offers SET status = 'rejected'
             WHERE task_id = ? AND id != ? AND status = 'pending'`,
            [offer.task_id, offer_id]
        );

        await pool.query(
            "UPDATE tasks SET status = 'confirmed' WHERE id = ?",
            [offer.task_id]
        );

        // 📝 LOG ACTIVITY: Customer accepts contract offer
        await logActivity(req, `Customer accepted task offer proposal`, "task_offers", offer_id);
        
        // 📝 LOG ACTIVITY: Task status confirmed via match completion
        await logActivity(req, `Task confirmed and locked with assigned worker`, "tasks", offer.task_id);

        res.json({
            success: true,
            message: "Offer accepted. Task is now confirmed."
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CUSTOMER REJECTS AN OFFER
exports.rejectOffer = async (req, res) => {
    try {
        const { offer_id } = req.params;

        const [offers] = await pool.query(
            `SELECT o.*, t.customer_id FROM task_offers o
             INNER JOIN tasks t ON o.task_id = t.id
             WHERE o.id = ?`,
            [offer_id]
        );

        if (offers.length === 0) {
            return res.status(404).json({ message: "Offer not found" });
        }

        const offer = offers[0];

        if (offer.customer_id !== req.user.id) {
            return res.status(403).json({ message: "Not authorised" });
        }

        await pool.query(
            "UPDATE task_offers SET status = 'rejected' WHERE id = ?",
            [offer_id]
        );

        // 📝 LOG ACTIVITY: Offer Rejected
        await logActivity(req, "Customer rejected worker task offer proposal", "task_offers", offer_id);

        res.json({ success: true, message: "Offer rejected" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// WORKER WITHDRAWS THEIR OWN OFFER
exports.withdrawOffer = async (req, res) => {
    try {
        const { offer_id } = req.params;

        const [offers] = await pool.query(
            "SELECT id, task_id, status FROM task_offers WHERE id = ? AND from_user_id = ?",
            [offer_id, req.user.id]
        );

        if (offers.length === 0) {
            return res.status(404).json({ message: "Offer not found" });
        }

        if (offers[0].status !== "pending") {
            return res.status(400).json({
                message: "Only pending offers can be withdrawn"
            });
        }

        const offer = offers[0];

        await pool.query(
            "DELETE FROM task_offers WHERE id = ?",
            [offer_id]
        );

        // 📝 LOG ACTIVITY: Offer Withdrawn by Worker
        await logActivity(req, `Worker withdrew their active bid from task references`, "tasks", offer.task_id);

        res.json({ success: true, message: "Offer withdrawn" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// SEND A COUNTER OFFER (Customer or Worker)
exports.sendCounterOffer = async (req, res) => {
    try {
        const { offer_id } = req.params;
        const { counter_price } = req.body;
        const userId = req.user.id;

        if (!counter_price) {
            return res.status(400).json({ message: "counter_price is required" });
        }

        const [offers] = await pool.query(
            `SELECT o.*, t.customer_id 
             FROM task_offers o
             INNER JOIN tasks t ON o.task_id = t.id
             WHERE o.id = ?`,
            [offer_id]
        );

        if (offers.length === 0) {
            return res.status(404).json({ message: "Offer negotiation thread not found" });
        }

        const offer = offers[0];
        const isCustomer = offer.customer_id === userId;
        const isWorker = offer.from_user_id === userId;

        if (!isCustomer && !isWorker) {
            return res.status(403).json({ message: "Not authorised to negotiate on this offer" });
        }

        if (offer.status !== "pending") {
            return res.status(400).json({ message: "Cannot counter-offer on a closed negotiation" });
        }

        await pool.query(
            `UPDATE task_offers 
             SET offer_price = ?, 
                 offer_type = 'counter',
                 last_action_by = ? 
             WHERE id = ?`,
            [counter_price, userId, offer_id]
        );

        // 📝 LOG ACTIVITY: Negotiation Counter Updated
        const partyRole = isCustomer ? "Customer" : "Worker";
        await logActivity(req, `${partyRole} updated counter offer negotiation price point to ৳${counter_price}`, "task_offers", offer_id);

        res.json({
            success: true,
            message: "Counter offer updated successfully",
            currentPrice: counter_price
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ACCEPT NEGOTIATION
exports.acceptNegotiation = async (req, res) => {
    try {
        const { offer_id } = req.params;
        const userId = req.user.id;

        const [offers] = await pool.query(
            `SELECT o.*, t.customer_id 
             FROM task_offers o
             INNER JOIN tasks t ON o.task_id = t.id
             WHERE o.id = ?`,
            [offer_id]
        );

        if (offers.length === 0) {
            return res.status(404).json({ message: "Offer not found" });
        }

        const offer = offers[0];
        const isCustomer = offer.customer_id === userId;
        const isWorker = offer.from_user_id === userId;

        if (!isCustomer && !isWorker) {
            return res.status(403).json({ message: "Not authorised" });
        }

        if (offer.status !== "pending") {
            return res.status(400).json({ message: "Offer negotiation is closed" });
        }

        if (offer.last_action_by === userId) {
            return res.status(400).json({ 
                message: "You cannot accept your own offer. Waiting for the other party to respond." 
            });
        }

        await pool.query(
            "UPDATE task_offers SET status = 'accepted' WHERE id = ?",
            [offer_id]
        );

        await pool.query(
            `UPDATE task_offers SET status = 'rejected'
             WHERE task_id = ? AND id != ? AND status = 'pending'`,
            [offer.task_id, offer_id]
        );

        await pool.query(
            "UPDATE tasks SET status = 'confirmed' WHERE id = ?",
            [offer.task_id]
        );

        // 📝 LOG ACTIVITY: Negotiation Accepted 
        const actorRole = isCustomer ? "Customer" : "Worker";
        await logActivity(req, `${actorRole} accepted the negotiated price point of ৳${offer.offer_price}`, "task_offers", offer_id);
        
        // 📝 LOG ACTIVITY: Task status confirmed via negotiation resolve loop
        await logActivity(req, `Task confirmed and locked with assigned worker via negotiation`, "tasks", offer.task_id);

        res.json({
            success: true,
            message: "Negotiation accepted! The task is now confirmed."
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET TOTAL CONFIRMED WORKS AMOUNT (Read only - no logging needed)
exports.getConfirmedEarnings = async (req, res) => {
    try {
        const workerId = req.user.id; 

        const [rows] = await pool.query(
            `SELECT 
                SUM(COALESCE(o.offer_price, t.initial_price)) AS total_confirmed_amount
             FROM tasks t
             INNER JOIN task_offers o ON t.id = o.task_id
             WHERE o.from_user_id = ? 
               AND o.status = 'accepted' 
               AND t.status = 'confirmed'`,
            [workerId]
        );

        const totalAmount = rows[0].total_confirmed_amount || 0;

        res.json({
            success: true,
            worker_id: workerId,
            confirmed_amount: parseFloat(totalAmount)
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
// backend/controllers/profile.controller.js
const pool = require("../config/db");


// UPSERT WORKER PROFILE
exports.createWorkerProfile = async (req, res) => {
    try {
        const {
            full_name,
            mobile,
            nid_number,
            permanent_location,
            skills,
            latitude,
            longitude
        } = req.body;

        const profileImage = req.file ? req.file.filename : null;

        // Check if profile already exists for this user
        const [existing] = await pool.query(
            "SELECT id FROM worker_profile WHERE user_id = ?",
            [req.user.id]
        );

        if (existing.length > 0) {
            // UPDATE
            await pool.query(
                `
                UPDATE worker_profile SET
                    full_name          = ?,
                    mobile             = ?,
                    nid_number         = ?,
                    permanent_location = ?,
                    skills             = ?,
                    latitude           = ?,
                    longitude          = ?
                    ${profileImage ? ", profile_image = ?" : ""}
                WHERE user_id = ?
                `,
                profileImage
                    ? [full_name, mobile, nid_number, permanent_location || null, skills || null, latitude || null, longitude || null, profileImage, req.user.id]
                    : [full_name, mobile, nid_number, permanent_location || null, skills || null, latitude || null, longitude || null, req.user.id]
            );

            return res.json({
                success: true,
                message: "Worker profile updated"
            });
        }

        // INSERT
        await pool.query(
            `
            INSERT INTO worker_profile
            (user_id, full_name, mobile, nid_number, profile_image, permanent_location, skills, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                req.user.id,
                full_name,
                mobile,
                nid_number,
                profileImage,
                permanent_location || null,
                skills     || null,
                latitude   || null,
                longitude  || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Worker profile created"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// UPSERT CUSTOMER PROFILE
exports.createCustomerProfile = async (req, res) => {
    try {
        const {
            full_name,
            mobile,
            nid_number,
            permanent_location,
            latitude,
            longitude
        } = req.body;

        const profileImage = req.file ? req.file.filename : null;

        // Check if profile already exists for this user
        const [existing] = await pool.query(
            "SELECT id FROM customer_profile WHERE user_id = ?",
            [req.user.id]
        );

        if (existing.length > 0) {
            // UPDATE
            await pool.query(
                `
                UPDATE customer_profile SET
                    full_name          = ?,
                    mobile             = ?,
                    nid_number         = ?,
                    permanent_location = ?,
                    latitude           = ?,
                    longitude          = ?
                    ${profileImage ? ", profile_image = ?" : ""}
                WHERE user_id = ?
                `,
                profileImage
                    ? [full_name, mobile, nid_number || null, permanent_location || null, latitude || null, longitude || null, profileImage, req.user.id]
                    : [full_name, mobile, nid_number || null, permanent_location || null, latitude || null, longitude || null, req.user.id]
            );

            return res.json({
                success: true,
                message: "Customer profile updated"
            });
        }

        // INSERT
        await pool.query(
            `
            INSERT INTO customer_profile
            (user_id, full_name, mobile, nid_number, profile_image, permanent_location, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                req.user.id,
                full_name,
                mobile,
                nid_number  || null,
                profileImage,
                permanent_location || null,
                latitude   || null,
                longitude  || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Customer profile created"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// const pool = require("../config/db");

// GET profile
exports.getProfile = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, name, mobile, role, email, address, avatar_url, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: "User not found" });
        res.json({ success: true, profile: rows[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, address } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Name is required" });
        }

        await pool.query(
            `UPDATE users SET name = ?, email = ?, address = ? WHERE id = ?`,
            [name.trim(), email?.trim() || null, address?.trim() || null, req.user.id]
        );

        // Return updated user
        const [rows] = await pool.query(
            `SELECT id, name, mobile, role, email, address, avatar_url, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        res.json({ success: true, profile: rows[0], message: "Profile updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getCustomerProfile = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM customer_profile WHERE user_id = ?",
            [req.user.id]
        );
        if (rows.length === 0) {
            return res.json({ success: true, profile: null });
        }
        res.json({ success: true, profile: rows[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
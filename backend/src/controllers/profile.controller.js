// controllers/profile.controller.js
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
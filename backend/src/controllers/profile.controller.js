const pool = require("../config/db");


// CREATE WORKER PROFILE

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

        const profileImage =
            req.file ? req.file.filename : null;

        await pool.query(
            `
            INSERT INTO worker_profile
            (
                user_id,
                full_name,
                mobile,
                nid_number,
                profile_image,
                permanent_location,
                skills,
                latitude,
                longitude
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                req.user.id,
                full_name,
                mobile,
                nid_number,
                profileImage,
                permanent_location,
                skills,
                latitude,
                longitude
            ]
        );

        res.status(201).json({
            success: true,
            message: "Worker profile created"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



// CREATE CUSTOMER PROFILE

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

        const profileImage =
            req.file ? req.file.filename : null;

        await pool.query(
            `
            INSERT INTO customer_profile
            (
                user_id,
                full_name,
                mobile,
                profile_image,
                nid_number,
                permanent_location,
                latitude,
                longitude
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                req.user.id,
                full_name,
                mobile,
                profileImage,
                nid_number,
                permanent_location,
                latitude,
                longitude
            ]
        );

        res.status(201).json({
            success: true,
            message: "Customer profile created"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};
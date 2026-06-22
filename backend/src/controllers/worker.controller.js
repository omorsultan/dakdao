const pool = require("../config/db");

// FETCH ALL ACTIVE WORKERS
exports.getAllWorkers = async (req, res) => {
    try {
        // Query to fetch only required tracking metrics
        const [workers] = await pool.query(
            `
            SELECT 
                id,
                user_id,
                full_name,
                profile_image,
                permanent_location,
                skills,
                is_verified,
                created_at
            FROM worker_profile
            ORDER BY is_verified DESC, created_at DESC
            `
        );

        res.json({
            success: true,
            count: workers.length,
            workers: workers.map(worker => ({
                id: worker.id,
                user_id: worker.user_id,
                full_name: worker.full_name,
                // Provide path safely formatted for frontend img elements
                profile_image: worker.profile_image ? `/uploads/${worker.profile_image}` : null,
                location: worker.permanent_location || "Not Provided",
                // Format comma separated skills into a readable string or array fallback
                skills: worker.skills ? worker.skills.split(",").map(s => s.trim()) : [],
                is_verified: Boolean(worker.is_verified),
                joined_at: worker.created_at
            }))
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to extract active worker ecosystem vectors.", 
            error: error.message 
        });
    }
};
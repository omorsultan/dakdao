require("dotenv").config();

const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 5000;


async function startServer() {
    try {
        const connection = await pool.getConnection();

        console.log("✅ MySQL Connected");

        connection.release();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("❌ Database Connection Failed");
        console.error(error.message);
    }
}

startServer();
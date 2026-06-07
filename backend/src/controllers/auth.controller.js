const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");


// REGISTER
exports.register = async (req, res) => {
    try {
        const { name, mobile, password, role } = req.body;

        if (!name || !mobile || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const [existingUser] = await pool.query(
            "SELECT id FROM users WHERE mobile = ?",
            [mobile]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                message: "Mobile already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `
            INSERT INTO users
            (name,mobile,password,role)
            VALUES (?,?,?,?)
            `,
            [
                name,
                mobile,
                hashedPassword,
                role || "customer"
            ]
        );

        res.status(201).json({
            success: true,
            userId: result.insertId
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};



// LOGIN
exports.login = async (req, res) => {
    try {

        const { mobile, password } = req.body;

        const [users] = await pool.query(
            "SELECT * FROM users WHERE mobile = ?",
            [mobile]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                mobile: user.mobile,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
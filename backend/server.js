const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/users");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/auth");
const issueRoutes = require("./routes/issues");
const messagesRoutes = require("./routes/messages");
const announcementsRoutes = require("./routes/announcements");
const notificationsRoutes = require("./routes/notifications");
const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);

// Middlewares
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:5173",
		credentials: true,
	}),
);

app.use(express.json());

app.use(
	session({
		store: new PgSession({
			pool: pool,
			tableName: "sessions",
			createTableIfMissing: false,
		}),

		secret: process.env.SESSION_SECRET,

		resave: false,
		saveUninitialized: false,

		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 1000 * 60 * 60 * 24,
		},
	}),
);
// Check active user account on every request
app.use(async (req, res, next) => {
	const userId = req.session?.userId;

	// Allow requests without an existing session
	if (!userId) {
		return next();
	}

	try {
		const result = await pool.query(
			"SELECT is_active FROM users WHERE id = $1",
			[userId],
		);

		const user = result.rows[0];

		if (!user || !user.is_active) {
			return req.session.destroy((error) => {
				if (error) {
					console.error("Session destroy error:", error);
				}

				res.clearCookie("connect.sid");

				return res.status(403).json({
					message: "حساب کاربری شما غیرفعال شده است.",
				});
			});
		}

		next();
	} catch (error) {
		console.error("Active user check error:", error);

		return res.status(500).json({
			message: "خطا در بررسی وضعیت حساب کاربری.",
		});
	}
});
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/issues", messagesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/notifications", notificationsRoutes);
// Test route
app.get("/", (req, res) => {
	res.json({
		message: "Campus Issues API is running!",
	});
});

// Start server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

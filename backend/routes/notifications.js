const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// Get notifications of the logged-in user
router.get("/", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		const userResult = await pool.query(
			`SELECT is_active FROM users WHERE id = $1`,
			[req.session.userId],
		);

		if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
			return res.status(403).json({
				message: "حساب کاربری شما غیرفعال است.",
			});
		}

		const result = await pool.query(
			`SELECT
                id,
                issue_id,
                title,
                message,
                type,
                is_read,
                created_at
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 50`,
			[req.session.userId],
		);

		return res.json({
			notifications: result.rows,
		});
	} catch (error) {
		console.error("Get notifications error:", error);

		return res.status(500).json({
			message: "دریافت اعلان‌ها با خطا مواجه شد.",
		});
	}
});

// Get unread notifications count
router.get("/unread-count", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}
		const userResult = await pool.query(
			`SELECT is_active FROM users WHERE id = $1`,
			[req.session.userId],
		);

		if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
			return res.status(403).json({
				message: "حساب کاربری شما غیرفعال است.",
			});
		}
		const result = await pool.query(
			`SELECT COUNT(*) AS count
             FROM notifications
             WHERE user_id = $1
               AND is_read = FALSE`,
			[req.session.userId],
		);

		return res.json({
			count: Number(result.rows[0].count),
		});
	} catch (error) {
		console.error("Get unread notifications count error:", error);

		return res.status(500).json({
			message: "دریافت تعداد اعلان‌های خوانده‌نشده با خطا مواجه شد.",
		});
	}
});

// Mark a notification as read
router.patch("/:id/read", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		const notificationId = Number(req.params.id);

		if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
			return res.status(400).json({
				message: "شناسه اعلان معتبر نیست.",
			});
		}
		const userResult = await pool.query(
			`SELECT is_active FROM users WHERE id = $1`,
			[req.session.userId],
		);
		if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
			return res.status(403).json({
				message: "حساب کاربری شما غیرفعال است.",
			});
		}
		const result = await pool.query(
			`UPDATE notifications
             SET is_read = TRUE
             WHERE id = $1
               AND user_id = $2
             RETURNING id, is_read`,
			[notificationId, req.session.userId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message: "اعلان موردنظر پیدا نشد.",
			});
		}

		return res.json({
			message: "اعلان خوانده شد.",
			notification: result.rows[0],
		});
	} catch (error) {
		console.error("Mark notification as read error:", error);

		return res.status(500).json({
			message: "به‌روزرسانی اعلان با خطا مواجه شد.",
		});
	}
});

// Mark all notifications as read
router.patch("/read-all", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}
		const userResult = await pool.query(
			`SELECT is_active FROM users WHERE id = $1`,
			[req.session.userId],
		);

		if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
			return res.status(403).json({
				message: "حساب کاربری شما غیرفعال است.",
			});
		}
		await pool.query(
			`UPDATE notifications
             SET is_read = TRUE
             WHERE user_id = $1
               AND is_read = FALSE`,
			[req.session.userId],
		);

		return res.json({
			message: "تمام اعلان‌ها خوانده شدند.",
		});
	} catch (error) {
		console.error("Mark all notifications as read error:", error);

		return res.status(500).json({
			message: "به‌روزرسانی اعلان‌ها با خطا مواجه شد.",
		});
	}
});

module.exports = router;

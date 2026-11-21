const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// Get announcements based on user role
router.get("/", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		const userResult = await pool.query(
			`SELECT id, role, is_active
			 FROM users
			 WHERE id = $1`,
			[req.session.userId],
		);

		const user = userResult.rows[0];

		if (!user || !user.is_active) {
			return res.status(403).json({
				message: "دسترسی غیرمجاز است.",
			});
		}

		const result = await pool.query(
			`SELECT
				a.id,
				a.title,
				a.content,
				a.type,
				a.status,
				a.created_at,
				a.updated_at,
				u.full_name AS creator_name
			FROM announcements a
			JOIN users u ON u.id = a.created_by
			WHERE ($1 = 'manager' OR a.status = 'published')
			ORDER BY a.created_at DESC`,
			[user.role],
		);

		return res.json({
			announcements: result.rows,
		});
	} catch (error) {
		console.error("Get announcements error:", error);

		return res.status(500).json({
			message: "دریافت اطلاعیه‌ها با خطا مواجه شد.",
		});
	}
});

// Create a new announcement (manager only)
router.post("/", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		const userResult = await pool.query(
			`SELECT id
			 FROM users
			 WHERE id = $1
			   AND role = 'manager'
			   AND is_active = TRUE`,
			[req.session.userId],
		);

		if (userResult.rows.length === 0) {
			return res.status(403).json({
				message: "فقط مدیر مجاز به ثبت اطلاعیه است.",
			});
		}

		const { title, content, type, status } = req.body;

		if (
			typeof title !== "string" ||
			typeof content !== "string" ||
			!title.trim() ||
			!content.trim()
		) {
			return res.status(400).json({
				message: "عنوان و متن اطلاعیه الزامی هستند.",
			});
		}

		if (title.trim().length > 150 || content.trim().length > 5000) {
			return res.status(400).json({
				message: "طول عنوان یا متن اطلاعیه بیش از حد مجاز است.",
			});
		}

		const allowedTypes = ["general", "important", "warning"];
		const allowedStatuses = ["draft", "published"];

		if (!allowedTypes.includes(type) || !allowedStatuses.includes(status)) {
			return res.status(400).json({
				message: "نوع یا وضعیت اطلاعیه معتبر نیست.",
			});
		}

		const result = await pool.query(
			`INSERT INTO announcements
			 (title, content, type, status, created_by)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING *`,
			[title.trim(), content.trim(), type, status, req.session.userId],
		);

		return res.status(201).json({
			message: "اطلاعیه با موفقیت ثبت شد.",
			announcement: result.rows[0],
		});
	} catch (error) {
		console.error("Create announcement error:", error);

		return res.status(500).json({
			message: "ثبت اطلاعیه با خطا مواجه شد.",
		});
	}
});

// Update an announcement (manager only)
router.put("/:id", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		const managerResult = await pool.query(
			`SELECT id
			 FROM users
			 WHERE id = $1
			   AND role = 'manager'
			   AND is_active = TRUE`,
			[req.session.userId],
		);

		if (managerResult.rows.length === 0) {
			return res.status(403).json({
				message: "فقط مدیر مجاز به ویرایش اطلاعیه است.",
			});
		}

		const announcementId = Number(req.params.id);

		if (!Number.isSafeInteger(announcementId) || announcementId <= 0) {
			return res.status(400).json({
				message: "شناسه اطلاعیه معتبر نیست.",
			});
		}

		const { title, content, type, status } = req.body;

		if (
			typeof title !== "string" ||
			typeof content !== "string" ||
			!title.trim() ||
			!content.trim()
		) {
			return res.status(400).json({
				message: "عنوان و متن اطلاعیه الزامی هستند.",
			});
		}

		if (title.trim().length > 150 || content.trim().length > 5000) {
			return res.status(400).json({
				message: "طول عنوان یا متن اطلاعیه بیش از حد مجاز است.",
			});
		}

		const allowedTypes = ["general", "important", "warning"];
		const allowedStatuses = ["draft", "published"];

		if (!allowedTypes.includes(type) || !allowedStatuses.includes(status)) {
			return res.status(400).json({
				message: "نوع یا وضعیت اطلاعیه معتبر نیست.",
			});
		}

		const result = await pool.query(
			`UPDATE announcements
			 SET title = $1,
			     content = $2,
			     type = $3,
			     status = $4,
			     updated_at = NOW()
			 WHERE id = $5
			 RETURNING *`,
			[title.trim(), content.trim(), type, status, announcementId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message: "اطلاعیه موردنظر پیدا نشد.",
			});
		}

		return res.json({
			message: "اطلاعیه با موفقیت ویرایش شد.",
			announcement: result.rows[0],
		});
	} catch (error) {
		console.error("Update announcement error:", error);

		return res.status(500).json({
			message: "ویرایش اطلاعیه با خطا مواجه شد.",
		});
	}
});

// Delete an announcement (manager only)
router.delete("/:id", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		const managerResult = await pool.query(
			`SELECT id
			 FROM users
			 WHERE id = $1
			   AND role = 'manager'
			   AND is_active = TRUE`,
			[req.session.userId],
		);

		if (managerResult.rows.length === 0) {
			return res.status(403).json({
				message: "فقط مدیر مجاز به حذف اطلاعیه است.",
			});
		}

		const announcementId = Number(req.params.id);

		if (!Number.isSafeInteger(announcementId) || announcementId <= 0) {
			return res.status(400).json({
				message: "شناسه اطلاعیه معتبر نیست.",
			});
		}

		const result = await pool.query(
			`DELETE FROM announcements
			 WHERE id = $1
			 RETURNING id`,
			[announcementId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message: "اطلاعیه موردنظر پیدا نشد.",
			});
		}

		return res.json({
			message: "اطلاعیه با موفقیت حذف شد.",
		});
	} catch (error) {
		console.error("Delete announcement error:", error);

		return res.status(500).json({
			message: "حذف اطلاعیه با خطا مواجه شد.",
		});
	}
});

module.exports = router;

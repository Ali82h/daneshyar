const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const router = express.Router();

// Check manager access
async function requireManager(req, res, next) {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		const result = await pool.query(
			`SELECT id, role, is_active
			 FROM users
			 WHERE id = $1`,
			[req.session.userId],
		);

		const user = result.rows[0];

		if (!user || !user.is_active || user.role !== "manager") {
			return res.status(403).json({
				message: "دسترسی غیرمجاز است.",
			});
		}

		req.manager = user;
		next();
	} catch (error) {
		console.error("Manager authorization error:", error);
		return res.status(500).json({
			message: "خطا در بررسی دسترسی.",
		});
	}
}
// Get all users
router.get("/", requireManager, async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT
                u.id,
                u.full_name,
                u.email,
                u.role,
                u.is_active,
                u.created_at,
                d.id AS department_id,
                d.name AS department_name
             FROM users u
             LEFT JOIN department_members dm
                ON dm.user_id = u.id
             LEFT JOIN departments d
                ON d.id = dm.department_id
             ORDER BY u.created_at DESC`,
		);

		return res.json({
			users: result.rows,
		});
	} catch (error) {
		console.error("Get users error:", error);

		return res.status(500).json({
			message: "خطا در دریافت فهرست کاربران.",
		});
	}
});
// Get active departments
router.get("/departments", requireManager, async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT
		d.id,
		d.name,
		d.code,
		d.description,
		d.is_active,
		COUNT(DISTINCT u.id)::int AS expert_count
	FROM departments d
	LEFT JOIN department_members dm
		ON dm.department_id = d.id
	LEFT JOIN users u
		ON u.id = dm.user_id
		AND u.role = 'expert'
		AND u.is_active = TRUE
	GROUP BY d.id
	ORDER BY d.name`,
		);

		return res.json({
			departments: result.rows,
		});
	} catch (error) {
		console.error("Get departments error:", error);
		return res.status(500).json({
			message: "خطا در دریافت واحدهای دانشگاهی.",
		});
	}
});
// Get active experts of a department
router.get(
	"/departments/:departmentId/experts",
	requireManager,
	async (req, res) => {
		try {
			const departmentId = Number(req.params.departmentId);

			if (!Number.isSafeInteger(departmentId) || departmentId <= 0) {
				return res.status(400).json({
					message: "شناسه واحد دانشگاهی معتبر نیست.",
				});
			}

			const departmentResult = await pool.query(
				`SELECT id
				 FROM departments
				 WHERE id = $1
				   AND is_active = TRUE`,
				[departmentId],
			);

			if (departmentResult.rows.length === 0) {
				return res.status(404).json({
					message: "واحد دانشگاهی پیدا نشد.",
				});
			}

			const result = await pool.query(
				`SELECT
					u.id,
					u.full_name,
					u.email
				 FROM department_members dm
				 JOIN users u ON u.id = dm.user_id
				 WHERE dm.department_id = $1
				   AND u.role = 'expert'
				   AND u.is_active = TRUE
				 ORDER BY u.full_name`,
				[departmentId],
			);

			return res.json({
				experts: result.rows,
			});
		} catch (error) {
			console.error("Get department experts error:", error);

			return res.status(500).json({
				message: "خطا در دریافت فهرست کارشناسان.",
			});
		}
	},
);
// Create expert account
router.post("/experts", requireManager, async (req, res) => {
	const { fullName, email, password, departmentId } = req.body;

	const normalizedEmail = String(email || "")
		.trim()
		.toLowerCase();
	const normalizedName = String(fullName || "").trim();
	const parsedDepartmentId = Number(departmentId);

	if (
		!normalizedName ||
		normalizedName.length > 150 ||
		!normalizedEmail ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
		typeof password !== "string" ||
		password.length < 8 ||
		!Number.isSafeInteger(parsedDepartmentId) ||
		parsedDepartmentId <= 0
	) {
		return res.status(400).json({
			message: "اطلاعات واردشده معتبر نیست.",
		});
	}

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const departmentResult = await client.query(
			`SELECT id
			 FROM departments
			 WHERE id = $1 AND is_active = TRUE`,
			[parsedDepartmentId],
		);

		if (departmentResult.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(400).json({
				message: "واحد دانشگاهی انتخاب‌شده معتبر نیست.",
			});
		}

		const existingUser = await client.query(
			"SELECT id FROM users WHERE email = $1",
			[normalizedEmail],
		);

		if (existingUser.rows.length > 0) {
			await client.query("ROLLBACK");
			return res.status(409).json({
				message: "این ایمیل قبلاً ثبت شده است.",
			});
		}

		const passwordHash = await bcrypt.hash(password, 12);

		const userResult = await client.query(
			`INSERT INTO users (full_name, email, password_hash, role)
			 VALUES ($1, $2, $3, 'expert')
			 RETURNING id, full_name, email, role`,
			[normalizedName, normalizedEmail, passwordHash],
		);

		const expert = userResult.rows[0];

		await client.query(
			`INSERT INTO department_members (department_id, user_id)
			 VALUES ($1, $2)`,
			[parsedDepartmentId, expert.id],
		);

		await client.query("COMMIT");

		return res.status(201).json({
			message: "حساب کارشناس با موفقیت ایجاد شد.",
			expert,
		});
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Create expert error:", error);

		return res.status(500).json({
			message: "خطا در ایجاد حساب کارشناس.",
		});
	} finally {
		client.release();
	}
});

// Reset expert password
router.patch(
	"/experts/:expertId/password",
	requireManager,
	async (req, res) => {
		const expertId = Number(req.params.expertId);
		const { password } = req.body;

		if (
			!Number.isSafeInteger(expertId) ||
			expertId <= 0 ||
			typeof password !== "string" ||
			password.length < 8
		) {
			return res.status(400).json({
				message: "اطلاعات واردشده معتبر نیست.",
			});
		}

		const client = await pool.connect();

		try {
			const passwordHash = await bcrypt.hash(password, 12);

			await client.query("BEGIN");

			const updateResult = await client.query(
				`UPDATE users
				 SET password_hash = $1,
				     updated_at = NOW()
				 WHERE id = $2
				   AND role = 'expert'
				   AND is_active = TRUE
				 RETURNING id`,
				[passwordHash, expertId],
			);

			if (updateResult.rows.length === 0) {
				await client.query("ROLLBACK");

				return res.status(404).json({
					message: "کارشناس موردنظر پیدا نشد.",
				});
			}

			await client.query(
				`DELETE FROM sessions
				 WHERE sess ->> 'userId' = $1`,
				[String(expertId)],
			);

			await client.query("COMMIT");

			return res.json({
				message: "رمز عبور کارشناس با موفقیت تغییر کرد.",
			});
		} catch (error) {
			await client.query("ROLLBACK");
			console.error("Reset expert password error:", error);

			return res.status(500).json({
				message: "خطا در تغییر رمز عبور کارشناس.",
			});
		} finally {
			client.release();
		}
	},
);

// Change user account status
router.patch("/:userId/status", requireManager, async (req, res) => {
	try {
		const userId = Number(req.params.userId);
		const { isActive } = req.body;

		if (!Number.isInteger(userId) || userId <= 0) {
			return res.status(400).json({
				message: "شناسه کاربر نامعتبر است.",
			});
		}

		if (typeof isActive !== "boolean") {
			return res.status(400).json({
				message: "وضعیت حساب نامعتبر است.",
			});
		}

		const targetUser = await pool.query(
			`SELECT role FROM users WHERE id = $1`,
			[userId],
		);

		if (targetUser.rows.length === 0) {
			return res.status(404).json({
				message: "کاربر موردنظر پیدا نشد.",
			});
		}

		if (targetUser.rows[0].role === "manager") {
			return res.status(403).json({
				message: "امکان تغییر وضعیت حساب مدیر وجود ندارد.",
			});
		}

		const result = await pool.query(
			`UPDATE users
			 SET is_active = $1
			 WHERE id = $2
			 RETURNING id, full_name, email, is_active`,
			[isActive, userId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message: "کاربر موردنظر پیدا نشد.",
			});
		}

		return res.json({
			message: "وضعیت حساب کاربر با موفقیت تغییر کرد.",
			user: result.rows[0],
		});
	} catch (error) {
		console.error("Change user status error:", error);

		return res.status(500).json({
			message: "خطا در تغییر وضعیت حساب کاربر.",
		});
	}
});
// Create department
router.post("/departments", requireManager, async (req, res) => {
	try {
		const name = String(req.body.name || "").trim();
		const code = String(req.body.code || "").trim();
		const description = String(req.body.description || "").trim();

		if (!name || !code) {
			return res.status(400).json({
				message: "نام و کد واحد الزامی هستند.",
			});
		}

		if (name.length > 150 || code.length > 30 || description.length > 500) {
			return res.status(400).json({
				message: "طول اطلاعات واردشده بیش از حد مجاز است.",
			});
		}

		const result = await pool.query(
			`INSERT INTO departments (name, code, description)
			 VALUES ($1, $2, $3)
			 RETURNING id, name, code, description, is_active`,
			[name, code, description || null],
		);

		return res.status(201).json({
			message: "واحد دانشگاهی با موفقیت ایجاد شد.",
			department: result.rows[0],
		});
	} catch (error) {
		if (error.code === "23505") {
			return res.status(409).json({
				message: "نام یا کد این واحد قبلاً ثبت شده است.",
			});
		}

		console.error("Create department error:", error);

		return res.status(500).json({
			message: "خطا در ایجاد واحد دانشگاهی.",
		});
	}
});
// Update department
router.patch("/departments/:departmentId", requireManager, async (req, res) => {
	try {
		const departmentId = Number(req.params.departmentId);
		const name = String(req.body.name || "").trim();
		const code = String(req.body.code || "").trim();
		const description = String(req.body.description || "").trim();

		if (!Number.isInteger(departmentId) || departmentId <= 0) {
			return res.status(400).json({ message: "شناسه واحد نامعتبر است." });
		}

		if (!name || !code) {
			return res.status(400).json({
				message: "نام و کد واحد الزامی هستند.",
			});
		}

		if (name.length > 150 || code.length > 30 || description.length > 500) {
			return res.status(400).json({
				message: "طول اطلاعات واردشده بیش از حد مجاز است.",
			});
		}

		const result = await pool.query(
			`UPDATE departments
			 SET name = $1, code = $2, description = $3
			 WHERE id = $4
			 RETURNING id, name, code, description, is_active`,
			[name, code, description || null, departmentId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message: "واحد موردنظر پیدا نشد.",
			});
		}

		return res.json({
			message: "اطلاعات واحد با موفقیت ویرایش شد.",
			department: result.rows[0],
		});
	} catch (error) {
		if (error.code === "23505") {
			return res.status(409).json({
				message: "نام یا کد این واحد قبلاً ثبت شده است.",
			});
		}

		console.error("Update department error:", error);

		return res.status(500).json({
			message: "خطا در ویرایش اطلاعات واحد.",
		});
	}
});
// Update department status
router.patch(
	"/departments/:departmentId/status",
	requireManager,
	async (req, res) => {
		try {
			const departmentId = Number(req.params.departmentId);
			const { isActive } = req.body;

			if (!Number.isInteger(departmentId) || departmentId <= 0) {
				return res.status(400).json({
					message: "شناسه واحد نامعتبر است.",
				});
			}

			if (typeof isActive !== "boolean") {
				return res.status(400).json({
					message: "وضعیت واحد نامعتبر است.",
				});
			}

			const result = await pool.query(
				`UPDATE departments
				 SET is_active = $1
				 WHERE id = $2
				 RETURNING id, name, is_active`,
				[isActive, departmentId],
			);

			if (result.rows.length === 0) {
				return res.status(404).json({
					message: "واحد موردنظر پیدا نشد.",
				});
			}

			return res.json({
				message: "وضعیت واحد با موفقیت تغییر کرد.",
				department: result.rows[0],
			});
		} catch (error) {
			console.error("Update department status error:", error);

			return res.status(500).json({
				message: "خطا در تغییر وضعیت واحد.",
			});
		}
	},
);
// Update current user's full name
router.patch("/profile", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		const fullName = String(req.body.fullName || "").trim();

		if (!fullName || fullName.length > 150) {
			return res.status(400).json({
				message: "نام و نام خانوادگی باید بین ۱ تا ۱۵۰ کاراکتر باشد.",
			});
		}

		const result = await pool.query(
			`UPDATE users
             SET full_name = $1,
                 updated_at = NOW()
             WHERE id = $2
               AND is_active = TRUE
             RETURNING id, full_name, email, role`,
			[fullName, req.session.userId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message: "حساب کاربری پیدا نشد.",
			});
		}

		return res.json({
			message: "نام و نام خانوادگی با موفقیت تغییر کرد.",
			user: result.rows[0],
		});
	} catch (error) {
		console.error("Update profile error:", error);

		return res.status(500).json({
			message: "خطا در ویرایش اطلاعات حساب کاربری.",
		});
	}
});
module.exports = router;

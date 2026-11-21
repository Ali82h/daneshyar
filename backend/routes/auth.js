const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const router = express.Router();

// Student registration
router.post("/register", async (req, res) => {
	try {
		const { full_name, email, password } = req.body;

		// Validate required fields
		if (!full_name || !email || !password) {
			return res.status(400).json({
				message: "تمام فیلدها الزامی هستند.",
			});
		}

		const normalizedEmail = email.trim().toLowerCase();

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!emailRegex.test(normalizedEmail)) {
			return res.status(400).json({
				message: "فرمت ایمیل معتبر نیست.",
			});
		}

		// Validate password length
		if (password.length < 8) {
			return res.status(400).json({
				message: "رمز عبور باید حداقل ۸ کاراکتر باشد.",
			});
		}

		// Check duplicate email
		const existingUser = await pool.query(
			"SELECT id FROM users WHERE LOWER(email) = $1",
			[normalizedEmail],
		);

		if (existingUser.rows.length > 0) {
			return res.status(409).json({
				message: "این ایمیل قبلاً ثبت شده است.",
			});
		}

		// Hash password
		const passwordHash = await bcrypt.hash(password, 12);

		// Create student account
		const result = await pool.query(
			`INSERT INTO users (full_name, email, password_hash, role)
             VALUES ($1, $2, $3, 'student')
             RETURNING id, full_name, email, role, created_at`,
			[full_name.trim(), normalizedEmail, passwordHash],
		);

		// Create session after successful registration
		req.session.regenerate((error) => {
			if (error) {
				console.error("Session error:", error);

				return res.status(500).json({
					message: "حساب ساخته شد، اما ورود خودکار انجام نشد.",
				});
			}

			req.session.userId = result.rows[0].id;

			req.session.save((saveError) => {
				if (saveError) {
					console.error("Session save error:", saveError);

					return res.status(500).json({
						message: "حساب ساخته شد، اما ورود خودکار انجام نشد.",
					});
				}

				return res.status(201).json({
					message: "ثبت‌نام و ورود با موفقیت انجام شد.",
					user: result.rows[0],
				});
			});
		});
	} catch (error) {
		console.error("Registration error:", error);

		return res.status(500).json({
			message: "خطای داخلی سرور.",
		});
	}
});

// User login
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				message: "ایمیل و رمز عبور الزامی هستند.",
			});
		}

		const normalizedEmail = email.trim().toLowerCase();

		const result = await pool.query(
			`SELECT id, full_name, email, password_hash, role, is_active
             FROM users
             WHERE LOWER(email) = $1`,
			[normalizedEmail],
		);

		if (result.rows.length === 0) {
			return res.status(401).json({
				message: "ایمیل یا رمز عبور اشتباه است.",
			});
		}

		const user = result.rows[0];

		const isPasswordValid = await bcrypt.compare(password, user.password_hash);

		if (!isPasswordValid) {
			return res.status(401).json({
				message: "ایمیل یا رمز عبور اشتباه است.",
			});
		}
		if (!user.is_active) {
			return res.status(403).json({
				message: "حساب کاربری شما غیرفعال شده است. با مدیر سامانه تماس بگیرید.",
			});
		}

		req.session.regenerate((error) => {
			if (error) {
				console.error("Session regeneration error:", error);

				return res.status(500).json({
					message: "خطا در ایجاد نشست کاربری.",
				});
			}

			req.session.userId = user.id;

			req.session.save((saveError) => {
				if (saveError) {
					console.error("Session save error:", saveError);

					return res.status(500).json({
						message: "خطا در ذخیره نشست کاربری.",
					});
				}

				return res.status(200).json({
					message: "ورود با موفقیت انجام شد.",
					user: {
						id: user.id,
						full_name: user.full_name,
						email: user.email,
						role: user.role,
					},
				});
			});
		});
	} catch (error) {
		console.error("Login error:", error);

		return res.status(500).json({
			message: "خطای داخلی سرور.",
		});
	}
});

// Get current logged-in user
router.get("/me", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "کاربر وارد حساب نشده است.",
			});
		}

		const result = await pool.query(
			`SELECT id, full_name, email, role
             FROM users
             WHERE id = $1 AND is_active = TRUE`,
			[req.session.userId],
		);

		if (result.rows.length === 0) {
			return req.session.destroy((error) => {
				if (error) {
					console.error("Session destroy error:", error);
				}

				res.clearCookie("connect.sid");

				return res.status(401).json({
					message: "حساب کاربری پیدا نشد یا غیرفعال شده است.",
				});
			});
		}

		return res.status(200).json({
			user: result.rows[0],
		});
	} catch (error) {
		console.error("Get user error:", error);

		return res.status(500).json({
			message: "خطای داخلی سرور.",
		});
	}
});
// Change current user's password
router.patch("/change-password", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		const { currentPassword, newPassword } = req.body;

		if (
			typeof currentPassword !== "string" ||
			typeof newPassword !== "string" ||
			newPassword.length < 8
		) {
			return res.status(400).json({
				message: "رمز جدید باید حداقل ۸ کاراکتر باشد.",
			});
		}

		const result = await pool.query(
			`SELECT password_hash
             FROM users
             WHERE id = $1 AND is_active = TRUE`,
			[req.session.userId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message: "حساب کاربری پیدا نشد.",
			});
		}

		const isCurrentPasswordValid = await bcrypt.compare(
			currentPassword,
			result.rows[0].password_hash,
		);

		if (!isCurrentPasswordValid) {
			return res.status(400).json({
				message: "رمز عبور فعلی اشتباه است.",
			});
		}

		const newPasswordHash = await bcrypt.hash(newPassword, 12);

		const client = await pool.connect();

		try {
			await client.query("BEGIN");

			await client.query(
				`UPDATE users
         SET password_hash = $1,
             updated_at = NOW()
         WHERE id = $2`,
				[newPasswordHash, req.session.userId],
			);

			await client.query(
				`DELETE FROM sessions
         WHERE sess->>'userId' = $1
         AND sid <> $2`,
				[String(req.session.userId), req.sessionID],
			);

			await client.query("COMMIT");
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
		return res.json({
			message: "رمز عبور با موفقیت تغییر کرد.",
		});
	} catch (error) {
		console.error("Change password error:", error);

		return res.status(500).json({
			message: "خطا در تغییر رمز عبور.",
		});
	}
});
// User logout
router.post("/logout", (req, res) => {
	req.session.destroy((error) => {
		if (error) {
			console.error("Logout error:", error);

			return res.status(500).json({
				message: "خطا در خروج از حساب کاربری.",
			});
		}

		res.clearCookie("connect.sid");

		return res.status(200).json({
			message: "با موفقیت از حساب خارج شدید.",
		});
	});
});
module.exports = router;

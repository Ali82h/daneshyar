const express = require("express");
const multer = require("multer");
const pool = require("../config/db");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const FileType = require("file-type");
const {
	createNotification,
	notifyActiveManagers,
} = require("../utils/notifications");

const router = express.Router();

// Upload directory
const uploadDirectory = path.join(__dirname, "../uploads/issues");

fs.mkdirSync(uploadDirectory, { recursive: true });

// Allowed file types
const allowedTypes = {
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/webp": [".webp"],
	"image/gif": [".gif"],
	"application/pdf": [".pdf"],
	"application/msword": [".doc"],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
		".docx",
	],
};
// Validate actual file content
async function validateFileContent(file) {
    try {
        const detectedType = await FileType.fromFile(file.path);

        if (!detectedType) {
            return false;
        }

        const extension = path.extname(file.originalname).toLowerCase();

        const expectedMimeTypes = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        };

        if (detectedType.mime !== expectedMimeTypes[extension]) {
            return false;
        }

        return detectedType.mime;
    } catch (error) {
        console.error("File content validation error:", error);
        return false;
    }
}
// Multer configuration
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDirectory);
	},

	filename: (req, file, cb) => {
		const extension = path.extname(file.originalname).toLowerCase();
		cb(null, `${crypto.randomUUID()}${extension}`);
	},
});

const upload = multer({
	storage,

	limits: {
		fileSize: 5 * 1024 * 1024,
		files: 5,
	},

	fileFilter: (req, file, cb) => {
		const extension = path.extname(file.originalname).toLowerCase();
		const allowedExtensions = allowedTypes[file.mimetype];

		if (!allowedExtensions || !allowedExtensions.includes(extension)) {
			return cb(new Error("فرمت یکی از فایل‌های انتخاب‌شده مجاز نیست."));
		}

		cb(null, true);
	},
});

// Check login and upload errors
function uploadFiles(req, res, next) {
	if (!req.session.userId) {
		return res.status(401).json({
			message: "ابتدا وارد حساب کاربری شوید.",
		});
	}

	upload.array("files", 5)(req, res, async (error) => {
		if (error) {
			const message =
				error.code === "LIMIT_FILE_SIZE"
					? "حجم هر فایل نباید بیشتر از ۵ مگابایت باشد."
					: error.code === "LIMIT_FILE_COUNT" ||
						  error.code === "LIMIT_UNEXPECTED_FILE"
						? "حداکثر ۵ فایل می‌توانید ارسال کنید."
						: error.message;

			return res.status(400).json({ message });
		}

		try {
			for (const file of req.files || []) {
				const detectedMimeType = await validateFileContent(file);

				if (!detectedMimeType) {
					await Promise.all(
						req.files.map((uploadedFile) =>
							fs.promises.unlink(uploadedFile.path).catch(() => {}),
						),
					);

					return res.status(400).json({
						message:
							"محتوای واقعی یکی از فایل‌ها با فرمت اعلام‌شده مطابقت ندارد.",
					});
				}
				file.detectedMimeType = detectedMimeType;
			}

			next();
		} catch (validationError) {
			console.error("Upload validation error:", validationError);

			await Promise.all(
				(req.files || []).map((file) =>
					fs.promises.unlink(file.path).catch(() => {}),
				),
			);

			return res.status(500).json({
				message: "بررسی فایل‌های ارسالی با خطا مواجه شد.",
			});
		}
	});
}

// Allowed issue categories
const allowedCategories = [
	"facilities",
	"equipment",
	"cleaning",
	"green_space",
	"electricity",
	"water",
	"other",
];
// Suggested department for each issue category
const categoryDepartmentMap = {
	electricity: "FAC",
	water: "FAC",
	facilities: "FAC",
	cleaning: "FAC",
	green_space: "FAC",
	equipment: "IT",
	other: "ADM",
};
// Get issues created by the logged-in student
router.get("/my", async (req, res) => {
	try {
		// Check login
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		// Get student issues
		const result = await pool.query(
			`SELECT
                i.id,
                i.tracking_code,
                i.title,
                i.category,
                i.location,
                i.status,
                i.created_at,
                i.updated_at
             FROM issues i
             WHERE i.student_id = $1
             ORDER BY i.created_at DESC`,
			[req.session.userId],
		);

		return res.status(200).json({
			issues: result.rows,
		});
	} catch (error) {
		console.error("Get student issues error:", error);

		return res.status(500).json({
			message: "دریافت فهرست مشکلات با خطا مواجه شد.",
		});
	}
});
// Get issues assigned to the logged-in expert
router.get("/assigned", async (req, res) => {
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

		if (!user || !user.is_active || user.role !== "expert") {
			return res.status(403).json({
				message: "دسترسی غیرمجاز است.",
			});
		}

		const result = await pool.query(
			`SELECT
				i.id,
				i.tracking_code,
				i.title,
				i.category,
				i.location,
				i.status,
				i.priority_score,
				i.impact,
i.final_priority,
				i.created_at,
				i.updated_at,
				i.resolved_at,
				u.full_name AS student_name,
				d.name AS department_name,
				a.assigned_at
			FROM assignments a
			JOIN issues i ON i.id = a.issue_id
			JOIN users u ON u.id = i.student_id
			JOIN departments d ON d.id = a.department_id
			WHERE a.expert_id = $1
			  AND a.is_current = TRUE
			ORDER BY
				CASE
					WHEN i.status IN ('resolved', 'rejected') THEN 1
					ELSE 0
				END,
				i.created_at DESC`,
			[user.id],
		);

		return res.json({
			issues: result.rows,
		});
	} catch (error) {
		console.error("Get assigned issues error:", error);

		return res.status(500).json({
			message: "خطا در دریافت درخواست‌ها.",
		});
	}
});
// Get unassigned issues for manager
router.get("/unassigned", async (req, res) => {
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
				message: "دسترسی غیرمجاز است.",
			});
		}

		const result = await pool.query(
			`SELECT
				i.id,
				i.tracking_code,
				i.title,
				i.description,
				i.category,
				i.location,
				i.status,
				i.priority_score,
				i.impact,
i.final_priority,
				i.created_at,
				u.full_name AS student_name,
				d.id AS suggested_department_id,
				d.name AS suggested_department_name,
				d.code AS suggested_department_code
			FROM issues i
			JOIN users u ON u.id = i.student_id
			LEFT JOIN departments d
	ON d.code = CASE i.category
		WHEN 'electricity' THEN 'FAC'
		WHEN 'water' THEN 'FAC'
		WHEN 'facilities' THEN 'FAC'
		WHEN 'cleaning' THEN 'FAC'
		WHEN 'green_space' THEN 'FAC'
		WHEN 'equipment' THEN 'IT'
		ELSE 'ADM'
	END
	AND d.is_active = TRUE
			WHERE i.status = 'submitted'
			  AND NOT EXISTS (
				SELECT 1
				FROM assignments a
				WHERE a.issue_id = i.id
				  AND a.is_current = TRUE
			  )
			ORDER BY i.created_at ASC`,
			[],
		);

		const issues = result.rows.map((issue) => {
			const departmentCode = categoryDepartmentMap[issue.category] || "ADM";

			return {
				...issue,
				suggested_department_code: departmentCode,
			};
		});

		return res.json({ issues });
	} catch (error) {
		console.error("Get unassigned issues error:", error);

		return res.status(500).json({
			message: "خطا در دریافت درخواست‌های ارجاع‌نشده.",
		});
	}
});

// Get all issues for manager
router.get("/all", async (req, res) => {
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
				message: "دسترسی غیرمجاز است.",
			});
		}

		const result = await pool.query(
			`SELECT
				i.id,
				i.tracking_code,
				i.title,
				i.description,
				i.category,
				i.location,
				i.status,
				i.priority_score,
				i.impact,
i.final_priority,
				i.created_at,
				i.updated_at,
				i.resolved_at,
				u.full_name AS student_name,
				COALESCE(d.name, suggested_d.name) AS department_name,
e.full_name AS expert_name
			FROM issues i
			JOIN users u ON u.id = i.student_id
			LEFT JOIN LATERAL (
				SELECT
					a.department_id,
					a.expert_id
				FROM assignments a
				WHERE a.issue_id = i.id
				  AND a.is_current = TRUE
				ORDER BY a.assigned_at DESC
				LIMIT 1
			) current_assignment ON TRUE
			LEFT JOIN departments d
				ON d.id = current_assignment.department_id
				LEFT JOIN departments suggested_d
    ON suggested_d.code = CASE i.category
        WHEN 'electricity' THEN 'FAC'
        WHEN 'water' THEN 'FAC'
        WHEN 'facilities' THEN 'FAC'
        WHEN 'cleaning' THEN 'FAC'
        WHEN 'green_space' THEN 'FAC'
        WHEN 'equipment' THEN 'IT'
        ELSE 'ADM'
    END
    AND suggested_d.is_active = TRUE
			LEFT JOIN users e
				ON e.id = current_assignment.expert_id
			ORDER BY i.created_at DESC`,
			[],
		);

		return res.json({
			issues: result.rows,
		});
	} catch (error) {
		console.error("Get all manager issues error:", error);

		return res.status(500).json({
			message: "دریافت فهرست درخواست‌ها با خطا مواجه شد.",
		});
	}
});

// Assign an issue to an expert
router.post("/:id/assign", async (req, res) => {
	const issueId = Number(req.params.id);
	const departmentId = Number(req.body.departmentId);
	const expertId = Number(req.body.expertId);
	const priority = req.body.priority;
	if (
		!Number.isSafeInteger(issueId) ||
		issueId <= 0 ||
		!Number.isSafeInteger(departmentId) ||
		departmentId <= 0 ||
		!Number.isSafeInteger(expertId) ||
		expertId <= 0 ||
		!["low", "medium", "high"].includes(priority)
	) {
		return res.status(400).json({
			message: "اطلاعات ارجاع معتبر نیست.",
		});
	}

	if (!req.session.userId) {
		return res.status(401).json({
			message: "ابتدا وارد حساب کاربری شوید.",
		});
	}

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		// Check manager access
		const managerResult = await client.query(
			`SELECT id
			 FROM users
			 WHERE id = $1
			   AND role = 'manager'
			   AND is_active = TRUE`,
			[req.session.userId],
		);

		if (managerResult.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(403).json({
				message: "فقط مدیر مجاز به ارجاع درخواست است.",
			});
		}

		// Lock the issue to prevent simultaneous assignments
		const issueResult = await client.query(
			`SELECT id, status, student_id, title
 FROM issues
 WHERE id = $1
 FOR UPDATE`,
			[issueId],
		);

		if (issueResult.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(404).json({
				message: "درخواست موردنظر پیدا نشد.",
			});
		}

		const issue = issueResult.rows[0];

		if (issue.status !== "submitted") {
			await client.query("ROLLBACK");
			return res.status(400).json({
				message: "این درخواست در وضعیت فعلی قابل ارجاع نیست.",
			});
		}

		// Check selected department and expert membership
		const expertResult = await client.query(
			`SELECT u.id
			 FROM users u
			 JOIN department_members dm ON dm.user_id = u.id
			 JOIN departments d ON d.id = dm.department_id
			 WHERE u.id = $1
			   AND u.role = 'expert'
			   AND u.is_active = TRUE
			   AND d.id = $2
			   AND d.is_active = TRUE`,
			[expertId, departmentId],
		);

		if (expertResult.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(400).json({
				message: "کارشناس انتخاب‌شده عضو این واحد نیست یا فعال نیست.",
			});
		}

		// Deactivate any previous assignment
		await client.query(
			`UPDATE assignments
			 SET is_current = FALSE
			 WHERE issue_id = $1
			   AND is_current = TRUE`,
			[issueId],
		);

		// Create the new assignment
		await client.query(
			`INSERT INTO assignments
			 (issue_id, department_id, expert_id, assigned_by, is_current)
			 VALUES ($1, $2, $3, $4, TRUE)`,
			[issueId, departmentId, expertId, req.session.userId],
		);

		// Update issue status
		await client.query(
			`UPDATE issues
     SET status = 'assigned',
         final_priority = $1,
         updated_at = NOW()
     WHERE id = $2`,
			[priority, issueId],
		);

		// Record status history
		await client.query(
			`INSERT INTO issue_history
			 (issue_id, changed_by, old_status, new_status, description)
			 VALUES ($1, $2, $3, 'assigned', $4)`,
			[
				issueId,
				req.session.userId,
				issue.status,
				"درخواست توسط مدیر به کارشناس ارجاع داده شد.",
			],
		);
		// Notify the student
		await createNotification(client, {
			userId: issue.student_id,
			issueId: issue.id,
			title: "درخواست شما ارجاع شد",
			message: `درخواست «${issue.title}» به کارشناس ارجاع داده شد.`,
			type: "issue_assigned",
		});

		// Notify the assigned expert
		await createNotification(client, {
			userId: expertId,
			issueId: issue.id,
			title: "درخواست جدید به شما ارجاع شد",
			message: `درخواست «${issue.title}» برای رسیدگی به شما ارجاع شده است.`,
			type: "issue_assigned",
		});
		await client.query("COMMIT");

		return res.status(200).json({
			message: "درخواست با موفقیت به کارشناس ارجاع داده شد.",
		});
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		console.error("Assign issue error:", error);

		return res.status(500).json({
			message: "خطا در ارجاع درخواست.",
		});
	} finally {
		client.release();
	}
});
// Update issue priority by manager

// Reject an issue by manager
router.patch("/:id/reject", async (req, res) => {
	const issueId = Number(req.params.id);
	const { reason } = req.body;

	if (!Number.isSafeInteger(issueId) || issueId <= 0) {
		return res.status(400).json({
			message: "شناسه درخواست معتبر نیست.",
		});
	}

	if (
		typeof reason !== "string" ||
		!reason.trim() ||
		reason.trim().length > 1000
	) {
		return res.status(400).json({
			message: "دلیل رد درخواست الزامی است و نباید بیشتر از ۱۰۰۰ کاراکتر باشد.",
		});
	}

	if (!req.session.userId) {
		return res.status(401).json({
			message: "ابتدا وارد حساب کاربری شوید.",
		});
	}

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		// Check manager access
		const managerResult = await client.query(
			`SELECT id
			 FROM users
			 WHERE id = $1
			   AND role = 'manager'
			   AND is_active = TRUE`,
			[req.session.userId],
		);

		if (managerResult.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(403).json({
				message: "فقط مدیر مجاز به رد درخواست است.",
			});
		}

		// Lock the issue
		const issueResult = await client.query(
			`SELECT id, status, student_id, title
FROM issues
WHERE id = $1
FOR UPDATE`,
			[issueId],
		);

		if (issueResult.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(404).json({
				message: "درخواست موردنظر پیدا نشد.",
			});
		}

		const issue = issueResult.rows[0];

		if (issue.status !== "submitted") {
			await client.query("ROLLBACK");
			return res.status(400).json({
				message: "فقط درخواست‌های ثبت‌شده و ارجاع‌نشده قابل رد هستند.",
			});
		}

		// Update issue status
		await client.query(
			`UPDATE issues
			 SET status = 'rejected',
			     updated_at = NOW()
			 WHERE id = $1`,
			[issueId],
		);

		// Save rejection reason in issue history
		await client.query(
			`INSERT INTO issue_history
			 (issue_id, changed_by, old_status, new_status, description)
			 VALUES ($1, $2, $3, 'rejected', $4)`,
			[
				issueId,
				req.session.userId,
				issue.status,
				`درخواست توسط مدیر رد شد. دلیل: ${reason.trim()}`,
			],
		);
		// Notify the student when the issue is rejected
		await createNotification(client, {
			userId: issue.student_id,
			issueId: issue.id,
			title: "درخواست شما رد شد",
			message: `درخواست «${issue.title}» رد شد. برای مشاهده دلیل، جزئیات درخواست را بررسی کنید.`,
			type: "issue_rejected",
		});
		await client.query("COMMIT");

		return res.status(200).json({
			message: "درخواست با موفقیت رد شد.",
		});
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		console.error("Reject issue error:", error);

		return res.status(500).json({
			message: "خطا در رد درخواست.",
		});
	} finally {
		client.release();
	}
});
// Update issue status by assigned expert
router.patch("/:id/status", async (req, res) => {
	const issueId = Number(req.params.id);
	const { status } = req.body;

	if (!Number.isSafeInteger(issueId) || issueId <= 0) {
		return res.status(400).json({
			message: "شناسه درخواست معتبر نیست.",
		});
	}

	if (!["in_progress", "resolved"].includes(status)) {
		return res.status(400).json({
			message: "وضعیت انتخاب‌شده معتبر نیست.",
		});
	}

	if (!req.session.userId) {
		return res.status(401).json({
			message: "ابتدا وارد حساب کاربری شوید.",
		});
	}

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const expertResult = await client.query(
			`SELECT id
			 FROM users
			 WHERE id = $1
			   AND role = 'expert'
			   AND is_active = TRUE`,
			[req.session.userId],
		);

		if (expertResult.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(403).json({
				message: "فقط کارشناس مجاز به تغییر وضعیت است.",
			});
		}

		const issueResult = await client.query(
			`SELECT i.id, i.status, i.student_id, i.title
 FROM issues i
 INNER JOIN assignments a ON a.issue_id = i.id
 WHERE i.id = $1
   AND a.expert_id = $2
   AND a.is_current = TRUE
 FOR UPDATE OF i`,
			[issueId, req.session.userId],
		);

		if (issueResult.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(404).json({
				message: "درخواست پیدا نشد یا به شما ارجاع نشده است.",
			});
		}

		const issue = issueResult.rows[0];

		const allowedTransitions = {
			assigned: "in_progress",
			in_progress: "resolved",
		};

		if (allowedTransitions[issue.status] !== status) {
			await client.query("ROLLBACK");
			return res.status(400).json({
				message: "تغییر وضعیت از این مرحله امکان‌پذیر نیست.",
			});
		}

		const updatedIssue = await client.query(
			`UPDATE issues
	 SET status = $1,
	     updated_at = NOW(),
	     resolved_at = CASE
	       WHEN $1::varchar = 'resolved' THEN NOW()
	       ELSE NULL
	     END
	 WHERE id = $2
	 RETURNING id, status, updated_at, resolved_at`,
			[status, issueId],
		);

		await client.query(
			`INSERT INTO issue_history
			 (issue_id, changed_by, old_status, new_status, description)
			 VALUES ($1, $2, $3, $4, $5)`,
			[
				issueId,
				req.session.userId,
				issue.status,
				status,
				status === "resolved"
					? "درخواست توسط کارشناس حل‌شده اعلام شد."
					: "کارشناس رسیدگی به درخواست را آغاز کرد.",
			],
		);
		// Notify the student when handling starts
		if (status === "in_progress") {
			await createNotification(client, {
				userId: issue.student_id,
				issueId: issue.id,
				title: "رسیدگی به درخواست شما آغاز شد",
				message: `کارشناس رسیدگی به درخواست «${issue.title}» را آغاز کرده است.`,
				type: "issue_in_progress",
			});
		}
		// Notify the student when the issue is resolved
		if (status === "resolved") {
			await createNotification(client, {
				userId: issue.student_id,
				issueId: issue.id,
				title: "درخواست شما حل شد",
				message: `درخواست «${issue.title}» توسط کارشناس حل‌شده اعلام شد.`,
				type: "issue_resolved",
			});

			// Notify all active managers
			await notifyActiveManagers(client, {
				issueId: issue.id,
				title: "درخواست حل شد",
				message: `درخواست «${issue.title}» توسط کارشناس حل‌شده اعلام شد.`,
				type: "issue_resolved",
			});
		}
		await client.query("COMMIT");

		return res.json({
			message: "وضعیت درخواست با موفقیت تغییر کرد.",
			issue: updatedIssue.rows[0],
		});
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		console.error("Update issue status error:", error);

		return res.status(500).json({
			message: "خطا در تغییر وضعیت درخواست.",
		});
	} finally {
		client.release();
	}
});
// Get reports and statistics for manager
router.get("/reports", async (req, res) => {
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
				message: "دسترسی غیرمجاز است.",
			});
		}

		const [
			summaryResult,
			statusResult,
			departmentResult,
			expertResult,
			trendResult,
		] = await Promise.all([
			// General statistics
			pool.query(`
				SELECT
					COUNT(*) AS total,
					COUNT(*) FILTER (
						WHERE status = 'submitted'
					) AS submitted,
					
					COUNT(*) FILTER (
						WHERE status = 'assigned'
					) AS assigned,
					COUNT(*) FILTER (
						WHERE status = 'in_progress'
					) AS in_progress,
					COUNT(*) FILTER (
						WHERE status = 'resolved'
					) AS resolved,
					COUNT(*) FILTER (
						WHERE status = 'rejected'
					) AS rejected,
					ROUND(
						(
							AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)))
							FILTER (WHERE status = 'resolved' AND resolved_at IS NOT NULL)
						) / 3600
					, 1) AS avg_resolution_hours
				FROM issues
			`),

			// Issues by status
			pool.query(`
				SELECT status, COUNT(*) AS count
FROM issues
WHERE status IN (
    'submitted',
    'assigned',
    'in_progress',
    'resolved',
    'rejected'
)
GROUP BY status
ORDER BY status
			`),

			// Issues by assigned department
			pool.query(`
				SELECT
					d.id,
					d.name AS department_name,
					COUNT(DISTINCT a.issue_id) AS total
				FROM departments d
				LEFT JOIN assignments a
					ON a.department_id = d.id
					AND a.is_current = TRUE
				GROUP BY d.id, d.name
				ORDER BY total DESC
			`),

			// Expert performance
			pool.query(`
				SELECT
					u.id,
					u.full_name AS expert_name,
					COUNT(a.issue_id) AS total_assigned,
					COUNT(a.issue_id) FILTER (
						WHERE i.status = 'resolved'
					) AS resolved,
					COUNT(a.issue_id) FILTER (
						WHERE i.status = 'in_progress'
					) AS in_progress
				FROM users u
				LEFT JOIN assignments a
					ON a.expert_id = u.id
					AND a.is_current = TRUE
				LEFT JOIN issues i ON i.id = a.issue_id
				WHERE u.role = 'expert'
					AND u.is_active = TRUE
				GROUP BY u.id, u.full_name
				ORDER BY resolved DESC, total_assigned DESC
			`),

			// Monthly issue creation trend (last 6 months)
			pool.query(`
				SELECT
					TO_CHAR(
						DATE_TRUNC('month', created_at),
						'YYYY-MM'
					) AS month,
					COUNT(*) AS total
				FROM issues
				WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
				GROUP BY DATE_TRUNC('month', created_at)
				ORDER BY DATE_TRUNC('month', created_at)
			`),
		]);

		return res.json({
			summary: summaryResult.rows[0],
			statuses: statusResult.rows,
			departments: departmentResult.rows,
			experts: expertResult.rows,
			monthlyTrend: trendResult.rows,
		});
	} catch (error) {
		console.error("Get reports error:", error);

		return res.status(500).json({
			message: "دریافت گزارش‌ها با خطا مواجه شد.",
		});
	}
});
// Get details of a specific student issue
router.get("/:id", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		const issueId = Number(req.params.id);

		if (!Number.isSafeInteger(issueId) || issueId <= 0) {
			return res.status(400).json({
				message: "شناسه درخواست معتبر نیست.",
			});
		}

		// Get issue details (only the owner's issue)
		const issueResult = await pool.query(
			`SELECT
                i.id,
                i.tracking_code,
                i.title,
                i.description,
                i.category,
                i.location,
                i.severity,
                i.affected_count,
                i.priority_score,
				i.impact,
i.final_priority,
                i.status,
                i.created_at,
                i.updated_at,
                i.resolved_at
             FROM issues i
             WHERE i.id = $1
AND (
    i.student_id = $2

    OR EXISTS (
        SELECT 1
        FROM users viewer
        WHERE viewer.id = $2
          AND viewer.role = 'manager'
          AND viewer.is_active = TRUE
    )

    OR EXISTS (
        SELECT 1
        FROM assignments a
        JOIN users viewer ON viewer.id = a.expert_id
        WHERE a.issue_id = i.id
          AND a.expert_id = $2
          AND a.is_current = TRUE
          AND viewer.role = 'expert'
          AND viewer.is_active = TRUE
    )
)`,
			[issueId, req.session.userId],
		);

		if (issueResult.rows.length === 0) {
			return res.status(404).json({
				message: "درخواست موردنظر پیدا نشد.",
			});
		}

		// Get issue history
		const historyResult = await pool.query(
			`SELECT
                h.id,
                h.old_status,
                h.new_status,
                h.description,
                h.created_at,
                u.full_name AS changed_by_name
             FROM issue_history h
             LEFT JOIN users u ON u.id = h.changed_by
             WHERE h.issue_id = $1
             ORDER BY h.created_at ASC`,
			[issueId],
		);

		// Get issue attachments
		const attachmentsResult = await pool.query(
			`SELECT
                id,
                original_name,
                mime_type,
                file_size,
                created_at
             FROM issue_attachments
             WHERE issue_id = $1
             ORDER BY created_at ASC`,
			[issueId],
		);

		return res.status(200).json({
			issue: issueResult.rows[0],
			history: historyResult.rows,
			attachments: attachmentsResult.rows,
		});
	} catch (error) {
		console.error("Get issue details error:", error);

		return res.status(500).json({
			message: "دریافت جزئیات درخواست با خطا مواجه شد.",
		});
	}
});

// View or download an issue attachment
router.get("/:issueId/attachments/:attachmentId", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				message: "ابتدا وارد حساب کاربری شوید.",
			});
		}

		const issueId = Number(req.params.issueId);
		const attachmentId = Number(req.params.attachmentId);

		if (
			!Number.isSafeInteger(issueId) ||
			issueId <= 0 ||
			!Number.isSafeInteger(attachmentId) ||
			attachmentId <= 0
		) {
			return res.status(400).json({
				message: "شناسه فایل یا درخواست معتبر نیست.",
			});
		}

		const result = await pool.query(
			`SELECT
                a.original_name,
                a.file_path,
                a.mime_type
             FROM issue_attachments a
             INNER JOIN issues i ON i.id = a.issue_id
             WHERE a.id = $1
               AND i.id = $2
               AND (
    i.student_id = $3

    OR EXISTS (
        SELECT 1
        FROM users viewer
        WHERE viewer.id = $3
          AND viewer.role = 'manager'
          AND viewer.is_active = TRUE
    )

    OR EXISTS (
        SELECT 1
        FROM assignments assigned
        JOIN users viewer ON viewer.id = assigned.expert_id
        WHERE assigned.issue_id = i.id
          AND assigned.expert_id = $3
          AND assigned.is_current = TRUE
          AND viewer.role = 'expert'
          AND viewer.is_active = TRUE
    )
)`,
			[attachmentId, issueId, req.session.userId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message: "فایل موردنظر پیدا نشد.",
			});
		}

		const attachment = result.rows[0];
		const filePath = path.resolve(__dirname, "..", attachment.file_path);
		const uploadRoot = path.resolve(uploadDirectory);

		if (!filePath.startsWith(uploadRoot + path.sep)) {
			return res.status(403).json({
				message: "دسترسی به این فایل مجاز نیست.",
			});
		}

		if (!fs.existsSync(filePath)) {
			return res.status(404).json({
				message: "فایل روی سرور پیدا نشد.",
			});
		}

		const download = req.query.download === "1";

		res.setHeader(
			"Content-Type",
			attachment.mime_type || "application/octet-stream",
		);
		res.setHeader("Cache-Control", "private, no-store");
		res.setHeader("X-Content-Type-Options", "nosniff");

		if (download) {
			return res.download(filePath, path.basename(attachment.original_name));
		}

		return res.sendFile(filePath);
	} catch (error) {
		console.error("Get attachment error:", error);

		return res.status(500).json({
			message: "دریافت فایل با خطا مواجه شد.",
		});
	}
});

// Create a new issue
router.post("/", uploadFiles, async (req, res) => {
	const uploadedFiles = req.files || [];
	let client;

	try {
		// Validate student role
		const userResult = await pool.query(
			"SELECT id, role, is_active FROM users WHERE id = $1",
			[req.session.userId],
		);

		const user = userResult.rows[0];

		if (!user || !user.is_active || user.role !== "student") {
			uploadedFiles.forEach((file) => fs.unlinkSync(file.path));

			return res.status(403).json({
				message: "فقط دانشجویان مجاز به ثبت درخواست هستند.",
			});
		}

		// Read form data
		const { title, category, location, impact, description } = req.body;

		// Validate required fields
		if (
			typeof title !== "string" ||
			typeof category !== "string" ||
			typeof location !== "string" ||
			typeof impact !== "string" ||
			typeof description !== "string" ||
			!title.trim() ||
			!category.trim() ||
			!location.trim() ||
			!impact.trim() ||
			!description.trim()
		) {
			uploadedFiles.forEach((file) => fs.unlinkSync(file.path));

			return res.status(400).json({
				message: "تمام فیلدهای فرم الزامی هستند.",
			});
		}

		// Validate field lengths
		if (
			title.trim().length > 150 ||
			location.trim().length > 200 ||
			description.trim().length > 3000
		) {
			uploadedFiles.forEach((file) => fs.unlinkSync(file.path));

			return res.status(400).json({
				message: "طول یکی از فیلدهای فرم بیش از حد مجاز است.",
			});
		}

		// Validate category
		if (!allowedCategories.includes(category)) {
			uploadedFiles.forEach((file) => fs.unlinkSync(file.path));

			return res.status(400).json({
				message: "دسته‌بندی انتخاب‌شده معتبر نیست.",
			});
		}
		// Validate impact
		if (!["low", "medium", "high"].includes(impact)) {
			uploadedFiles.forEach((file) => fs.unlinkSync(file.path));

			return res.status(400).json({
				message: "میزان تأثیر انتخاب‌شده معتبر نیست.",
			});
		}
		// Generate tracking code
		const trackingCode = `ISS-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

		// Start database transaction
		client = await pool.connect();

		await client.query("BEGIN");
		// Calculate initial priority score
		const priorityScores = {
			low: 1,
			medium: 3,
			high: 5,
		};

		const priorityScore = priorityScores[impact];
		// Insert issue
		// Insert issue
		const issueResult = await client.query(
			`INSERT INTO issues
        (tracking_code, student_id, title, description, category, location, impact, priority_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, tracking_code, status, created_at`,
			[
				trackingCode,
				user.id,
				title.trim(),
				description.trim(),
				category,
				location.trim(),
				impact,
				priorityScore,
			],
		);

		const issue = issueResult.rows[0];

		// Insert initial history

		// Insert attachment information
		for (const file of uploadedFiles) {
			await client.query(
				`INSERT INTO issue_attachments
                    (issue_id, original_name, stored_name, file_path, mime_type, file_size)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
				[
					issue.id,
					file.originalname,
					file.filename,
					path.posix.join("uploads", "issues", file.filename),
					file.detectedMimeType,
					file.size,
				],
			);
		}
		// Notify the student
		await createNotification(client, {
			userId: user.id,
			issueId: issue.id,
			title: "درخواست شما ثبت شد",
			message: `درخواست «${title.trim()}» با موفقیت ثبت شد.`,
			type: "issue_created",
		});

		// Notify all active managers
		await notifyActiveManagers(client, {
			issueId: issue.id,
			title: "درخواست جدید",
			message: `درخواست جدید «${title.trim()}» ثبت شده و منتظر ارجاع است.`,
			type: "new_issue",
		});
		await client.query("COMMIT");

		return res.status(201).json({
			message: "درخواست با موفقیت ثبت شد.",
			issue,
		});
	} catch (error) {
		if (client) {
			await client.query("ROLLBACK").catch(() => {});
		}

		// Delete uploaded files if registration fails
		uploadedFiles.forEach((file) => {
			if (fs.existsSync(file.path)) {
				fs.unlinkSync(file.path);
			}
		});

		console.error("Create issue error:", error);

		return res.status(500).json({
			message: "هنگام ثبت درخواست خطایی رخ داد.",
		});
	} finally {
		if (client) {
			client.release();
		}
	}
});

module.exports = router;

const express = require("express");
const pool = require("../config/db");
const { createNotification } = require("../utils/notifications");
const router = express.Router();

// Check whether the logged-in user can access the issue
async function checkIssueAccess(issueId, userId) {
	const result = await pool.query(
		`SELECT
            u.role,
            u.is_active,
            i.student_id,
            EXISTS (
                SELECT 1
                FROM assignments a
                WHERE a.issue_id = i.id
                  AND a.expert_id = u.id
                  AND a.is_current = true
            ) AS is_assigned
         FROM users u
         INNER JOIN issues i ON i.id = $2
         WHERE u.id = $1`,
		[userId, issueId],
	);

	if (result.rows.length === 0) {
		return false;
	}

	const user = result.rows[0];

	if (!user.is_active) {
		return false;
	}

	if (user.role === "manager") {
		return true;
	}

	if (user.role === "student") {
		return String(user.student_id) === String(userId);
	}

	if (user.role === "expert") {
		return user.is_assigned;
	}

	return false;
}

// Get messages of an issue
router.get("/:id/messages", async (req, res) => {
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

		const hasAccess = await checkIssueAccess(issueId, req.session.userId);

		if (!hasAccess) {
			return res.status(403).json({
				message: "شما اجازه مشاهده گفتگوی این درخواست را ندارید.",
			});
		}

		const result = await pool.query(
			`SELECT
    m.id,
    m.issue_id,
    m.sender_id,
    m.message,
    m.created_at,
    u.full_name AS sender_name,
    u.role AS sender_role,
    d.name AS sender_department
FROM issue_messages m
INNER JOIN users u ON u.id = m.sender_id
LEFT JOIN department_members dm ON dm.user_id = u.id
LEFT JOIN departments d ON d.id = dm.department_id
WHERE m.issue_id = $1
ORDER BY m.created_at ASC, m.id ASC`,
			[issueId],
		);

		return res.status(200).json({
			messages: result.rows,
		});
	} catch (error) {
		console.error("Get issue messages error:", error);

		return res.status(500).json({
			message: "دریافت پیام‌ها با خطا مواجه شد.",
		});
	}
});

// Send a new message
router.post("/:id/messages", async (req, res) => {
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

		const message =
			typeof req.body.message === "string" ? req.body.message.trim() : "";

		if (!message) {
			return res.status(400).json({
				message: "متن پیام نمی‌تواند خالی باشد.",
			});
		}

		if (message.length > 3000) {
			return res.status(400).json({
				message: "متن پیام نباید بیشتر از ۳۰۰۰ کاراکتر باشد.",
			});
		}

		const hasAccess = await checkIssueAccess(issueId, req.session.userId);

		if (!hasAccess) {
			return res.status(403).json({
				message: "شما اجازه ارسال پیام در این درخواست را ندارید.",
			});
		}

		const issueInfo = await pool.query(
			`SELECT
        i.id,
        i.title,
        i.student_id,
        a.expert_id
     FROM issues i
     LEFT JOIN assignments a
        ON a.issue_id = i.id
       AND a.is_current = TRUE
     WHERE i.id = $1`,
			[issueId],
		);

		const senderResult = await pool.query(
			`SELECT role
     FROM users
     WHERE id = $1`,
			[req.session.userId],
		);

		const senderRole = senderResult.rows[0].role;
		const result = await pool.query(
			`INSERT INTO issue_messages
                (issue_id, sender_id, message)
             VALUES ($1, $2, $3)
             RETURNING id, issue_id, sender_id, message, created_at`,
			[issueId, req.session.userId, message],
		);

		const messageResult = await pool.query(
			`SELECT
    m.id,
    m.issue_id,
    m.sender_id,
    m.message,
    m.created_at,
    u.full_name AS sender_name,
    u.role AS sender_role,
    d.name AS sender_department
FROM issue_messages m
INNER JOIN users u ON u.id = m.sender_id
LEFT JOIN department_members dm ON dm.user_id = u.id
LEFT JOIN departments d ON d.id = dm.department_id
WHERE m.id = $1`,
			[result.rows[0].id],
		);

		try {
			const issue = issueInfo.rows[0];

			const notification = {
				issueId,
				title: "پیام جدید در گفت‌وگو",
				message: `پیام جدیدی درباره درخواست «${issue.title}» برای شما ارسال شده است.`,
				type: "new_message",
			};

			// Student sends a message → notify the current expert
			if (senderRole === "student" && issue.expert_id) {
				await createNotification(pool, {
					...notification,
					userId: issue.expert_id,
				});
			}

			// Expert sends a message → notify the student
			if (senderRole === "expert") {
				await createNotification(pool, {
					...notification,
					userId: issue.student_id,
				});
			}

			// Manager sends a message → notify the student and current expert
			if (senderRole === "manager") {
				await createNotification(pool, {
					...notification,
					userId: issue.student_id,
				});

				if (issue.expert_id) {
					await createNotification(pool, {
						...notification,
						userId: issue.expert_id,
					});
				}
			}
		} catch (notificationError) {
			console.error("Create message notification error:", notificationError);
		}
		return res.status(201).json({
			message: "پیام با موفقیت ارسال شد.",
			data: messageResult.rows[0],
		});
	} catch (error) {
		console.error("Send issue message error:", error);

		return res.status(500).json({
			message: "ارسال پیام با خطا مواجه شد.",
		});
	}
});

module.exports = router;

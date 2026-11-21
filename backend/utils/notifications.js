
async function createNotification(db, {
    userId,
    issueId,
    title,
    message,
    type,
}) {
    await db.query(
        `INSERT INTO notifications
            (user_id, issue_id, title, message, type)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, issueId, title, message, type]
    );
}

async function notifyActiveManagers(db, notification) {
    const result = await db.query(
        `SELECT id
         FROM users
         WHERE role = 'manager'
           AND is_active = TRUE`
    );

    for (const manager of result.rows) {
        await createNotification(db, {
            ...notification,
            userId: manager.id,
        });
    }
}

module.exports = {
    createNotification,
    notifyActiveManagers,
};

const readline = require("readline");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
require("dotenv").config();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

async function createAdmin() {
	try {
		const existingUser = await pool.query(
			"SELECT id FROM users WHERE email = $1",
			["admin@gmail.com"],
		);

		if (existingUser.rows.length > 0) {
			console.log("این ایمیل قبلاً ثبت شده است.");
			return;
		}

		rl.question("Enter admin password: ", async (password) => {
			try {
				if (password.length < 8) {
					console.log("رمز عبور باید حداقل ۸ کاراکتر باشد.");
					return;
				}

				const passwordHash = await bcrypt.hash(password, 12);

				await pool.query(
					`INSERT INTO users (full_name, email, password_hash, role)
					 VALUES ($1, $2, $3, $4)`,
					["admin", "admin@gmail.com", passwordHash, "manager"],
				);

				console.log("Admin account created successfully.");
			} catch (error) {
				console.error("Error:", error.message);
			} finally {
				rl.close();
				await pool.end();
			}
		});
	} catch (error) {
		console.error("Error:", error.message);
		rl.close();
		await pool.end();
	}
}

createAdmin();
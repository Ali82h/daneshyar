
import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API_BASE_URL from "../config";
import "./Settings.css";
import { Eye, EyeOff } from "lucide-react";

function Settings({ user, onLogout }) {
	const [activeTab, setActiveTab] = useState("profile");
	const [fullName, setFullName] = useState(user?.full_name || "");
	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [profileMessage, setProfileMessage] = useState("");
	const [profileError, setProfileError] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordMessage, setPasswordMessage] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [changingPassword, setChangingPassword] = useState(false);
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handlePasswordChange = async (e) => {
		e.preventDefault();

		setPasswordMessage("");
		setPasswordError("");

		if (!currentPassword || !newPassword || !confirmPassword) {
			setPasswordError("تمام فیلدها را تکمیل کنید.");
			return;
		}

		if (newPassword.length < 8) {
			setPasswordError("رمز جدید باید حداقل ۸ کاراکتر باشد.");
			return;
		}

		if (newPassword !== confirmPassword) {
			setPasswordError("رمز جدید و تکرار آن یکسان نیستند.");
			return;
		}

		if (currentPassword === newPassword) {
			setPasswordError("رمز جدید باید با رمز فعلی متفاوت باشد.");
			return;
		}

		try {
			setChangingPassword(true);

			const response = await fetch(
				`${API_BASE_URL}/api/auth/change-password`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({
						currentPassword,
						newPassword,
					}),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "تغییر رمز عبور ناموفق بود.");
			}

			setPasswordMessage(data.message);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error) {
			setPasswordError(error.message);
		} finally {
			setChangingPassword(false);
		}
	};

	const handleProfileSave = async (e) => {
		e.preventDefault();

		setProfileMessage("");
		setProfileError("");

		if (!fullName.trim()) {
			setProfileError("نام و نام خانوادگی را وارد کنید.");
			return;
		}

		try {
			setSaving(true);

			const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					fullName: fullName.trim(),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "ویرایش اطلاعات ناموفق بود.");
			}

			setFullName(data.user.full_name);
			setIsEditing(false);
			setProfileMessage(data.message);
		} catch (error) {
			setProfileError(error.message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="settings">
			<div className="settings-page">
				<div className="settings-heading">
					<h1>تنظیمات حساب کاربری</h1>
					<p>اطلاعات حساب و تنظیمات امنیتی خود را مدیریت کنید.</p>
				</div>

				<div className="settings-tabs">
					<button
						className={activeTab === "profile" ? "active" : ""}
						onClick={() => setActiveTab("profile")}
					>
						اطلاعات حساب کاربری
					</button>

					<button
						className={activeTab === "security" ? "active" : ""}
						onClick={() => setActiveTab("security")}
					>
						امنیت حساب
					</button>
				</div>

				<div className="settings-content">
					{activeTab === "profile" && (
						<div className="settings-section">
							<h2>اطلاعات حساب کاربری</h2>

							{isEditing ? (
								<form onSubmit={handleProfileSave}>
									<div className="settings-edit-field">
										<label>نام و نام خانوادگی</label>
										<input
											type="text"
											value={fullName}
											onChange={(e) => setFullName(e.target.value)}
											maxLength={150}
											placeholder="نام و نام خانوادگی"
										/>
									</div>

									{profileError && (
										<p className="settings-error">{profileError}</p>
									)}

									<div className="settings-form-actions">
										<button type="submit" disabled={saving}>
											{saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
										</button>

										<button
											type="button"
											onClick={() => {
												setFullName(user?.full_name || "");
												setIsEditing(false);
												setProfileError("");
												setProfileMessage("");
											}}
										>
											انصراف
										</button>
									</div>
								</form>
							) : (
								<>
									<div className="settings-profile-info">
										<div>
											<span>نام و نام خانوادگی</span>
											<strong>{fullName || "—"}</strong>
										</div>

										<div>
											<span>آدرس ایمیل</span>
											<strong>{user?.email || "—"}</strong>
										</div>

										<div>
											<span>نقش کاربری</span>
											<strong>
												{{
													student: "دانشجو",
													manager: "مدیر",
													expert: "کارشناس",
												}[user?.role] || "—"}
											</strong>
										</div>
									</div>

									<button
										type="button"
										className="settings-edit-button"
										onClick={() => {
											setIsEditing(true);
											setProfileMessage("");
											setProfileError("");
										}}
									>
										ویرایش نام
									</button>
								</>
							)}

							{profileMessage && (
								<p className="settings-success">{profileMessage}</p>
							)}
						</div>
					)}

					{activeTab === "security" && (
						<div className="settings-section">
							<h2>تغییر رمز عبور</h2>
							<p>برای حفظ امنیت حساب، رمز عبور فعلی و رمز جدید را وارد کنید.</p>

							<form
								className="settings-password-form"
								onSubmit={handlePasswordChange}
							>
								<div className="settings-edit-field">
									<label>رمز عبور فعلی</label>

									<div className="settings-password-input">
										<input
											type={showCurrentPassword ? "text" : "password"}
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
											placeholder="رمز عبور فعلی"
											autoComplete="current-password"
										/>

										<button
											type="button"
											onClick={() =>
												setShowCurrentPassword(!showCurrentPassword)
											}
											aria-label="نمایش یا مخفی کردن رمز عبور"
										>
											{showCurrentPassword ? (
												<EyeOff size={18} />
											) : (
												<Eye size={18} />
											)}
										</button>
									</div>
								</div>

								<div className="settings-edit-field">
									<label>رمز عبور جدید</label>

									<div className="settings-password-input">
										<input
											type={showNewPassword ? "text" : "password"}
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											placeholder="حداقل ۸ کاراکتر"
											autoComplete="new-password"
										/>

										<button
											type="button"
											onClick={() => setShowNewPassword(!showNewPassword)}
											aria-label="نمایش یا مخفی کردن رمز عبور"
										>
											{showNewPassword ? (
												<EyeOff size={18} />
											) : (
												<Eye size={18} />
											)}
										</button>
									</div>
								</div>

								<div className="settings-edit-field">
									<label>تکرار رمز عبور جدید</label>

									<div className="settings-password-input">
										<input
											type={showConfirmPassword ? "text" : "password"}
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											placeholder="رمز عبور جدید را تکرار کنید"
											autoComplete="new-password"
										/>

										<button
											type="button"
											onClick={() =>
												setShowConfirmPassword(!showConfirmPassword)
											}
											aria-label="نمایش یا مخفی کردن رمز عبور"
										>
											{showConfirmPassword ? (
												<EyeOff size={18} />
											) : (
												<Eye size={18} />
											)}
										</button>
									</div>
								</div>

								{passwordError && (
									<p className="settings-error">{passwordError}</p>
								)}

								{passwordMessage && (
									<p className="settings-success">{passwordMessage}</p>
								)}

								<button type="submit" disabled={changingPassword}>
									{changingPassword ? "در حال تغییر..." : "تغییر رمز عبور"}
								</button>
							</form>
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}

export default Settings;

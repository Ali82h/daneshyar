
import { useEffect, useState } from "react";
import {
	Megaphone,
	RefreshCw,
	Plus,
	Search,
	X,
	Edit,
	Trash2,
} from "lucide-react";

import DashboardLayout from "../components/layout/DashboardLayout";
import "./ManagerReports.css";
import "./Announcements.css";
import API_BASE_URL from "../config";

function Announcements({ user, onLogout }) {
	const [announcements, setAnnouncements] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editingAnnouncement, setEditingAnnouncement] = useState(null);
	const [saving, setSaving] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	const [formData, setFormData] = useState({
		title: "",
		content: "",
		type: "general",
		status: "draft",
	});
	const isManager = user.role === "manager";

	const fetchAnnouncements = async () => {
		try {
			setLoading(true);

			const response = await fetch(`${API_BASE_URL}/api/announcements`, {
				credentials: "include",
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "خطا در دریافت اطلاعیه‌ها");
			}

			setAnnouncements(data.announcements || []);
		} catch (error) {
			console.error(error);
			alert(error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async (e) => {
		e.preventDefault();

		try {
			setSaving(true);

			const isEditing = Boolean(editingAnnouncement);

			const response = await fetch(
				isEditing
					? `${API_BASE_URL}/api/announcements/${editingAnnouncement.id}`
					: `${API_BASE_URL}/api/announcements`,
				{
					method: isEditing ? "PUT" : "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formData),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "خطا در ذخیره اطلاعیه");
			}

			setShowModal(false);
			setEditingAnnouncement(null);
			setFormData({
				title: "",
				content: "",
				type: "general",
				status: "draft",
			});

			await fetchAnnouncements();
		} catch (error) {
			console.error(error);
			alert(error.message);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id) => {
		const confirmed = window.confirm("آیا از حذف این اطلاعیه مطمئن هستید؟");

		if (!confirmed) return;

		try {
			const response = await fetch(
				`${API_BASE_URL}/api/announcements/${id}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "خطا در حذف اطلاعیه");
			}

			await fetchAnnouncements();
		} catch (error) {
			console.error(error);
			alert(error.message);
		}
	};

	const handleCreate = () => {
		setEditingAnnouncement(null);

		setFormData({
			title: "",
			content: "",
			type: "general",
			status: "draft",
		});

		setShowModal(true);
	};

	const handleEdit = (announcement) => {
		setEditingAnnouncement(announcement);

		setFormData({
			title: announcement.title,
			content: announcement.content,
			type: announcement.type,
			status: announcement.status,
		});

		setShowModal(true);
	};

	const filteredAnnouncements = announcements.filter((announcement) => {
		const search = searchTerm.trim().toLowerCase();

		return (
			announcement.title.toLowerCase().includes(search) ||
			announcement.content.toLowerCase().includes(search)
		);
	});

	const totalCount = announcements.length;

	const publishedCount = announcements.filter(
		(item) => item.status === "published",
	).length;

	const draftCount = announcements.filter(
		(item) => item.status === "draft",
	).length;

	useEffect(() => {
		fetchAnnouncements();
	}, []);

	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="announcements">
			<div className="manager-reports-page">
				<div className="reports-header">
					<div>
						<span>
							{isManager
								? "پنل مدیریت"
								: user.role === "expert"
									? "پنل کارشناس"
									: "پنل دانشجو"}
						</span>

						<h1>اطلاعیه‌ها</h1>

						<p>
							{isManager
								? "مدیریت و انتشار اطلاعیه‌های دانشگاه"
								: "مشاهده آخرین اطلاعیه‌ها و اخبار دانشگاه"}
						</p>
					</div>
					{isManager && (
						<div className="reports-header-actions">
							<button
								type="button"
								className="reports-refresh-button"
								onClick={fetchAnnouncements}
								disabled={loading}
							>
								<RefreshCw size={17} />
								بروزرسانی
							</button>

							<button
								type="button"
								className="reports-primary-button"
								onClick={handleCreate}
							>
								<Plus size={17} />
								ایجاد اطلاعیه
							</button>
						</div>
					)}
				</div>
				{isManager && (
					<div className="reports-overview">
						<div className="reports-stat-card">
							<div className="reports-stat-icon">
								<Megaphone size={22} />
							</div>
							<div>
								<span>کل اطلاعیه‌ها</span>
								<strong>{totalCount}</strong>
							</div>
						</div>

						<div className="reports-stat-card">
							<div className="reports-stat-icon">
								<Edit size={22} />
							</div>
							<div>
								<span>منتشرشده</span>
								<strong>{publishedCount}</strong>
							</div>
						</div>

						<div className="reports-stat-card">
							<div className="reports-stat-icon">
								<Search size={22} />
							</div>
							<div>
								<span>پیش‌نویس</span>
								<strong>{draftCount}</strong>
							</div>
						</div>
					</div>
				)}
				{isManager && (
					<div className="users-search">
						<Search size={19} />

						<input
							type="text"
							placeholder="جست‌وجو در عنوان و متن اطلاعیه‌ها..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				)}
				<div className="announcements-list">
					{loading ? (
						<p className="announcements-empty">در حال دریافت اطلاعیه‌ها...</p>
					) : filteredAnnouncements.length === 0 ? (
						<p className="announcements-empty">
							اطلاعیه‌ای برای نمایش وجود ندارد.
						</p>
					) : (
						filteredAnnouncements.map((announcement) => (
							<div
								className={`announcement-card ${announcement.type}`}
								key={announcement.id}
							>
								<div className="announcement-card-content">
									<h3>{announcement.title}</h3>
									<div className="announcement-meta">
										<span className={`announcement-type ${announcement.type}`}>
											{announcement.type === "important"
												? "مهم"
												: announcement.type === "warning"
													? "هشدار"
													: "عمومی"}
										</span>

										{isManager && (
											<span
												className={`announcement-status ${announcement.status}`}
											>
												{announcement.status === "published"
													? "منتشرشده"
													: "پیش‌نویس"}
											</span>
										)}

										<div className="announcement-datetime">
											<span className="announcement-date">
												{new Date(announcement.created_at).toLocaleDateString(
													"fa-IR",
												)}
											</span>

											<span className="announcement-time">
												{new Date(announcement.created_at).toLocaleTimeString(
													"fa-IR",
													{
														hour: "2-digit",
														minute: "2-digit",
													},
												)}
											</span>
										</div>
									</div>
									<p>{announcement.content}</p>
								</div>

								{isManager && (
									<div className="announcement-card-actions">
										<button
											type="button"
											onClick={() => handleEdit(announcement)}
											title="ویرایش"
										>
											<Edit size={17} />
										</button>

										<button
											type="button"
											onClick={() => handleDelete(announcement.id)}
											title="حذف"
										>
											<Trash2 size={17} />
										</button>
									</div>
								)}
							</div>
						))
					)}
				</div>
				{isManager && showModal && (
					<div className="department-modal-overlay">
						<div className="department-modal">
							<div className="department-modal-header">
								<h2>
									{editingAnnouncement
										? "ویرایش اطلاعیه"
										: "ایجاد اطلاعیه جدید"}
								</h2>

								<button type="button" onClick={() => setShowModal(false)}>
									<X size={20} />
								</button>
							</div>

							<form onSubmit={handleSave}>
								<div className="department-form-group">
									<label>عنوان اطلاعیه</label>
									<input
										type="text"
										maxLength={150}
										required
										value={formData.title}
										onChange={(e) =>
											setFormData({ ...formData, title: e.target.value })
										}
									/>
								</div>

								<div className="department-form-group">
									<label>متن اطلاعیه</label>
									<textarea
										rows={5}
										maxLength={5000}
										required
										value={formData.content}
										onChange={(e) =>
											setFormData({ ...formData, content: e.target.value })
										}
									/>
								</div>

								<div className="department-form-group">
									<label>نوع اطلاعیه</label>
									<select
										value={formData.type}
										onChange={(e) =>
											setFormData({ ...formData, type: e.target.value })
										}
									>
										<option value="general">عمومی</option>
										<option value="important">مهم</option>
										<option value="warning">هشدار</option>
									</select>
								</div>

								<div className="department-form-group">
									<label>وضعیت انتشار</label>
									<select
										value={formData.status}
										onChange={(e) =>
											setFormData({ ...formData, status: e.target.value })
										}
									>
										<option value="draft">پیش‌نویس</option>
										<option value="published">منتشرشده</option>
									</select>
								</div>

								<div className="department-modal-actions">
									<button type="button" onClick={() => setShowModal(false)}>
										انصراف
									</button>

									<button type="submit" disabled={saving}>
										{saving ? "در حال ذخیره..." : "ذخیره اطلاعیه"}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}

export default Announcements;

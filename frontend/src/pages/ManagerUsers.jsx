
import { useEffect, useState } from "react";
import {
	Users,
	UserRound,
	GraduationCap,
	BriefcaseBusiness,
	Search,
	RefreshCw,
	Plus,
	X,
} from "lucide-react";

import DashboardLayout from "../components/layout/DashboardLayout";
import API_BASE_URL from "../config";
import "./ManagerReports.css";

function ManagerUsers({ user, onLogout }) {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showExpertModal, setShowExpertModal] = useState(false);
	const [departments, setDepartments] = useState([]);
	const [savingExpert, setSavingExpert] = useState(false);

	const [expertForm, setExpertForm] = useState({
		fullName: "",
		email: "",
		password: "",
		departmentId: "",
	});

	const fetchUsers = async () => {
		try {
			setLoading(true);
			setError("");

			const response = await fetch(`${API_BASE_URL}/api/users`, {
				credentials: "include",
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "خطا در دریافت کاربران");
			}

			setUsers(data.users || []);
		} catch (error) {
			console.error("Fetch users error:", error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const fetchDepartments = async () => {
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/users/departments`,
				{
					credentials: "include",
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "خطا در دریافت واحدها");
			}

			setDepartments(
				(data.departments || []).filter((department) => department.is_active),
			);
		} catch (error) {
			console.error("Fetch departments error:", error);
			alert(error.message);
		}
	};

	const handleCreateExpert = async (event) => {
		event.preventDefault();

		try {
			setSavingExpert(true);

			const response = await fetch(`${API_BASE_URL}/api/users/experts`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(expertForm),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "خطا در ایجاد حساب کارشناس");
			}

			alert("حساب کارشناس با موفقیت ایجاد شد.");

			setShowExpertModal(false);
			setExpertForm({
				fullName: "",
				email: "",
				password: "",
				departmentId: "",
			});

			fetchUsers();
		} catch (error) {
			alert(error.message);
		} finally {
			setSavingExpert(false);
		}
	};

	const handleToggleStatus = async (item) => {
		const newStatus = !item.is_active;

		const confirmed = window.confirm(
			`آیا از ${newStatus ? "فعال" : "غیرفعال"} کردن حساب ${item.full_name} مطمئن هستید؟`,
		);

		if (!confirmed) return;

		try {
			const response = await fetch(
				`${API_BASE_URL}/api/users/${item.id}/status`,
				{
					method: "PATCH",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						isActive: newStatus,
					}),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "خطا در تغییر وضعیت حساب");
			}

			setUsers((prevUsers) =>
				prevUsers.map((user) =>
					user.id === item.id ? { ...user, is_active: newStatus } : user,
				),
			);
		} catch (error) {
			alert(error.message);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const totalUsers = users.length;

	const studentCount = users.filter((item) => item.role === "student").length;

	const expertCount = users.filter((item) => item.role === "expert").length;

	const managerCount = users.filter((item) => item.role === "manager").length;

	const activeCount = users.filter((item) => item.is_active).length;

	const [searchTerm, setSearchTerm] = useState("");

	const filteredUsers = users.filter((item) => {
		const search = searchTerm.trim().toLowerCase();

		return (
			item.full_name.toLowerCase().includes(search) ||
			item.email.toLowerCase().includes(search)
		);
	});

	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="users">
			<section className="manager-reports">
				<div className="reports-header">
					<div>
						<span>پنل مدیریت</span>
						<h1>مدیریت کاربران</h1>
						<p>مشاهده و مدیریت حساب‌های کاربری سامانه</p>
					</div>

					<div className="reports-header-actions">
						<button
							type="button"
							className="reports-refresh-button"
							onClick={fetchUsers}
							disabled={loading}
						>
							<RefreshCw size={17} />
							بروزرسانی
						</button>

						<button
							type="button"
							className="reports-primary-button"
							onClick={async () => {
								await fetchDepartments();
								setShowExpertModal(true);
							}}
						>
							<Plus size={17} />
							افزودن کارشناس
						</button>
					</div>
				</div>

				{loading ? (
					<div className="reports-state">در حال دریافت اطلاعات...</div>
				) : error ? (
					<div className="reports-state error">{error}</div>
				) : (
					<>
						<div className="reports-overview">
							<div className="reports-stat-card">
								<Users />
								<span>کل کاربران</span>
								<strong>{totalUsers.toLocaleString("fa-IR")}</strong>
							</div>

							<div className="reports-stat-card">
								<GraduationCap />
								<span>دانشجویان</span>
								<strong>{studentCount.toLocaleString("fa-IR")}</strong>
							</div>

							<div className="reports-stat-card">
								<BriefcaseBusiness />
								<span>کارشناسان</span>
								<strong>{expertCount.toLocaleString("fa-IR")}</strong>
							</div>

							<div className="reports-stat-card">
								<UserRound />
								<span>مدیران</span>
								<strong>{managerCount.toLocaleString("fa-IR")}</strong>
							</div>

							<div className="reports-stat-card">
								<Users />
								<span>حساب‌های فعال</span>
								<strong>{activeCount.toLocaleString("fa-IR")}</strong>
							</div>
						</div>

						<section className="reports-section">
							<div className="reports-section-header">
								<div>
									<h2>فهرست کاربران</h2>
									<p>تمام حساب‌های کاربری ثبت‌شده در سامانه</p>
								</div>
								<Users size={21} />
							</div>

							<div className="users-search">
								<Search size={18} />
								<input
									type="text"
									placeholder="جست‌وجو بر اساس نام یا ایمیل..."
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
								/>
							</div>

							<div className="reports-experts-table-wrapper">
								<table className="reports-experts-table">
									<thead>
										<tr>
											<th>نام کاربر</th>
											<th>ایمیل</th>
											<th>نقش</th>
											<th>واحد دانشگاهی</th>
											<th>وضعیت حساب</th>
											<th>عملیات</th>
											<th>تاریخ عضویت</th>
										</tr>
									</thead>

									<tbody>
										{filteredUsers.length > 0 ? (
											filteredUsers.map((item) => (
												<tr key={item.id}>
													<td>{item.full_name}</td>
													<td>{item.email}</td>
													<td>{item.role}</td>
													<td>{item.department_name || "—"}</td>
													<td>
														<span
															className={`users-status-badge ${
																item.is_active ? "active" : "inactive"
															}`}
														>
															{item.is_active ? "فعال" : "غیرفعال"}
														</span>
													</td>{" "}
													<td>
														<button
															type="button"
															className={`users-status-button ${
																item.is_active ? "deactivate" : "activate"
															}`}
															onClick={() => handleToggleStatus(item)}
														>
															{item.is_active ? "غیرفعال کردن" : "فعال کردن"}
														</button>
													</td>
													<td>
														{new Date(item.created_at).toLocaleDateString(
															"fa-IR",
														)}
													</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan="6" className="users-empty">
													کاربری با این مشخصات پیدا نشد.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</section>
					</>
				)}
			</section>

			{showExpertModal && (
				<div className="department-modal-overlay">
					<div className="department-modal">
						<div className="department-modal-header">
							<h2>افزودن کارشناس جدید</h2>

							<button type="button" onClick={() => setShowExpertModal(false)}>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleCreateExpert}>
							<div className="department-form-group">
								<label>نام و نام خانوادگی</label>
								<input
									type="text"
									value={expertForm.fullName}
									onChange={(event) =>
										setExpertForm({
											...expertForm,
											fullName: event.target.value,
										})
									}
									required
									maxLength={150}
									placeholder="نام کامل کارشناس"
								/>
							</div>

							<div className="department-form-group">
								<label>ایمیل</label>
								<input
									type="email"
									value={expertForm.email}
									onChange={(event) =>
										setExpertForm({
											...expertForm,
											email: event.target.value,
										})
									}
									required
									placeholder="example@email.com"
								/>
							</div>

							<div className="department-form-group">
								<label>رمز عبور</label>
								<input
									type="password"
									value={expertForm.password}
									onChange={(event) =>
										setExpertForm({
											...expertForm,
											password: event.target.value,
										})
									}
									required
									minLength={8}
									placeholder="حداقل ۸ کاراکتر"
								/>
							</div>

							<div className="department-form-group">
								<label>واحد دانشگاهی</label>
								<select
									value={expertForm.departmentId}
									onChange={(event) =>
										setExpertForm({
											...expertForm,
											departmentId: event.target.value,
										})
									}
									required
								>
									<option value="">انتخاب واحد دانشگاهی</option>

									{departments.map((department) => (
										<option key={department.id} value={department.id}>
											{department.name}
										</option>
									))}
								</select>
							</div>

							<div className="department-modal-actions">
								<button type="button" onClick={() => setShowExpertModal(false)}>
									انصراف
								</button>

								<button type="submit" disabled={savingExpert}>
									{savingExpert ? "در حال ثبت..." : "ایجاد حساب کارشناس"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</DashboardLayout>
	);
}

export default ManagerUsers;

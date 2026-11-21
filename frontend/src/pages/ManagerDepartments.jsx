
import { useEffect, useState } from "react";
import { Building2, RefreshCw, Plus, Users, Search, X } from "lucide-react";

import API_BASE_URL from "../config";
import DashboardLayout from "../components/layout/DashboardLayout";
import "./ManagerReports.css";

function ManagerDepartments({ user, onLogout }) {
	const [departments, setDepartments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [editingDepartment, setEditingDepartment] = useState(null);
	const [formData, setFormData] = useState({
		name: "",
		code: "",
		description: "",
	});

	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (showModal) {
			setFormData({
				name: editingDepartment?.name || "",
				code: editingDepartment?.code || "",
				description: editingDepartment?.description || "",
			});
		}
	}, [showModal, editingDepartment]);

	const fetchDepartments = async () => {
		try {
			setLoading(true);

			const response = await fetch(
				`${API_BASE_URL}/api/users/departments`,
				{ credentials: "include" },
			);

			if (!response.ok) {
				throw new Error("خطا در دریافت واحدها");
			}

			const data = await response.json();
			setDepartments(data.departments || []);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDepartments();
	}, []);

	const handleToggleStatus = async (department) => {
		const newStatus = !department.is_active;

		const confirmed = window.confirm(
			`آیا از ${newStatus ? "فعال" : "غیرفعال"} کردن واحد «${department.name}» مطمئن هستید؟`,
		);

		if (!confirmed) return;

		try {
			const response = await fetch(
				`${API_BASE_URL}/api/users/departments/${department.id}/status`,
				{
					method: "PATCH",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ isActive: newStatus }),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "خطا در تغییر وضعیت واحد");
			}

			await fetchDepartments();
		} catch (error) {
			alert(error.message);
		}
	};

	const handleSaveDepartment = async (e) => {
		e.preventDefault();

		try {
			setSaving(true);

			const isEditing = Boolean(editingDepartment);

			const url = isEditing
				? `${API_BASE_URL}/api/users/departments/${editingDepartment.id}`
				: `${API_BASE_URL}/api/users/departments`;

			const response = await fetch(url, {
				method: isEditing ? "PATCH" : "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "خطا در ذخیره اطلاعات واحد");
			}

			alert(data.message);

			setShowModal(false);
			setEditingDepartment(null);
			await fetchDepartments();
		} catch (error) {
			alert(error.message);
		} finally {
			setSaving(false);
		}
	};

	const filteredDepartments = departments.filter((department) => {
		const search = searchTerm.trim().toLowerCase();

		return (
			department.name.toLowerCase().includes(search) ||
			department.code.toLowerCase().includes(search)
		);
	});

	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="departments">
			<div className="manager-reports-page">
				<div className="reports-header">
					<div>
						<span>پنل مدیریت</span>
						<h1>مدیریت واحدهای دانشگاه</h1>
						<p>مشاهده و مدیریت واحدهای مختلف دانشگاه</p>
					</div>

					<div className="reports-header-actions">
						<button
							type="button"
							className="reports-refresh-button"
							onClick={fetchDepartments}
							disabled={loading}
						>
							<RefreshCw size={17} />
							بروزرسانی
						</button>

						<button
							className="reports-primary-button"
							onClick={() => setShowModal(true)}
						>
							<Plus size={18} />
							افزودن واحد جدید
						</button>
					</div>
				</div>

				<div className="reports-overview">
					<div className="reports-stat-card">
						<div className="reports-stat-icon">
							<Building2 size={22} />
						</div>
						<div>
							<span>کل واحدها</span>
							<strong>{departments.length}</strong>
						</div>
					</div>

					<div className="reports-stat-card">
						<div className="reports-stat-icon">
							<Building2 size={22} />
						</div>
						<div>
							<span>واحدهای فعال</span>
							<strong>
								{
									departments.filter((department) => department.is_active)
										.length
								}
							</strong>
						</div>
					</div>

					<div className="reports-stat-card">
						<div className="reports-stat-icon">
							<Building2 size={22} />
						</div>
						<div>
							<span>واحدهای غیرفعال</span>
							<strong>
								{
									departments.filter((department) => !department.is_active)
										.length
								}
							</strong>
						</div>
					</div>

					<div className="reports-stat-card">
						<div className="reports-stat-icon">
							<Users size={22} />
						</div>
						<div>
							<span>کل کارشناسان فعال</span>
							<strong>
								{departments.reduce(
									(total, department) =>
										total + Number(department.expert_count || 0),
									0,
								)}
							</strong>
						</div>
					</div>
				</div>

				<div className="reports-section">
					<div className="reports-section-header">
						<div>
							<h2>واحدهای دانشگاه</h2>
							<p>مدیریت اطلاعات و وضعیت واحدهای دانشگاه</p>
						</div>

						<div className="users-search">
							<Search size={18} />
							<input
								type="text"
								placeholder="جست‌وجوی نام یا کد واحد..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>

					{loading ? (
						<p>در حال دریافت اطلاعات...</p>
					) : filteredDepartments.length === 0 ? (
						<p className="users-empty">هیچ واحدی پیدا نشد.</p>
					) : (
						<div className="reports-experts-table-wrapper">
							<table className="reports-experts-table">
								<thead>
									<tr>
										<th>نام واحد</th>
										<th>کد واحد</th>
										<th>توضیحات</th>
										<th>تعداد کارشناسان</th>
										<th>وضعیت</th>
										<th>عملیات</th>
									</tr>
								</thead>

								<tbody>
									{filteredDepartments.map((department) => (
										<tr key={department.id}>
											<td>{department.name}</td>
											<td>{department.code}</td>
											<td>{department.description || "—"}</td>
											<td>{department.expert_count}</td>
											<td>
												<span
													className={`department-status-button ${
														department.is_active ? "deactivate" : "activate"
													}`}
												>
													{department.is_active ? "فعال" : "غیرفعال"}
												</span>
											</td>
											<td>
												<div className="users-table-actions">
													<button
														className="department-edit-button"
														onClick={() => {
															setEditingDepartment(department);
															setShowModal(true);
														}}
													>
														ویرایش
													</button>

													<button
														className="department-status-button"
														onClick={() => handleToggleStatus(department)}
													>
														{department.is_active
															? "غیرفعال کردن"
															: "فعال کردن"}
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{showModal && (
					<div className="department-modal-overlay">
						<div className="department-modal">
							<div className="department-modal-header">
								<h2>
									{editingDepartment
										? "ویرایش واحد دانشگاهی"
										: "افزودن واحد جدید"}
								</h2>

								<button
									type="button"
									onClick={() => {
										setShowModal(false);
										setEditingDepartment(null);
									}}
								>
									<X size={20} />
								</button>
							</div>

							<form onSubmit={handleSaveDepartment}>
								<div className="department-form-group">
									<label>نام واحد</label>
									<input
										type="text"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										placeholder="مثلاً: امور آموزشی"
										maxLength={150}
										required
									/>
								</div>

								<div className="department-form-group">
									<label>کد واحد</label>
									<input
										type="text"
										value={formData.code}
										onChange={(e) =>
											setFormData({ ...formData, code: e.target.value })
										}
										placeholder="مثلاً: EDUCATION"
										maxLength={30}
										required
									/>
								</div>

								<div className="department-form-group">
									<label>توضیحات</label>
									<textarea
										value={formData.description}
										onChange={(e) =>
											setFormData({ ...formData, description: e.target.value })
										}
										placeholder="توضیحات مربوط به این واحد..."
										maxLength={500}
										rows={4}
									/>
								</div>

								<div className="department-modal-actions">
									<button
										type="button"
										onClick={() => {
											setShowModal(false);
											setEditingDepartment(null);
										}}
									>
										انصراف
									</button>

									<button type="submit" disabled={saving}>
										{saving
											? "در حال ذخیره..."
											: editingDepartment
												? "ذخیره تغییرات"
												: "ایجاد واحد"}
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

export default ManagerDepartments;

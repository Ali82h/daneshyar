
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	ClipboardList,
	Clock3,
	CheckCircle2,
	X,
	AlertTriangle,
	UserRound,
	ArrowLeft,
	Building2,
} from "lucide-react";

import DashboardLayout from "../components/layout/DashboardLayout";
import API_BASE_URL from "../config";
import "./ManagerDashboard.css";
import universityImage from "../assets/university.jpg";

function ManagerDashboard({ user, onLogout }) {
	const navigate = useNavigate();
	const [issues, setIssues] = useState([]);
	const [allIssues, setAllIssues] = useState([]);
	const [activeFilter, setActiveFilter] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState("");
	const [expertFilter, setExpertFilter] = useState("");
	const [departments, setDepartments] = useState([]);
	const [experts, setExperts] = useState([]);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [selectedIssue, setSelectedIssue] = useState(null);
	const [departmentId, setDepartmentId] = useState("");
	const [expertId, setExpertId] = useState("");
	const [selectedPriority, setSelectedPriority] = useState("medium");

	const priorityLabels = {
		low: "کم",
		medium: "متوسط",
		high: "زیاد",
	};

	const getSuggestedPriority = (score) => {
		if (score <= 2) return "low";
		if (score === 3) return "medium";
		return "high";
	};

	const [expertsLoading, setExpertsLoading] = useState(false);
	const [assigning, setAssigning] = useState(false);
	const [modalError, setModalError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [rejectingIssue, setRejectingIssue] = useState(null);
	const [rejectionReason, setRejectionReason] = useState("");
	const [rejecting, setRejecting] = useState(false);
	const [rejectionError, setRejectionError] = useState("");

	const [sortOrder, setSortOrder] = useState("newest");

	useEffect(() => {
		fetchIssues();
		fetchAllIssues();
		fetchDepartments();
	}, []);

	useEffect(() => {
		if (!departmentId || !selectedIssue) {
			setExperts([]);
			setExpertId("");
			return;
		}

		fetchExperts(departmentId);
	}, [departmentId, selectedIssue]);

	async function fetchIssues() {
		try {
			setLoading(true);
			setError("");

			const response = await fetch(
				`${API_BASE_URL}/api/issues/unassigned`,
				{ credentials: "include" },
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "دریافت درخواست‌ها ناموفق بود.");
			}

			setIssues(data.issues || []);
		} catch (err) {
			setError(err.message || "خطا در ارتباط با سرور");
		} finally {
			setLoading(false);
		}
	}

	async function fetchAllIssues() {
		try {
			const response = await fetch(`${API_BASE_URL}/api/issues/all`, {
				credentials: "include",
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "دریافت همه درخواست‌ها ناموفق بود.");
			}

			setAllIssues(data.issues || []);
		} catch (err) {
			console.error("All issues error:", err);
		}
	}

	async function fetchDepartments() {
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/users/departments`,
				{ credentials: "include" },
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "دریافت واحدها ناموفق بود.");
			}

			setDepartments(data.departments || []);
		} catch (err) {
			console.error("Departments error:", err);
		}
	}

	async function fetchExperts(id) {
		try {
			setExpertsLoading(true);
			setExperts([]);
			setExpertId("");
			setModalError("");

			const response = await fetch(
				`${API_BASE_URL}/api/users/departments/${id}/experts`,
				{ credentials: "include" },
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "دریافت کارشناسان ناموفق بود.");
			}

			setExperts(data.experts || []);
		} catch (err) {
			setModalError(err.message || "خطا در دریافت کارشناسان");
		} finally {
			setExpertsLoading(false);
		}
	}

	function openAssignModal(issue) {
		setSelectedIssue(issue);
		setSelectedPriority(
			issue.final_priority || getSuggestedPriority(issue.priority_score),
		);
		setDepartmentId(
			issue.suggested_department_id
				? String(issue.suggested_department_id)
				: "",
		);
		setExpertId("");
		setModalError("");
		setSuccessMessage("");
	}

	function closeAssignModal() {
		if (assigning) return;

		setSelectedIssue(null);
		setDepartmentId("");
		setExpertId("");
		setExperts([]);
		setModalError("");
	}

	async function handleAssign() {
		if (!departmentId || !expertId) {
			setModalError("لطفاً واحد و کارشناس را انتخاب کنید.");
			return;
		}

		try {
			setAssigning(true);
			setModalError("");

			const response = await fetch(
				`${API_BASE_URL}/api/issues/${selectedIssue.id}/assign`,
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						departmentId: Number(departmentId),
						expertId: Number(expertId),
						priority: selectedPriority,
					}),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "ارجاع درخواست انجام نشد.");
			}

			setSuccessMessage("درخواست با موفقیت به کارشناس ارجاع داده شد.");
			setSelectedIssue(null);
			setDepartmentId("");
			setExpertId("");
			setExperts([]);

			await fetchIssues();
			await fetchAllIssues();
		} catch (err) {
			setModalError(err.message || "خطا در ارجاع درخواست");
		} finally {
			setAssigning(false);
		}
	}

	function openRejectModal(issue) {
		setRejectingIssue(issue);
		setRejectionReason("");
		setRejectionError("");
		setSuccessMessage("");
	}

	function closeRejectModal() {
		if (rejecting) return;

		setRejectingIssue(null);
		setRejectionReason("");
		setRejectionError("");
	}

	async function handleReject() {
		if (!rejectionReason.trim()) {
			setRejectionError("لطفاً دلیل رد درخواست را وارد کنید.");
			return;
		}

		if (rejectionReason.trim().length > 1000) {
			setRejectionError(
				"دلیل رد درخواست نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد.",
			);
			return;
		}

		try {
			setRejecting(true);
			setRejectionError("");

			const response = await fetch(
				`${API_BASE_URL}/api/issues/${rejectingIssue.id}/reject`,
				{
					method: "PATCH",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						reason: rejectionReason.trim(),
					}),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "رد درخواست با خطا مواجه شد.");
			}

			setSuccessMessage("درخواست با موفقیت رد شد.");
			setRejectingIssue(null);
			setRejectionReason("");

			await fetchIssues();
			await fetchAllIssues();
		} catch (error) {
			setRejectionError(error.message || "خطا در رد درخواست.");
		} finally {
			setRejecting(false);
		}
	}

	const stats = [
		{
			title: "کل درخواست‌ها",
			value: allIssues.length,
			description: "تمام مشکلات ثبت‌شده",
			icon: ClipboardList,
			color: "blue",
		},
		{
			title: "در انتظار ارجاع",
			value: allIssues.filter((issue) => issue.status === "submitted").length,
			description: "درخواست‌های ثبت‌شده و ارجاع‌نشده",
			icon: Clock3,
			color: "orange",
		},
		{
			title: "در حال رسیدگی",
			value: allIssues.filter(
				(issue) =>
					issue.status === "assigned" || issue.status === "in_progress",
			).length,
			description: "درخواست‌های ارجاع‌شده و در حال انجام",
			icon: AlertTriangle,
			color: "red",
		},
		{
			title: "حل‌شده",
			value: allIssues.filter((issue) => issue.status === "resolved").length,
			description: "درخواست‌های تکمیل‌شده",
			icon: CheckCircle2,
			color: "green",
		},
		{
			title: "ردشده",
			value: allIssues.filter((issue) => issue.status === "rejected").length,
			description: "درخواست‌های ردشده توسط مدیر",
			icon: X,
			color: "red",
		},
	];

	const filteredExperts = [
		...new Set(
			allIssues
				.filter(
					(issue) =>
						(!departmentFilter || issue.department_name === departmentFilter) &&
						issue.expert_name,
				)
				.map((issue) => issue.expert_name),
		),
	];

	const filteredIssues = allIssues
		.filter((issue) => {
			const matchesStatus =
				activeFilter === "all" || issue.status === activeFilter;

			const search = searchTerm.trim().toLowerCase();

			const matchesSearch =
				!search ||
				issue.title?.toLowerCase().includes(search) ||
				issue.tracking_code?.toLowerCase().includes(search) ||
				issue.student_name?.toLowerCase().includes(search);

			const matchesDepartment =
				!departmentFilter || issue.department_name === departmentFilter;

			const matchesExpert = !expertFilter || issue.expert_name === expertFilter;

			return (
				matchesStatus && matchesSearch && matchesDepartment && matchesExpert
			);
		})
		.sort((a, b) => {
			const priorityOrder = {
				high: 3,
				medium: 2,
				low: 1,
			};

			const priorityA =
				a.final_priority || getSuggestedPriority(a.priority_score);

			const priorityB =
				b.final_priority || getSuggestedPriority(b.priority_score);

			const priorityDifference =
				priorityOrder[priorityB] - priorityOrder[priorityA];

			if (priorityDifference !== 0) {
				return priorityDifference;
			}

			const dateA = new Date(a.created_at).getTime();
			const dateB = new Date(b.created_at).getTime();

			return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
		});

	const sortedUnassignedIssues = [...issues].sort((a, b) => {
		const priorityOrder = {
			high: 3,
			medium: 2,
			low: 1,
		};

		const priorityA =
			a.final_priority || getSuggestedPriority(a.priority_score);

		const priorityB =
			b.final_priority || getSuggestedPriority(b.priority_score);

		return priorityOrder[priorityB] - priorityOrder[priorityA];
	});

	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="dashboard">
			<section className="manager-dashboard">
				<div
					className="welcome-banner"
					style={{
						backgroundImage: `url(${universityImage})`,
					}}
				>
					<div className="welcome-overlay"></div>

					<div className="welcome-content">
						<div className="welcome-label">
							<Building2 size={14} />
							دانشگاه شهرکرد
						</div>

						<h1>خوش آمدید، {user?.full_name}</h1>

						<p>
							به پنل مدیریت سامانه دانش‌یار خوش آمدید. از این بخش می‌توانید
							درخواست‌های ثبت‌شده را مدیریت کرده و روند رسیدگی به مشکلات دانشگاه
							را پیگیری کنید.
						</p>

						<button
							type="button"
							className="welcome-button"
							onClick={() => navigate("/manager/issues")}
						>
							مدیریت درخواست‌ها
							<ArrowLeft size={16} />
						</button>
					</div>
				</div>

				<div className="statistics-grid">
					{stats.map((stat) => {
						const Icon = stat.icon;

						return (
							<article className="stat-card" key={stat.title}>
								<div className={`stat-icon ${stat.color}`}>
									<Icon size={22} />
								</div>

								<div className="stat-details">
									<span>{stat.title}</span>
									<strong>{stat.value}</strong>
									<small>{stat.description}</small>
								</div>
							</article>
						);
					})}
				</div>

				<section className="manager-issues-section">
					<div className="manager-section-header">
						<div>
							<h2>درخواست‌های نیازمند ارجاع</h2>
							<p>درخواست‌هایی که هنوز به کارشناس ارجاع داده نشده‌اند.</p>
						</div>

						<button
							type="button"
							className="manager-refresh-button"
							onClick={fetchIssues}
							disabled={loading}
						>
							بروزرسانی
						</button>
					</div>

					{successMessage && (
						<div className="manager-success-message">{successMessage}</div>
					)}

					{loading ? (
						<div className="manager-state">در حال دریافت درخواست‌ها...</div>
					) : error ? (
						<div className="manager-state error">{error}</div>
					) : issues.length === 0 ? (
						<div className="manager-state">
							در حال حاضر درخواست بدون ارجاعی وجود ندارد.
						</div>
					) : (
						<div className="manager-issues-list">
							{sortedUnassignedIssues.map((issue) => (
								<article
									className={`manager-issue-card priority-${
										issue.final_priority ||
										getSuggestedPriority(issue.priority_score)
									}`}
									key={issue.id}
								>
									<div className="manager-issue-info">
										<span className="manager-tracking-code">
											کد پیگیری: {issue.tracking_code}
										</span>
										<span
											className={`manager-priority-badge priority-${
												issue.final_priority ||
												getSuggestedPriority(issue.priority_score)
											}`}
										>
											اولویت{" "}
											{
												priorityLabels[
													issue.final_priority ||
														getSuggestedPriority(issue.priority_score)
												]
											}
										</span>

										<h3>{issue.title}</h3>

										<p>{issue.description}</p>

										<div className="manager-issue-meta">
											<span>ثبت‌کننده: {issue.student_name}</span>
											<span>
												واحد پیشنهادی:{" "}
												{issue.suggested_department_name || "مشخص نشده"}
											</span>
											<span>وضعیت: ثبت‌شده</span>
										</div>
									</div>

									<div className="manager-issue-actions">
										<button
											type="button"
											onClick={() => openAssignModal(issue)}
										>
											ارجاع درخواست
										</button>

										<button
											type="button"
											className="manager-reject-button"
											onClick={() => openRejectModal(issue)}
										>
											رد درخواست
										</button>

										<button
											type="button"
											onClick={() => navigate(`/manager/issues/${issue.id}`)}
										>
											مشاهده جزئیات
										</button>
									</div>
								</article>
							))}
						</div>
					)}
				</section>

				<section className="manager-issues-section">
					<div className="manager-section-header">
						<div>
							<h2>تمام درخواست‌های ثبت‌شده</h2>
							<p>نمای کلی وضعیت درخواست‌های ثبت‌شده در سامانه.</p>
						</div>

						<button
							type="button"
							className="manager-refresh-button"
							onClick={fetchAllIssues}
						>
							بروزرسانی
						</button>
					</div>

					<div className="manager-search-box">
						<input
							type="text"
							placeholder="جست‌وجو بر اساس عنوان، کد پیگیری یا نام دانشجو..."
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
						/>
					</div>

					<div className="manager-advanced-filters">
						<div className="manager-filter-group">
							<label htmlFor="department-filter">فیلتر بر اساس واحد</label>
							<select
								id="department-filter"
								value={departmentFilter}
								onChange={(event) => {
									setDepartmentFilter(event.target.value);
									setExpertFilter("");
								}}
							>
								<option value="">همه واحدها</option>
								{departments.map((department) => (
									<option key={department.id} value={department.name}>
										{department.name}
									</option>
								))}
							</select>
						</div>

						<div className="manager-filter-group">
							<label htmlFor="expert-filter">فیلتر بر اساس کارشناس</label>
							<select
								id="expert-filter"
								value={expertFilter}
								onChange={(event) => setExpertFilter(event.target.value)}
								disabled={filteredExperts.length === 0}
							>
								<option value="">همه کارشناسان</option>
								{filteredExperts.map((expert) => (
									<option key={expert} value={expert}>
										{expert}
									</option>
								))}
							</select>
						</div>

						<div className="manager-filter-group">
							<label htmlFor="sort-filter">مرتب‌سازی بر اساس زمان</label>
							<select
								id="sort-filter"
								value={sortOrder}
								onChange={(event) => setSortOrder(event.target.value)}
							>
								<option value="newest">جدیدترین درخواست‌ها</option>
								<option value="oldest">قدیمی‌ترین درخواست‌ها</option>
							</select>
						</div>
					</div>

					<div className="manager-filter-tabs">
						{[
							{ label: `همه (${allIssues.length})`, value: "all" },
							{
								label: `ثبت‌شده (${allIssues.filter((i) => i.status === "submitted").length})`,
								value: "submitted",
							},
							{
								label: `ارجاع‌شده (${allIssues.filter((i) => i.status === "assigned").length})`,
								value: "assigned",
							},
							{
								label: `در حال رسیدگی (${allIssues.filter((i) => i.status === "in_progress").length})`,
								value: "in_progress",
							},
							{
								label: `حل‌شده (${allIssues.filter((i) => i.status === "resolved").length})`,
								value: "resolved",
							},
							{
								label: `ردشده (${allIssues.filter((i) => i.status === "rejected").length})`,
								value: "rejected",
							},
						].map((tab) => (
							<button
								key={tab.value}
								type="button"
								className={activeFilter === tab.value ? "active" : ""}
								onClick={() => setActiveFilter(tab.value)}
							>
								{tab.value === "all" ? "همه" : tab.label.split(" (")[0]}
								<span className="filter-count">
									{tab.value === "all"
										? allIssues.length
										: allIssues.filter((issue) => issue.status === tab.value)
												.length}
								</span>
							</button>
						))}
					</div>

					{allIssues.length === 0 ? (
						<div className="manager-state">هنوز درخواستی ثبت نشده است.</div>
					) : (
						<div className="manager-issues-list">
							{filteredIssues.map((issue) => {
								const statusLabels = {
									submitted: "ثبت‌شده",
									assigned: "ارجاع‌شده",
									in_progress: "در حال رسیدگی",
									resolved: "حل‌شده",
									rejected: "ردشده",
								};

								return (
									<article
										className={`manager-issue-card priority-${
											issue.final_priority ||
											getSuggestedPriority(issue.priority_score)
										}`}
										key={issue.id}
									>
										<div className="manager-issue-info">
											<span className="manager-tracking-code">
												کد پیگیری: {issue.tracking_code}
											</span>
											<span
												className={`manager-priority-badge priority-${
													issue.final_priority ||
													getSuggestedPriority(issue.priority_score)
												}`}
											>
												اولویت{" "}
												{
													priorityLabels[
														issue.final_priority ||
															getSuggestedPriority(issue.priority_score)
													]
												}
											</span>

											<h3>{issue.title}</h3>

											<p>{issue.description}</p>

											<div className="manager-issue-meta">
												<span>ثبت‌کننده: {issue.student_name}</span>
												<span>
													واحد مسئول:{" "}
													{issue.department_name || "هنوز ارجاع نشده"}
												</span>
												<span>
													کارشناس: {issue.expert_name || "تعیین نشده"}
												</span>
												<span>
													وضعیت: {statusLabels[issue.status] || issue.status}
												</span>
											</div>
										</div>

										<div className="manager-issue-actions">
											<button
												type="button"
												onClick={() => navigate(`/manager/issues/${issue.id}`)}
											>
												مشاهده جزئیات
											</button>
										</div>
									</article>
								);
							})}
						</div>
					)}
				</section>
			</section>

			{selectedIssue && (
				<div
					className="manager-modal-overlay"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) {
							closeAssignModal();
						}
					}}
				>
					<div
						className="manager-modal"
						role="dialog"
						aria-modal="true"
						aria-labelledby="assign-modal-title"
					>
						<div className="manager-modal-header">
							<div>
								<h2 id="assign-modal-title">ارجاع درخواست</h2>
								<p>انتخاب واحد دانشگاهی و کارشناس مسئول</p>
							</div>

							<button
								type="button"
								className="manager-modal-close"
								onClick={closeAssignModal}
								disabled={assigning}
								aria-label="بستن"
							>
								<X size={20} />
							</button>
						</div>

						<div className="manager-modal-issue">
							<span>درخواست انتخاب‌شده</span>
							<strong>{selectedIssue.title}</strong>
							<small>کد پیگیری: {selectedIssue.tracking_code}</small>
						</div>

						<div className="manager-form-group">
							<label htmlFor="assign-priority">اولویت نهایی درخواست</label>

							<select
								id="assign-priority"
								value={selectedPriority}
								onChange={(event) => setSelectedPriority(event.target.value)}
								disabled={assigning}
							>
								<option value="low">کم</option>
								<option value="medium">متوسط</option>
								<option value="high">زیاد</option>
							</select>

							<small>
								اولویت پیشنهادی سیستم:{" "}
								{
									priorityLabels[
										getSuggestedPriority(selectedIssue.priority_score)
									]
								}
							</small>
						</div>

						<div className="manager-form-group">
							<label htmlFor="department-select">واحد دانشگاهی</label>

							<select
								id="department-select"
								value={departmentId}
								onChange={(event) => setDepartmentId(event.target.value)}
								disabled={assigning}
							>
								<option value="">انتخاب واحد</option>
								{departments.map((department) => (
									<option key={department.id} value={department.id}>
										{department.name}
									</option>
								))}
							</select>
						</div>

						<div className="manager-form-group">
							<label htmlFor="expert-select">کارشناس مسئول</label>

							<select
								id="expert-select"
								value={expertId}
								onChange={(event) => setExpertId(event.target.value)}
								disabled={!departmentId || expertsLoading || assigning}
							>
								<option value="">
									{!departmentId
										? "ابتدا واحد را انتخاب کنید"
										: expertsLoading
											? "در حال دریافت کارشناسان..."
											: "انتخاب کارشناس"}
								</option>

								{experts.map((expert) => (
									<option key={expert.id} value={expert.id}>
										{expert.full_name}
									</option>
								))}
							</select>

							{departmentId && !expertsLoading && experts.length === 0 && (
								<small className="manager-no-experts">
									برای این واحد کارشناس فعالی ثبت نشده است.
								</small>
							)}
						</div>

						{modalError && (
							<div className="manager-modal-error">{modalError}</div>
						)}

						<div className="manager-modal-actions">
							<button
								type="button"
								className="manager-cancel-button"
								onClick={closeAssignModal}
								disabled={assigning}
							>
								انصراف
							</button>

							<button
								type="button"
								className="manager-confirm-button"
								onClick={handleAssign}
								disabled={
									assigning || expertsLoading || !departmentId || !expertId
								}
							>
								{assigning ? (
									"در حال ارجاع..."
								) : (
									<>
										<UserRound size={17} />
										تأیید و ارجاع
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{rejectingIssue && (
				<div
					className="manager-modal-overlay"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) {
							closeRejectModal();
						}
					}}
				>
					<div
						className="manager-modal"
						role="dialog"
						aria-modal="true"
						aria-labelledby="reject-modal-title"
					>
						<div className="manager-modal-header">
							<div>
								<h2 id="reject-modal-title">رد درخواست</h2>
								<p>لطفاً دلیل رد درخواست را مشخص کنید.</p>
							</div>

							<button
								type="button"
								className="manager-modal-close"
								onClick={closeRejectModal}
								disabled={rejecting}
							>
								<X size={20} />
							</button>
						</div>

						<div className="manager-form-group">
							<label htmlFor="rejection-reason">دلیل رد درخواست</label>

							<textarea
								id="rejection-reason"
								value={rejectionReason}
								onChange={(event) => setRejectionReason(event.target.value)}
								rows={4}
								maxLength={1000}
								disabled={rejecting}
								placeholder="دلیل رد این درخواست را بنویسید..."
							/>

							<small>{rejectionReason.length} از ۱۰۰۰ کاراکتر</small>
						</div>

						{rejectionError && (
							<div className="manager-modal-error">{rejectionError}</div>
						)}

						<div className="manager-modal-actions">
							<button
								type="button"
								className="manager-cancel-button"
								onClick={closeRejectModal}
								disabled={rejecting}
							>
								انصراف
							</button>

							<button
								type="button"
								className="manager-reject-button"
								onClick={handleReject}
								disabled={rejecting || !rejectionReason.trim()}
							>
								{rejecting ? "در حال ثبت..." : "تأیید و رد درخواست"}
							</button>
						</div>
					</div>
				</div>
			)}
		</DashboardLayout>
	);
}

export default ManagerDashboard;

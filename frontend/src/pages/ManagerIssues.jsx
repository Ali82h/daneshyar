
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	ClipboardList,
	Clock3,
	CheckCircle2,
	UserRound,
	X,
} from "lucide-react";

import API_BASE_URL from "../config";
import DashboardLayout from "../components/layout/DashboardLayout";
import "./ManagerDashboard.css";

function ManagerIssues({ user, onLogout }) {
	const navigate = useNavigate();
	const [issues, setIssues] = useState([]);
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

	useEffect(() => {
		fetchIssues();
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

			setDepartments(
				(data.departments || []).filter((department) => department.is_active),
			);
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
			setRejectionError("دلیل رد درخواست نباید بیشتر از ۱۰۰۰ کاراکتر باشد.");
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
				throw new Error(data.message || "رد درخواست انجام نشد.");
			}

			setSuccessMessage("درخواست با موفقیت رد شد.");
			setRejectingIssue(null);
			setRejectionReason("");

			await fetchIssues();
		} catch (err) {
			setRejectionError(err.message || "خطا در رد درخواست");
		} finally {
			setRejecting(false);
		}
	}

	const sortedIssues = [...issues].sort((a, b) => {
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

	const oldestIssue = issues.length
		? [...issues].sort(
				(a, b) => new Date(a.created_at) - new Date(b.created_at),
			)[0]
		: null;

	const oldestIssueWaitingDays = oldestIssue
		? Math.max(
				0,
				Math.floor(
					(Date.now() - new Date(oldestIssue.created_at).getTime()) /
						(1000 * 60 * 60 * 24),
				),
			)
		: 0;

	const stats = [
		{
			title: "کل درخواست‌های نیازمند ارجاع",
			value: issues.length,
			icon: ClipboardList,
			color: "blue",
		},
		{
			title: "قدیمی‌ترین درخواست در انتظار ارجاع",
			value: oldestIssue
				? new Date(oldestIssue.created_at).toLocaleDateString("fa-IR")
				: "—",
			icon: Clock3,
			color: "orange",
		},
	];

	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="issues">
			<section className="manager-dashboard manager-issues-page">
				<div className="reports-header">
					<div>
						<span>پنل مدیریت</span>
						<h1>درخواست‌های بررسی‌نشده</h1>
						<p>
							در این بخش می‌توانید درخواست‌های بدون ارجاع را بررسی کرده و به
							واحد و کارشناس مربوطه ارجاع دهید.
						</p>
					</div>
				</div>

				<div className="manager-stats">
					{stats.map((stat) => {
						const Icon = stat.icon;

						return (
							<div className="manager-stat-card" key={stat.title}>
								<div className={`manager-stat-icon ${stat.color}`}>
									<Icon size={22} />
								</div>

								<div>
									<span>{stat.title}</span>

									{stat.title === "قدیمی‌ترین درخواست در انتظار ارجاع" ? (
										oldestIssue ? (
											<div className="manager-oldest-issue-details">
												<strong>{oldestIssue.title}</strong>
												<div className="manager-oldest-issue-meta">
													<small>
														تاریخ ثبت:{" "}
														{new Date(
															oldestIssue.created_at,
														).toLocaleDateString("fa-IR")}
													</small>

													<small>
														مدت انتظار: {oldestIssueWaitingDays} روز
													</small>
												</div>
											</div>
										) : (
											<strong>درخواستی وجود ندارد</strong>
										)
									) : (
										<strong>{stat.value}</strong>
									)}
								</div>
							</div>
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
							{sortedIssues.map((issue) => (
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

											<span>
												وضعیت:{" "}
												{issue.status === "submitted"
													? "ثبت‌شده"
													: "در حال بررسی"}
											</span>
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
								aria-label="بستن"
							>
								<X size={20} />
							</button>
						</div>

						<div className="manager-modal-issue">
							<span>درخواست انتخاب‌شده</span>
							<strong>{rejectingIssue.title}</strong>
							<small>کد پیگیری: {rejectingIssue.tracking_code}</small>
						</div>

						<div className="manager-form-group">
							<label htmlFor="rejection-reason">دلیل رد درخواست</label>
							<textarea
								id="rejection-reason"
								value={rejectionReason}
								onChange={(event) => setRejectionReason(event.target.value)}
								placeholder="دلیل رد درخواست را بنویسید..."
								rows={4}
								maxLength={1000}
								disabled={rejecting}
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

export default ManagerIssues;

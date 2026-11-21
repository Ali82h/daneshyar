import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import {
	Search,
	ClipboardList,
	Clock3,
	CheckCircle2,
	AlertCircle,
} from "lucide-react";

import DashboardLayout from "../components/layout/DashboardLayout";
import "./ExpertDashboard.css";

function ExpertIssues({ user, onLogout }) {
	const navigate = useNavigate();

	const [issues, setIssues] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [updatingId, setUpdatingId] = useState(null);
	const [actionError, setActionError] = useState("");

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortOrder, setSortOrder] = useState("newest");

	useEffect(() => {
		const fetchIssues = async () => {
			try {
				const response = await fetch(
					`${API_BASE_URL}/api/issues/assigned`,
					{ credentials: "include" },
				);

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "خطا در دریافت درخواست‌ها");
				}

				setIssues(data.issues || []);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchIssues();
	}, []);
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
	const filteredIssues = useMemo(() => {
		const result = issues.filter((issue) => {
			const matchesSearch =
				issue.title?.toLowerCase().includes(search.toLowerCase()) ||
				issue.tracking_code?.toLowerCase().includes(search.toLowerCase());

			const matchesStatus =
				statusFilter === "all" || issue.status === statusFilter;

			return matchesSearch && matchesStatus;
		});

		return result.sort((a, b) => {
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
	}, [issues, search, statusFilter, sortOrder]);

	const handleStatusChange = async (issueId, newStatus) => {
		setUpdatingId(issueId);
		setActionError("");

		try {
			const response = await fetch(
				`${API_BASE_URL}/api/issues/${issueId}/status`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ status: newStatus }),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "تغییر وضعیت انجام نشد");
			}

			setIssues((previous) =>
				previous.map((issue) =>
					issue.id === issueId ? { ...issue, status: newStatus } : issue,
				),
			);
		} catch (err) {
			setActionError(err.message);
		} finally {
			setUpdatingId(null);
		}
	};

	const getStatusLabel = (status) => {
		const labels = {
			assigned: "در انتظار رسیدگی",
			in_progress: "در حال رسیدگی",
			resolved: "حل‌شده",
			rejected: "ردشده",
		};

		return labels[status] || status;
	};

	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="issues">
			<div className="expert-dashboard">
				<div className="expert-section">
					<div className="reports-header">
						<div>
							<span>پنل کارشناس</span>
							<h1>درخواست‌های ارجاع‌شده</h1>
							<p>مدیریت و پیگیری درخواست‌های ارجاع‌شده به شما</p>
						</div>
					</div>

					<div className="expert-section-header">
						<span>{filteredIssues.length} درخواست</span>
					</div>

					<div className="expert-issues-filters">
						<div className="expert-issues-search">
							<Search size={18} />
							<input
								type="text"
								placeholder="جست‌وجو بر اساس عنوان یا کد پیگیری..."
								value={search}
								onChange={(event) => setSearch(event.target.value)}
							/>
						</div>

						<select
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value)}
						>
							<option value="all">همه وضعیت‌ها</option>
							<option value="assigned">در انتظار رسیدگی</option>
							<option value="in_progress">در حال رسیدگی</option>
							<option value="resolved">حل‌شده</option>
							<option value="rejected">ردشده</option>
						</select>
						<select
							value={sortOrder}
							onChange={(event) => setSortOrder(event.target.value)}
						>
							<option value="newest">جدیدترین درخواست‌ها</option>
							<option value="oldest">قدیمی‌ترین درخواست‌ها</option>
						</select>
					</div>

					{actionError && (
						<div className="expert-message error">{actionError}</div>
					)}

					{loading ? (
						<div className="expert-empty">در حال دریافت درخواست‌ها...</div>
					) : error ? (
						<div className="expert-message error">{error}</div>
					) : filteredIssues.length === 0 ? (
						<div className="expert-empty">
							<ClipboardList size={28} />
							<p>درخواستی با این مشخصات پیدا نشد.</p>
						</div>
					) : (
						<div className="expert-issue-list">
							{filteredIssues.map((issue) => (
								<article
									className={`expert-issue-card priority-${
										issue.final_priority ||
										getSuggestedPriority(issue.priority_score)
									}`}
									key={issue.id}
								>
									<div className="expert-issue-main">
										<div>
											<span className="expert-tracking-code">
												کد پیگیری: {issue.tracking_code}
											</span>
											<span
												className={`expert-priority-badge priority-${
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
											<p>ثبت‌کننده: {issue.student_name}</p>
										</div>

										<span className={`expert-status ${issue.status}`}>
											{getStatusLabel(issue.status)}
										</span>
									</div>

									<div className="expert-issue-meta">
										<span>{issue.department_name}</span>
										<span>{issue.location || "مکان ثبت نشده"}</span>
										<span>
											{new Date(issue.created_at).toLocaleDateString("fa-IR")}
										</span>
									</div>

									{!["resolved", "rejected"].includes(issue.status) && (
										<div className="expert-issue-actions">
											{issue.status === "assigned" && (
												<button
													onClick={() =>
														handleStatusChange(issue.id, "in_progress")
													}
													disabled={updatingId === issue.id}
												>
													شروع رسیدگی
												</button>
											)}

											{issue.status === "in_progress" && (
												<button
													onClick={() =>
														handleStatusChange(issue.id, "resolved")
													}
													disabled={updatingId === issue.id}
												>
													ثبت به‌عنوان حل‌شده
												</button>
											)}
										</div>
									)}

									<div className="expert-issue-actions">
										<button
											type="button"
											onClick={() => navigate(`/expert/issues/${issue.id}`)}
										>
											مشاهده جزئیات
										</button>
									</div>
								</article>
							))}
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}

export default ExpertIssues;


import { useEffect, useState } from "react";
import {
	ClipboardList,
	Clock,
	LoaderCircle,
	CheckCircle2,
	AlertCircle,
	PlayCircle,
	CheckCircle,
	Building2,
	ArrowLeft,
} from "lucide-react";

import DashboardLayout from "../components/layout/DashboardLayout";
import "./ExpertDashboard.css";
import { useNavigate } from "react-router-dom";
import universityImage from "../assets/university.jpg";
import API_BASE_URL from "../config";

function ExpertDashboard({ user, onLogout }) {
	const [issues, setIssues] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [updatingId, setUpdatingId] = useState(null);
	const [actionError, setActionError] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		const fetchIssues = async () => {
			try {
				const response = await fetch(
					`${API_BASE_URL}/api/issues/assigned`,
					{ credentials: "include" },
				);

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "دریافت درخواست‌ها ناموفق بود.");
				}

				setIssues(data.issues || []);
			} catch (err) {
				setError(err.message || "خطا در ارتباط با سرور.");
			} finally {
				setLoading(false);
			}
		};

		fetchIssues();
	}, []);

	const waitingIssues = issues.filter((issue) => issue.status === "assigned");

	const inProgressIssues = issues.filter(
		(issue) => issue.status === "in_progress",
	);

	const closedIssues = issues.filter((issue) =>
		["resolved", "rejected"].includes(issue.status),
	);

	const stats = [
		{
			title: "کل درخواست‌ها",
			value: issues.length,
			icon: ClipboardList,
			color: "blue",
		},
		{
			title: "در انتظار رسیدگی",
			value: waitingIssues.length,
			icon: Clock,
			color: "orange",
		},
		{
			title: "در حال رسیدگی",
			value: inProgressIssues.length,
			icon: LoaderCircle,
			color: "purple",
		},
		{
			title: "خاتمه‌یافته",
			value: closedIssues.length,
			icon: CheckCircle2,
			color: "green",
		},
	];

	const getStatusLabel = (status) => {
		const labels = {
			assigned: "در انتظار رسیدگی",
			in_progress: "در حال رسیدگی",
			resolved: "حل‌شده",
			rejected: "ردشده",
		};

		return labels[status] || status;
	};

	const formatDate = (date) =>
		new Intl.DateTimeFormat("fa-IR").format(new Date(date));
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

	const handleStatusChange = async (issueId, newStatus) => {
		try {
			setUpdatingId(issueId);
			setActionError("");

			const response = await fetch(
				`${API_BASE_URL}/api/issues/${issueId}/status`,
				{
					method: "PATCH",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status: newStatus }),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "تغییر وضعیت ناموفق بود.");
			}

			setIssues((currentIssues) =>
				currentIssues.map((issue) =>
					issue.id === issueId ? { ...issue, status: newStatus } : issue,
				),
			);
		} catch (err) {
			setActionError(err.message || "خطا در تغییر وضعیت.");
		} finally {
			setUpdatingId(null);
		}
	};

	const renderIssueList = (title, items, emptyMessage) => (
		<section
			className="expert-section"
			id={title === "درخواست‌های باز" ? "expert-open-issues" : undefined}
		>
			<div className="expert-section-header">
				<h2>{title}</h2>
				<span>{items.length} درخواست</span>
			</div>

			{items.length === 0 ? (
				<div className="expert-empty">
					<ClipboardList size={28} />
					<p>{emptyMessage}</p>
				</div>
			) : (
				<div className="expert-issue-list">
					{[...items]
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

							return new Date(b.created_at) - new Date(a.created_at);
						})
						.map((issue) => (
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
									<span>{formatDate(issue.created_at)}</span>
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
												<PlayCircle size={16} />
												شروع رسیدگی
											</button>
										)}

										{issue.status === "in_progress" && (
											<button
												onClick={() => handleStatusChange(issue.id, "resolved")}
												disabled={updatingId === issue.id}
											>
												<CheckCircle size={16} />
												ثبت به‌عنوان حل‌شده
											</button>
										)}

										{updatingId === issue.id && (
											<span>در حال ثبت تغییرات...</span>
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
		</section>
	);

	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="dashboard">
			<div className="expert-dashboard" dir="rtl">
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

						<h1>خوش آمدید، {user?.full_name || "کارشناس"}</h1>

						<p>
							به پنل کارشناس رسیدگی سامانه دانش‌یار خوش آمدید. از این بخش
							می‌توانید درخواست‌های ارجاع‌شده را مدیریت و روند رسیدگی به مشکلات
							دانشگاه را پیگیری کنید.
						</p>

						<button
							type="button"
							className="welcome-button"
							onClick={() =>
								document.getElementById("expert-open-issues")?.scrollIntoView({
									behavior: "smooth",
									block: "start",
								})
							}
						>
							مشاهده درخواست‌ها
							<ArrowLeft size={16} />
						</button>
					</div>
				</div>

				<div className="expert-stats">
					{stats.map((stat) => {
						const Icon = stat.icon;

						return (
							<div className="expert-stat-card" key={stat.title}>
								<div className={`expert-stat-icon ${stat.color}`}>
									<Icon size={22} />
								</div>
								<div>
									<span>{stat.title}</span>
									<strong>{stat.value}</strong>
								</div>
							</div>
						);
					})}
				</div>
				{actionError && (
					<div className="expert-message error">
						<AlertCircle size={20} />
						{actionError}
					</div>
				)}
				{loading ? (
					<div className="expert-message">
						<LoaderCircle className="expert-spinner" size={24} />
						در حال دریافت درخواست‌ها...
					</div>
				) : error ? (
					<div className="expert-message error">
						<AlertCircle size={22} />
						{error}
					</div>
				) : (
					<>
						{renderIssueList(
							"درخواست‌های باز",
							[...waitingIssues, ...inProgressIssues],
							"در حال حاضر درخواست بازی برای شما وجود ندارد.",
						)}

						{renderIssueList(
							"درخواست‌های خاتمه‌یافته",
							closedIssues,
							"هنوز درخواستی را خاتمه نداده‌اید.",
						)}
					</>
				)}
			</div>
		</DashboardLayout>
	);
}

export default ExpertDashboard;

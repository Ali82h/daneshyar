import { useEffect, useState } from "react";
import {
	BarChart3,
	CheckCircle,
	Clock,
	ClipboardList,
	RefreshCw,
} from "lucide-react";

import DashboardLayout from "../components/layout/DashboardLayout";
import "./ExpertReports.css";
import API_BASE_URL from "../config";
function ExpertReports({ user, onLogout }) {
	const [issues, setIssues] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchIssues();
	}, []);

	const fetchIssues = async () => {
		try {
			setLoading(true);
			setError("");

			const response = await fetch(
				`${API_BASE_URL}/api/issues/assigned`,
				{
					credentials: "include",
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "دریافت اطلاعات ناموفق بود.");
			}

			setIssues(Array.isArray(data) ? data : data.issues || []);
		} catch (err) {
			setError(err.message || "خطا در دریافت اطلاعات");
		} finally {
			setLoading(false);
		}
	};
	const totalIssues = issues.length;

	const resolvedIssues = issues.filter(
		(issue) => issue.status === "resolved",
	).length;

	const activeIssues = issues.filter((issue) =>
		["assigned", "in_progress"].includes(issue.status),
	).length;

	const resolutionTimes = issues
		.filter(
			(issue) =>
				issue.status === "resolved" && issue.resolved_at && issue.assigned_at,
		)
		.map((issue) => {
			const start = new Date(issue.assigned_at).getTime();
			const end = new Date(issue.resolved_at).getTime();

			return (end - start) / (1000 * 60 * 60);
		})
		.filter((hours) => hours >= 0);

	const averageResolutionTime =
		resolutionTimes.length > 0
			? (
					resolutionTimes.reduce((sum, hours) => sum + hours, 0) /
					resolutionTimes.length
				).toFixed(1)
			: null;
	const monthlyResolvedIssues = Array.from({ length: 6 }, (_, index) => {
		const date = new Date();
		date.setDate(1);
		date.setMonth(date.getMonth() - (5 - index));

		const year = date.getFullYear();
		const month = date.getMonth();

		const count = issues.filter((issue) => {
			if (issue.status !== "resolved" || !issue.resolved_at) {
				return false;
			}

			const resolvedDate = new Date(issue.resolved_at);

			return (
				resolvedDate.getFullYear() === year && resolvedDate.getMonth() === month
			);
		}).length;

		return {
			label: date.toLocaleDateString("fa-IR", { month: "long" }),
			count,
		};
	});

	const maxMonthlyCount = Math.max(
		...monthlyResolvedIssues.map((item) => item.count),
		1,
	);
	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="reports">
			<div className="expert-reports-page">
				<div className="reports-header">
					<div>
						<span>پنل کارشناس</span>
						<h1>آمار و گزارش‌ها</h1>
						<p>گزارش عملکرد و وضعیت درخواست‌های ارجاع‌شده به شما</p>
					</div>

					<button
						className="reports-refresh-button"
						onClick={fetchIssues}
						disabled={loading}
					>
						<RefreshCw size={16} />
						به‌روزرسانی
					</button>
				</div>

				{loading ? (
					<p>در حال دریافت اطلاعات...</p>
				) : error ? (
					<p>{error}</p>
				) : (
					<div className="expert-reports-stats">
						<div className="expert-report-stat-card">
							<div className="expert-report-stat-icon blue">
								<ClipboardList size={22} />
							</div>
							<div>
								<span>کل درخواست‌های ارجاع‌شده</span>
								<strong>{totalIssues}</strong>
							</div>
						</div>

						<div className="expert-report-stat-card">
							<div className="expert-report-stat-icon green">
								<CheckCircle size={22} />
							</div>
							<div>
								<span>درخواست‌های حل‌شده</span>
								<strong>{resolvedIssues}</strong>
							</div>
						</div>

						<div className="expert-report-stat-card">
							<div className="expert-report-stat-icon orange">
								<Clock size={22} />
							</div>
							<div>
								<span>درخواست‌های فعال</span>
								<strong>{activeIssues}</strong>
							</div>
						</div>

						<div className="expert-report-stat-card">
							<div className="expert-report-stat-icon purple">
								<BarChart3 size={22} />
							</div>
							<div>
								<span>میانگین زمان رسیدگی</span>
								<strong>
									{averageResolutionTime !== null
										? `${averageResolutionTime} ساعت`
										: "—"}
								</strong>
							</div>
						</div>
					</div>
				)}
				{!loading && !error && (
					<div className="expert-report-chart-section">
						<div className="expert-report-chart-section">
							<div className="expert-report-section-header">
								<div>
									<h2>روند درخواست‌های حل‌شده</h2>
									<p>تعداد درخواست‌های تکمیل‌شده در شش ماه اخیر</p>
								</div>
							</div>

							<div className="expert-report-chart">
								{monthlyResolvedIssues.map((item, index) => (
									<div className="expert-report-chart-column" key={index}>
										<span className="expert-report-chart-count">
											{item.count}
										</span>

										<div className="expert-report-chart-bar-wrapper">
											<div
												className="expert-report-chart-bar"
												style={{
													height: `${(item.count / maxMonthlyCount) * 100}%`,
												}}
											/>
										</div>

										<span className="expert-report-chart-label">
											{item.label}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}

export default ExpertReports;

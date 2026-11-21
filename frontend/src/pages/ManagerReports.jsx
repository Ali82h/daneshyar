
import { useEffect, useState } from "react";
import {
	ClipboardList,
	Clock3,
	CheckCircle2,
	AlertCircle,
	XCircle,
	Building2,
	Users,
	TrendingUp,
	AlertTriangle,
	RefreshCw,
} from "lucide-react";

import DashboardLayout from "../components/layout/DashboardLayout";
import API_BASE_URL from "../config";
import "./ManagerReports.css";

function ManagerReports({ user, onLogout }) {
	const [report, setReport] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const statusLabels = {
		submitted: "ثبت‌شده",
		assigned: "ارجاع‌شده",
		in_progress: "در حال رسیدگی",
		resolved: "حل‌شده",
		rejected: "ردشده",
	};

	const statusIcons = {
		submitted: ClipboardList,
		assigned: Users,
		in_progress: TrendingUp,
		resolved: CheckCircle2,
		rejected: XCircle,
	};

	const statusCounts = Object.keys(statusLabels).map((status) => ({
		status,
		label: statusLabels[status],
		count: Number(
			report?.statuses?.find((item) => item.status === status)?.count || 0,
		),
		Icon: statusIcons[status],
	}));

	const monthlyData = Array.from({ length: 6 }, (_, index) => {
		const date = new Date();
		date.setDate(1);
		date.setMonth(date.getMonth() - (5 - index));

		const monthKey = `${date.getFullYear()}-${String(
			date.getMonth() + 1,
		).padStart(2, "0")}`;

		const item = report?.monthlyTrend?.find(
			(entry) => entry.month === monthKey,
		);

		return {
			month: date.toLocaleDateString("fa-IR", {
				month: "short",
			}),
			total: Number(item?.total || 0),
		};
	});

	const maxMonthlyTotal = Math.max(...monthlyData.map((item) => item.total), 1);

	async function fetchReports() {
		try {
			setLoading(true);
			setError("");

			const response = await fetch(`${API_BASE_URL}/api/issues/reports`, {
				credentials: "include",
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "دریافت گزارش‌ها ناموفق بود.");
			}

			setReport(data);
		} catch (err) {
			setError(err.message || "خطا در ارتباط با سرور");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchReports();
	}, []);

	const averageHours =
		report?.summary?.avg_resolution_hours == null
			? null
			: Number(report.summary.avg_resolution_hours);

	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="reports">
			<section className="manager-reports">
				<div className="reports-header">
					<div>
						<span>پنل مدیریت</span>
						<h1>گزارش‌ها و آمار</h1>
						<p>نمای کلی عملکرد سامانه و وضعیت درخواست‌های ثبت‌شده</p>
					</div>

					<button
						type="button"
						className="reports-refresh-button"
						onClick={fetchReports}
						disabled={loading}
					>
						<RefreshCw size={17} />
						بروزرسانی
					</button>
				</div>

				{loading ? (
					<div className="reports-state">در حال دریافت اطلاعات...</div>
				) : error ? (
					<div className="reports-state error">{error}</div>
				) : report ? (
					<>
						<div className="statistics-grid">
							{[
								{
									title: "کل درخواست‌ها",
									value: Number(report?.summary?.total || 0),
									description: "تمام مشکلات ثبت‌شده",
									icon: ClipboardList,
									color: "blue",
								},
								{
									title: "در انتظار ارجاع",
									value: Number(report?.summary?.submitted || 0),
									description: "درخواست‌های ثبت‌شده و ارجاع‌نشده",
									icon: Clock3,
									color: "orange",
								},
								{
									title: "در حال رسیدگی",
									value:
										Number(report?.summary?.assigned || 0) +
										Number(report?.summary?.in_progress || 0),
									description: "درخواست‌های ارجاع‌شده و در حال انجام",
									icon: AlertTriangle,
									color: "red",
								},
								{
									title: "حل‌شده",
									value: Number(report?.summary?.resolved || 0),
									description: "درخواست‌های تکمیل‌شده",
									icon: CheckCircle2,
									color: "green",
								},
								{
									title: "ردشده",
									value: Number(report?.summary?.rejected || 0),
									description: "درخواست‌های ردشده توسط مدیر",
									icon: XCircle,
									color: "red",
								},
							].map((stat) => {
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

						<section className="reports-section">
							<div className="reports-section-header">
								<div>
									<h2>وضعیت درخواست‌ها</h2>
									<p>توزیع درخواست‌های ثبت‌شده بر اساس وضعیت فعلی</p>
								</div>
							</div>

							<div className="reports-status-grid">
								{statusCounts.map(({ status, label, count, Icon }) => (
									<div className="reports-status-card" key={status}>
										<div className={`reports-status-icon ${status}`}>
											<Icon size={20} />
										</div>

										<div className="reports-status-info">
											<span>{label}</span>
											<strong>{count.toLocaleString("fa-IR")}</strong>
										</div>

										<div className="reports-status-progress">
											<div
												style={{
													width: `${
														Number(report.summary.total) > 0
															? (count / Number(report.summary.total)) * 100
															: 0
													}%`,
												}}
											/>
										</div>
									</div>
								))}
							</div>
						</section>

						<section className="reports-section">
							<div className="reports-section-header">
								<div>
									<h2>عملکرد واحدهای دانشگاهی</h2>
									<p>توزیع درخواست‌ها بر اساس واحد ارجاع‌شده</p>
								</div>
								<Building2 size={21} />
							</div>

							<div className="reports-departments">
								{report.departments.map((department) => {
									const total = Number(department.total);
									const maxTotal = Math.max(
										...report.departments.map((item) => Number(item.total)),
										1,
									);

									return (
										<div className="reports-department-row" key={department.id}>
											<div className="reports-department-info">
												<strong>{department.department_name}</strong>
												<span>{total.toLocaleString("fa-IR")} درخواست</span>
											</div>

											<div className="reports-department-progress">
												<div
													style={{
														width: `${(total / maxTotal) * 100}%`,
													}}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</section>

						<section className="reports-section">
							<div className="reports-section-header">
								<div>
									<h2>عملکرد کارشناسان</h2>
									<p>آمار درخواست‌های ارجاع‌شده به هر کارشناس</p>
								</div>
								<Users size={21} />
							</div>

							<div className="reports-experts-table-wrapper">
								<table className="reports-experts-table">
									<thead>
										<tr>
											<th>نام کارشناس</th>
											<th>کل ارجاعات</th>
											<th>حل‌شده</th>
											<th>در حال رسیدگی</th>
										</tr>
									</thead>

									<tbody>
										{report.experts.length > 0 ? (
											report.experts.map((expert) => (
												<tr key={expert.id}>
													<td>{expert.expert_name}</td>
													<td>
														{Number(expert.total_assigned).toLocaleString(
															"fa-IR",
														)}
													</td>
													<td>
														<span className="reports-expert-resolved">
															{Number(expert.resolved).toLocaleString("fa-IR")}
														</span>
													</td>
													<td>
														{Number(expert.in_progress).toLocaleString("fa-IR")}
													</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan="4" className="reports-empty-cell">
													هنوز اطلاعاتی برای کارشناسان ثبت نشده است.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</section>

						<section className="reports-section">
							<div className="reports-section-header">
								<div>
									<h2>روند ثبت درخواست‌ها</h2>
									<p>تعداد درخواست‌های ثبت‌شده در شش ماه اخیر</p>
								</div>
								<TrendingUp size={21} />
							</div>

							<div className="expert-report-chart">
								{monthlyData.map((item, index) => (
									<div className="expert-report-chart-column" key={index}>
										<span className="expert-report-chart-count">
											{item.total.toLocaleString("fa-IR")}
										</span>

										<div className="expert-report-chart-bar-wrapper">
											<div
												className="expert-report-chart-bar"
												style={{
													height: `${(item.total / maxMonthlyTotal) * 100}%`,
												}}
											/>
										</div>

										<span className="expert-report-chart-label">
											{item.month}
										</span>
									</div>
								))}
							</div>
						</section>
					</>
				) : null}
			</section>
		</DashboardLayout>
	);
}

export default ManagerReports;

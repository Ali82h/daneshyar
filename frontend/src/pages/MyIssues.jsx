import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import {
	Plus,
	ClipboardList,
	Clock3,
	CheckCircle2,
	AlertCircle,
} from "lucide-react";

import DashboardLayout from "../components/layout/DashboardLayout";
import "./MyIssues.css";

function MyIssues({ user }) {
	const navigate = useNavigate();

	const [issues, setIssues] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchIssues = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/issues/my`, {
					credentials: "include",
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "دریافت درخواست‌ها ناموفق بود.");
				}

				setIssues(data.issues || []);
			} catch (error) {
				console.error("Fetch issues error:", error);
				setError(error.message);
			} finally {
				setLoading(false);
			}
		};

		fetchIssues();
	}, []);

	const getStatus = (status) => {
		const statuses = {
			submitted: { label: "ثبت‌شده", type: "review" },
			assigned: { label: "ارجاع‌شده", type: "progress" },
			in_progress: { label: "در حال رسیدگی", type: "progress" },
			resolved: { label: "حل‌شده", type: "resolved" },
			rejected: { label: "ردشده", type: "rejected" },
		};

		return statuses[status] || { label: status, type: "review" };
	};

	const formatDate = (date) =>
		new Intl.DateTimeFormat("fa-IR").format(new Date(date));

	const resolvedCount = issues.filter(
		(issue) => issue.status === "resolved",
	).length;

	const pendingCount = issues.filter((issue) =>
		["submitted", "assigned", "in_progress"].includes(issue.status),
	).length;

	const rejectedCount = issues.filter(
		(issue) => issue.status === "rejected",
	).length;

	const handleLogout = async () => {
		try {
			await fetch(`${API_BASE_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			navigate("/login", { replace: true });
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	return (
		<DashboardLayout user={user} onLogout={handleLogout} activeItem="issues">
			<div className="my-issues-page" dir="rtl">
				<div className="my-issues-heading">
					<div>
						<span>پنل دانشجو</span>
						<h1>مشکلات من</h1>
						<p>تمام درخواست‌هایی که ثبت کرده‌اید را اینجا پیگیری کنید.</p>
					</div>

					<button
						className="my-issues-create-btn"
						onClick={() => navigate("/student/issues/create")}
					>
						<Plus size={19} />
						ثبت مشکل جدید
					</button>
				</div>

				<div className="my-issues-stats">
					<div className="my-issues-stat-card">
						<div className="my-issues-stat-icon total">
							<ClipboardList size={22} />
						</div>
						<div>
							<span>کل درخواست‌ها</span>
							<strong>{issues.length}</strong>
						</div>
					</div>

					<div className="my-issues-stat-card">
						<div className="my-issues-stat-icon pending">
							<Clock3 size={22} />
						</div>
						<div>
							<span>در انتظار رسیدگی</span>
							<strong>{pendingCount}</strong>
						</div>
					</div>

					<div className="my-issues-stat-card">
						<div className="my-issues-stat-icon resolved">
							<CheckCircle2 size={22} />
						</div>
						<div>
							<span>حل‌شده</span>
							<strong>{resolvedCount}</strong>
						</div>
					</div>

					<div className="my-issues-stat-card">
						<div className="my-issues-stat-icon rejected">
							<AlertCircle size={22} />
						</div>
						<div>
							<span>ردشده</span>
							<strong>{rejectedCount}</strong>
						</div>
					</div>
				</div>

				<div className="my-issues-table-card">
					<div className="my-issues-table-heading">
						<div>
							<h2>فهرست درخواست‌ها</h2>
							<p>وضعیت و اطلاعات درخواست‌های ثبت‌شده</p>
						</div>

						<span className="my-issues-count">{issues.length} درخواست</span>
					</div>

					{loading ? (
						<div className="my-issues-message">در حال دریافت درخواست‌ها...</div>
					) : error ? (
						<div className="my-issues-message error">{error}</div>
					) : issues.length === 0 ? (
						<div className="my-issues-empty">
							<ClipboardList size={38} />
							<h3>هنوز درخواستی ثبت نکرده‌اید</h3>
							<p>می‌توانید اولین مشکل دانشگاه را ثبت کنید.</p>
							<button onClick={() => navigate("/student/issues/create")}>
								ثبت مشکل جدید
							</button>
						</div>
					) : (
						<div className="my-issues-table-wrapper">
							<table className="my-issues-table">
								<thead>
									<tr>
										<th>عنوان مشکل</th>
										<th>کد پیگیری</th>
										<th>دسته‌بندی</th>
										<th>تاریخ ثبت</th>
										<th>وضعیت</th>
										<th>عملیات</th>
									</tr>
								</thead>

								<tbody>
									{issues.map((issue) => {
										const status = getStatus(issue.status);

										return (
											<tr key={issue.id}>
												<td className="issue-title-cell">{issue.title}</td>
												<td className="issue-code-cell">
													{issue.tracking_code}
												</td>
												<td>{issue.category}</td>
												<td>{formatDate(issue.created_at)}</td>
												<td>
													<span className={`my-issue-status ${status.type}`}>
														{status.label}
													</span>
												</td>
												<td>
													<button
														className="my-issue-details-btn"
														onClick={() =>
															navigate(`/student/issues/${issue.id}`)
														}
													>
														مشاهده جزئیات
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}

export default MyIssues;

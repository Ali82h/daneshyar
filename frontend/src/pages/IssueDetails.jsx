
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	ArrowRight,
	MapPin,
	CalendarDays,
	Hash,
	Paperclip,
	Clock3,
	FileText,
	Download,
	Eye,
	MessageCircle,
	Send,
	X,
} from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API_BASE_URL from "../config";
import "./IssueDetails.css";

function IssueDetails({ user, onLogout }) {
	const { id } = useParams();
	const navigate = useNavigate();

	const [issue, setIssue] = useState(null);
	const [history, setHistory] = useState([]);
	const [attachments, setAttachments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [messages, setMessages] = useState([]);
	const [messageText, setMessageText] = useState("");
	const [messagesLoading, setMessagesLoading] = useState(true);
	const [sendingMessage, setSendingMessage] = useState(false);
	const [messagesError, setMessagesError] = useState("");
	const [updatingStatus, setUpdatingStatus] = useState(false);
	const [statusError, setStatusError] = useState("");

	// Manager assignment states
	const [departments, setDepartments] = useState([]);
	const [experts, setExperts] = useState([]);
	const [departmentId, setDepartmentId] = useState("");
	const [expertId, setExpertId] = useState("");
	const [showAssignModal, setShowAssignModal] = useState(false);
	const [expertsLoading, setExpertsLoading] = useState(false);
	const [assigning, setAssigning] = useState(false);
	const [assignError, setAssignError] = useState("");

	// Manager rejection states
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [rejecting, setRejecting] = useState(false);
	const [rejectError, setRejectError] = useState("");
	const [managerSuccess, setManagerSuccess] = useState("");
	const [selectedPriority, setSelectedPriority] = useState("");

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

	const fetchIssueDetails = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/issues/${id}`, {
				credentials: "include",
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "دریافت جزئیات درخواست ناموفق بود.");
			}

			setIssue(data.issue);
			setSelectedPriority(
				data.issue.final_priority ||
					getSuggestedPriority(data.issue.priority_score),
			);
			setHistory(data.history || []);
			setAttachments(data.attachments || []);
		} catch (error) {
			console.error("Fetch issue details error:", error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchIssueDetails();
	}, [id]);

	useEffect(() => {
		const fetchMessages = async () => {
			try {
				setMessagesLoading(true);
				setMessagesError("");

				const response = await fetch(
					`${API_BASE_URL}/api/issues/${id}/messages`,
					{ credentials: "include" },
				);

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "دریافت پیام‌ها ناموفق بود.");
				}

				setMessages(data.messages || []);
			} catch (error) {
				setMessagesError(error.message);
			} finally {
				setMessagesLoading(false);
			}
		};

		fetchMessages();
	}, [id]);

	useEffect(() => {
		if (user.role !== "manager") return;

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

		fetchDepartments();
	}, [user.role]);

	useEffect(() => {
		if (!departmentId || !showAssignModal) {
			setExperts([]);
			setExpertId("");
			return;
		}

		async function fetchExperts() {
			try {
				setExpertsLoading(true);
				setExperts([]);
				setExpertId("");
				setAssignError("");

				const response = await fetch(
					`${API_BASE_URL}/api/users/departments/${departmentId}/experts`,
					{ credentials: "include" },
				);

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "دریافت کارشناسان ناموفق بود.");
				}

				setExperts(data.experts || []);
			} catch (err) {
				setAssignError(err.message || "خطا در دریافت کارشناسان");
			} finally {
				setExpertsLoading(false);
			}
		}

		fetchExperts();
	}, [departmentId, showAssignModal]);

	const statusLabels = {
		submitted: "ثبت‌شده",
		assigned: "ارجاع‌شده",
		in_progress: "در حال رسیدگی",
		resolved: "حل‌شده",
		rejected: "ردشده",
	};

	const formatDate = (date) => {
		if (!date) return "—";

		return new Intl.DateTimeFormat("fa-IR", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(date));
	};

	const statusSteps = [
		{ key: "submitted", label: "ثبت درخواست" },
		{ key: "assigned", label: "ارجاع به واحد مربوطه" },
		{ key: "in_progress", label: "در حال رسیدگی" },
		{ key: "resolved", label: "پایان رسیدگی" },
	];

	const currentStep = statusSteps.findIndex(
		(step) => step.key === issue?.status,
	);

	const handleSendMessage = async (e) => {
		e.preventDefault();

		const text = messageText.trim();

		if (!text || sendingMessage) return;

		try {
			setSendingMessage(true);
			setMessagesError("");

			const response = await fetch(
				`${API_BASE_URL}/api/issues/${id}/messages`,
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ message: text }),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "ارسال پیام ناموفق بود.");
			}

			setMessages((previous) => [...previous, data.data]);
			setMessageText("");
		} catch (error) {
			setMessagesError(error.message);
		} finally {
			setSendingMessage(false);
		}
	};

	const handleStatusChange = async (newStatus) => {
		if (updatingStatus) return;

		try {
			setUpdatingStatus(true);
			setStatusError("");

			const response = await fetch(
				`${API_BASE_URL}/api/issues/${id}/status`,
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
				throw new Error(data.message || "تغییر وضعیت درخواست ناموفق بود.");
			}

			const detailsResponse = await fetch(
				`${API_BASE_URL}/api/issues/${id}`,
				{ credentials: "include" },
			);

			const detailsData = await detailsResponse.json();

			if (!detailsResponse.ok) {
				throw new Error("وضعیت تغییر کرد، اما دریافت اطلاعات جدید ناموفق بود.");
			}

			setIssue(detailsData.issue);
			setHistory(detailsData.history || []);
			setAttachments(detailsData.attachments || []);
		} catch (error) {
			setStatusError(error.message);
		} finally {
			setUpdatingStatus(false);
		}
	};

	async function handleAssign() {
		if (!departmentId || !expertId) {
			setAssignError("لطفاً واحد و کارشناس را انتخاب کنید.");
			return;
		}

		try {
			setAssigning(true);
			setAssignError("");

			const response = await fetch(
				`${API_BASE_URL}/api/issues/${id}/assign`,
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

			setManagerSuccess("درخواست با موفقیت به کارشناس ارجاع داده شد.");
			setShowAssignModal(false);
			setDepartmentId("");
			setExpertId("");
			setExperts([]);

			await fetchIssueDetails();
		} catch (err) {
			setAssignError(err.message || "خطا در ارجاع درخواست");
		} finally {
			setAssigning(false);
		}
	}

	async function handleReject() {
		if (!rejectionReason.trim()) {
			setRejectError("لطفاً دلیل رد درخواست را وارد کنید.");
			return;
		}

		if (rejectionReason.trim().length > 1000) {
			setRejectError("دلیل رد درخواست نباید بیشتر از ۱۰۰۰ کاراکتر باشد.");
			return;
		}

		try {
			setRejecting(true);
			setRejectError("");

			const response = await fetch(
				`${API_BASE_URL}/api/issues/${id}/reject`,
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

			setManagerSuccess("درخواست با موفقیت رد شد.");
			setShowRejectModal(false);
			setRejectionReason("");

			await fetchIssueDetails();
		} catch (err) {
			setRejectError(err.message || "خطا در رد درخواست");
		} finally {
			setRejecting(false);
		}
	}

	const getSenderLabel = (message) => {
		if (message.sender_role === "expert") {
			return message.sender_department
				? `کارشناس ${message.sender_department}`
				: "کارشناس";
		}

		const roleLabels = {
			student: "دانشجو",
			manager: "مدیر",
		};

		return roleLabels[message.sender_role] || "کاربر";
	};

	return (
		<DashboardLayout user={user} onLogout={onLogout} activeItem="dashboard">
			{" "}
			<div className="issue-details-page" dir="rtl">
				<div className="issue-details-heading">
					<div>
						<button
							className="issue-back-button"
							onClick={() =>
								navigate(
									user.role === "manager"
										? "/manager/dashboard"
										: user.role === "expert"
											? "/expert/issues"
											: "/student/issues",
								)
							}
						>
							<ArrowRight size={18} />
							{user.role === "manager"
								? "بازگشت به داشبورد مدیریت"
								: user.role === "expert"
									? "بازگشت به داشبورد کارشناس"
									: "بازگشت به مشکلات من"}
						</button>
						<span>
							{user.role === "manager"
								? "پنل مدیریت"
								: user.role === "expert"
									? "پنل کارشناس"
									: "پنل دانشجو"}
						</span>
						<h1>جزئیات درخواست</h1>
						<p>مشاهده اطلاعات و روند پیگیری درخواست ثبت‌شده</p>
					</div>
				</div>

				{loading && (
					<div className="issue-details-state">در حال دریافت اطلاعات...</div>
				)}

				{error && <div className="issue-details-state error">{error}</div>}

				{!loading && issue && (
					<>
						<section className="issue-details-summary">
							<div className="issue-summary-main">
								<span className="issue-summary-label">درخواست ثبت‌شده</span>

								<h2>{issue.title}</h2>

								<div className="issue-tracking-code">
									<Hash size={16} />
									کد پیگیری: {issue.tracking_code}
								</div>
							</div>

							<span className={`issue-status status-${issue.status}`}>
								{statusLabels[issue.status] || issue.status}
							</span>

							{user.role === "expert" && (
								<div className="issue-status-actions">
									{issue.status === "assigned" && (
										<button
											onClick={() => handleStatusChange("in_progress")}
											disabled={updatingStatus}
										>
											{updatingStatus ? "در حال انجام..." : "شروع رسیدگی"}
										</button>
									)}

									{issue.status === "in_progress" && (
										<button
											onClick={() => handleStatusChange("resolved")}
											disabled={updatingStatus}
										>
											{updatingStatus
												? "در حال انجام..."
												: "ثبت به‌عنوان حل‌شده"}
										</button>
									)}
								</div>
							)}

							{user.role === "manager" && issue.status === "submitted" && (
								<div className="issue-status-actions manager-detail-actions">
									<button
										type="button"
										onClick={() => {
											setManagerSuccess("");
											setAssignError("");
											setDepartmentId(
												issue.suggested_department_id
													? String(issue.suggested_department_id)
													: "",
											);
											setExpertId("");
											setSelectedPriority(
												issue.final_priority ||
													getSuggestedPriority(issue.priority_score),
											);
											setShowAssignModal(true);
										}}
									>
										ارجاع درخواست
									</button>

									<button
										type="button"
										className="manager-detail-reject-button"
										onClick={() => {
											setManagerSuccess("");
											setRejectError("");
											setRejectionReason("");
											setShowRejectModal(true);
										}}
									>
										رد درخواست
									</button>
								</div>
							)}

							{managerSuccess && (
								<p className="manager-detail-success">{managerSuccess}</p>
							)}
							{statusError && (
								<p className="issue-status-error">{statusError}</p>
							)}
						</section>

						<div className="issue-details-grid">
							<section className="issue-details-card issue-information">
								<div className="issue-card-heading">
									<FileText size={20} />
									<h3>اطلاعات درخواست</h3>
								</div>

								<div className="issue-info-grid">
									<div className="issue-info-item">
										<span>دسته‌بندی</span>
										<strong>{issue.category}</strong>
									</div>

									<div className="issue-info-item">
										<span>
											<MapPin size={15} />
											مکان
										</span>
										<strong>{issue.location || "—"}</strong>
									</div>

									<div className="issue-info-item">
										<span>
											<CalendarDays size={15} />
											تاریخ ثبت
										</span>
										<strong>{formatDate(issue.created_at)}</strong>
									</div>

									<div className="issue-info-item">
										<span>
											<Clock3 size={15} />
											آخرین به‌روزرسانی
										</span>
										<strong>{formatDate(issue.updated_at)}</strong>
									</div>
								</div>

								<div className="issue-priority-info">
									<div className="issue-info-item">
										<span>میزان تأثیر مشکل</span>
										<strong>
											{{
												low: "محدود",
												medium: "متوسط",
												high: "گسترده",
											}[issue.impact] || "—"}
										</strong>
									</div>

									<div className="issue-info-item">
										<span>اولویت پیشنهادی سیستم</span>
										<strong
											className={`issue-priority-value priority-${getSuggestedPriority(
												issue.priority_score,
											)}`}
										>
											{
												priorityLabels[
													getSuggestedPriority(issue.priority_score)
												]
											}
										</strong>
									</div>

									<div className="issue-info-item">
										<span>اولویت نهایی</span>
										<strong
											className={
												issue.final_priority
													? `issue-priority-value priority-${issue.final_priority}`
													: ""
											}
										>
											{issue.final_priority
												? priorityLabels[issue.final_priority]
												: "هنوز توسط مدیر تعیین نشده"}
										</strong>
									</div>
								</div>

								<div className="issue-description">
									<h4>شرح مشکل</h4>
									<p>{issue.description}</p>
								</div>
							</section>

							<section className="issue-details-card issue-progress-card">
								<div className="issue-card-heading">
									<Clock3 size={20} />
									<h3>روند پیگیری</h3>
								</div>

								{issue.status === "rejected" ? (
									<p className="issue-rejected-message">
										این درخواست رد شده است.
									</p>
								) : (
									<div className="issue-progress-list">
										{statusSteps.map((step, index) => {
											const completed =
												currentStep >= 0 && index <= currentStep;

											return (
												<div
													className={`issue-progress-step ${
														completed ? "completed" : ""
													}`}
													key={step.key}
												>
													<div className="issue-step-marker">
														{completed ? "✓" : index + 1}
													</div>

													<span>{step.label}</span>
												</div>
											);
										})}
									</div>
								)}
							</section>
						</div>

						<section className="issue-details-card issue-history-card">
							<div className="issue-card-heading">
								<Clock3 size={20} />
								<h3>سوابق درخواست</h3>
							</div>

							{history.length === 0 ? (
								<p className="issue-empty-message">
									هنوز سابقه‌ای برای این درخواست ثبت نشده است.
								</p>
							) : (
								<div className="issue-history-list">
									{history.map((item) => (
										<div className="issue-history-item" key={item.id}>
											<div className="issue-history-dot" />

											<div>
												<strong>
													{item.new_status
														? statusLabels[item.new_status] || item.new_status
														: "ثبت رویداد"}
												</strong>

												{item.description && <p>{item.description}</p>}

												<span>{formatDate(item.created_at)}</span>
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						<section className="issue-details-card issue-attachments-card">
							<div className="issue-card-heading">
								<Paperclip size={20} />
								<h3>فایل‌های پیوست</h3>
								<span>{attachments.length} فایل</span>
							</div>

							{attachments.length === 0 ? (
								<p className="issue-empty-message">
									فایلی برای این درخواست پیوست نشده است.
								</p>
							) : (
								<div className="issue-attachments-list">
									{attachments.map((file) => {
										const fileUrl = `${API_BASE_URL}/api/issues/${id}/attachments/${file.id}`;

										return (
											<div className="issue-attachment-item" key={file.id}>
												<FileText size={21} />

												<div className="issue-attachment-info">
													<strong>{file.original_name}</strong>
													<span>
														{(Number(file.file_size) / 1024).toFixed(1)}{" "}
														کیلوبایت
													</span>
												</div>

												<div className="issue-attachment-actions">
													<a
														href={fileUrl}
														target="_blank"
														rel="noreferrer"
														title="مشاهده فایل"
													>
														<Eye size={17} />
														مشاهده
													</a>

													<a
														href={`${fileUrl}?download=1`}
														title="دانلود فایل"
													>
														<Download size={17} />
														دانلود
													</a>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</section>

						<section className="issue-details-card issue-messages-card">
							<div className="issue-card-heading">
								<MessageCircle size={20} />
								<h3>گفت‌وگو درباره درخواست</h3>
								<span>{messages.length} پیام</span>
							</div>

							{messagesLoading ? (
								<p className="issue-empty-message">در حال دریافت پیام‌ها...</p>
							) : messages.length === 0 ? (
								<p className="issue-empty-message">
									هنوز پیامی برای این درخواست ثبت نشده است.
								</p>
							) : (
								<div className="issue-messages-list">
									{messages.map((message) => {
										const isMine =
											String(message.sender_id) === String(user.id);

										return (
											<div
												className={`issue-message-item ${
													isMine ? "mine" : "theirs"
												}`}
												key={message.id}
											>
												<div className="issue-message-meta">
													<strong>
														{message.sender_name} ({getSenderLabel(message)})
													</strong>
													<span>{formatDate(message.created_at)}</span>
												</div>

												<p>{message.message}</p>
											</div>
										);
									})}
								</div>
							)}

							<form className="issue-message-form" onSubmit={handleSendMessage}>
								<textarea
									value={messageText}
									onChange={(e) => setMessageText(e.target.value)}
									placeholder="پیام خود را بنویسید..."
									maxLength={3000}
									rows={3}
								/>

								{messagesError && (
									<p className="issue-message-error">{messagesError}</p>
								)}

								<button
									type="submit"
									disabled={!messageText.trim() || sendingMessage}
								>
									<Send size={17} />
									{sendingMessage ? "در حال ارسال..." : "ارسال پیام"}
								</button>
							</form>
						</section>
					</>
				)}
			</div>

			{showAssignModal && (
				<div
					className="manager-modal-overlay"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget && !assigning) {
							setShowAssignModal(false);
						}
					}}
				>
					<div className="manager-modal" role="dialog" aria-modal="true">
						<div className="manager-modal-header">
							<div>
								<h2>ارجاع درخواست</h2>
								<p>انتخاب واحد دانشگاهی و کارشناس مسئول</p>
							</div>

							<button
								type="button"
								className="manager-modal-close"
								onClick={() => setShowAssignModal(false)}
								disabled={assigning}
								aria-label="بستن"
							>
								<X size={20} />
							</button>
						</div>

						<div className="manager-modal-issue">
							<span>درخواست انتخاب‌شده</span>
							<strong>{issue.title}</strong>
							<small>کد پیگیری: {issue.tracking_code}</small>
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
								{priorityLabels[getSuggestedPriority(issue.priority_score)]}
							</small>
						</div>

						<div className="manager-form-group">
							<label htmlFor="detail-department-select">واحد دانشگاهی</label>

							<select
								id="detail-department-select"
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
							<label htmlFor="detail-expert-select">کارشناس مسئول</label>

							<select
								id="detail-expert-select"
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

						{assignError && (
							<div className="manager-modal-error">{assignError}</div>
						)}

						<div className="manager-modal-actions">
							<button
								type="button"
								className="manager-cancel-button"
								onClick={() => setShowAssignModal(false)}
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
								{assigning ? "در حال ارجاع..." : "تأیید و ارجاع"}
							</button>
						</div>
					</div>
				</div>
			)}

			{showRejectModal && (
				<div
					className="manager-modal-overlay"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget && !rejecting) {
							setShowRejectModal(false);
						}
					}}
				>
					<div className="manager-modal" role="dialog" aria-modal="true">
						<div className="manager-modal-header">
							<div>
								<h2>رد درخواست</h2>
								<p>لطفاً دلیل رد درخواست را مشخص کنید.</p>
							</div>

							<button
								type="button"
								className="manager-modal-close"
								onClick={() => setShowRejectModal(false)}
								disabled={rejecting}
								aria-label="بستن"
							>
								<X size={20} />
							</button>
						</div>

						<div className="manager-modal-issue">
							<span>درخواست انتخاب‌شده</span>
							<strong>{issue.title}</strong>
							<small>کد پیگیری: {issue.tracking_code}</small>
						</div>

						<div className="manager-form-group">
							<label htmlFor="detail-rejection-reason">دلیل رد درخواست</label>

							<textarea
								id="detail-rejection-reason"
								value={rejectionReason}
								onChange={(event) => setRejectionReason(event.target.value)}
								placeholder="دلیل رد درخواست را بنویسید..."
								rows={4}
								maxLength={1000}
								disabled={rejecting}
							/>

							<small>{rejectionReason.length} از ۱۰۰۰ کاراکتر</small>
						</div>

						{rejectError && (
							<div className="manager-modal-error">{rejectError}</div>
						)}

						<div className="manager-modal-actions">
							<button
								type="button"
								className="manager-cancel-button"
								onClick={() => setShowRejectModal(false)}
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

export default IssueDetails;

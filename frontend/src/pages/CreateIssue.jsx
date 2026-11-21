import { useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import "./CreateIssue.css";
import API_BASE_URL from "../config";
function CreateIssue({ user, onLogout }) {
	const [formData, setFormData] = useState({
		title: "",
		category: "",
		location: "",
		impact: "",
		description: "",
	});

	const [files, setFiles] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");

	const handleChange = (e) => {
		const { name, value } = e.target;

		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleFileChange = (e) => {
		const selectedFiles = Array.from(e.target.files);
		setFiles((prev) => [...prev, ...selectedFiles]);
		e.target.value = "";
	};

	const removeFile = (index) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (files.length > 5) {
			setSubmitError("حداکثر ۵ فایل می‌توانید ارسال کنید.");
			return;
		}

		const maxFileSize = 5 * 1024 * 1024;

		if (files.some((file) => file.size > maxFileSize)) {
			setSubmitError("حجم هر فایل نباید بیشتر از ۵ مگابایت باشد.");
			return;
		}

		setIsSubmitting(true);
		setSubmitError("");

		const data = new FormData();

		data.append("title", formData.title.trim());
		data.append("category", formData.category);
		data.append("location", formData.location.trim());
		data.append("impact", formData.impact);
		data.append("description", formData.description.trim());

		files.forEach((file) => {
			data.append("files", file);
		});

		try {
			const response = await fetch(`${API_BASE_URL}/api/issues`, {
				method: "POST",
				credentials: "include",
				body: data,
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || "ثبت درخواست ناموفق بود.");
			}

			alert(
				`درخواست با موفقیت ثبت شد.\nکد پیگیری: ${result.issue.tracking_code}`,
			);

			setFormData({
				title: "",
				category: "",
				location: "",
				impact: "",
				description: "",
			});

			setFiles([]);
		} catch (error) {
			setSubmitError(error.message || "ارتباط با سرور برقرار نشد.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<DashboardLayout user={user} activeItem="create" onLogout={onLogout}>
			<div className="create-issue-page">
				<div className="create-issue-heading">
					<div>
						<span>پنل دانشجو</span>
						<h1>ثبت درخواست جدید</h1>
						<p>مشکل یا درخواست خود را با جزئیات ثبت کنید تا بررسی شود.</p>
					</div>
				</div>

				<form className="issue-form" onSubmit={handleSubmit}>
					<div className="form-section">
						<div className="form-section-heading">
							<FileText size={20} />
							<div>
								<h2>اطلاعات درخواست</h2>
								<p>مشخصات اصلی مشکل را وارد کنید.</p>
							</div>
						</div>

						<div className="form-grid">
							<div className="form-group full-width">
								<label htmlFor="title">عنوان درخواست *</label>
								<input
									id="title"
									name="title"
									value={formData.title}
									onChange={handleChange}
									placeholder="مثلاً خرابی سیستم روشنایی کلاس"
									required
									maxLength={150}
								/>
							</div>

							<div className="form-group">
								<label htmlFor="category">دسته‌بندی مشکل *</label>
								<select
									id="category"
									name="category"
									value={formData.category}
									onChange={handleChange}
									required
								>
									<option value="">انتخاب دسته‌بندی</option>
									<option value="facilities">تأسیسات و ساختمان</option>
									<option value="equipment">تجهیزات و امکانات</option>
									<option value="cleaning">نظافت و بهداشت</option>
									<option value="green_space">فضای سبز</option>
									<option value="electricity">برق و روشنایی</option>
									<option value="water">آب و فاضلاب</option>
									<option value="other">سایر موارد</option>
								</select>
							</div>

							<div className="form-group">
								<label htmlFor="location">محل وقوع مشکل *</label>
								<input
									id="location"
									name="location"
									value={formData.location}
									onChange={handleChange}
									placeholder="مثلاً ساختمان آموزشی، طبقه دوم"
									required
									maxLength={200}
								/>
							</div>
							<div className="form-group">
								<label htmlFor="impact">میزان تأثیر مشکل *</label>
								<select
									id="impact"
									name="impact"
									value={formData.impact}
									onChange={handleChange}
									required
								>
									<option value="">انتخاب میزان تأثیر</option>
									<option value="low">محدود (یک فرد یا بخش کوچک)</option>
									<option value="medium">متوسط (چند نفر یا یک کلاس)</option>
									<option value="high">
										گسترده (یک ساختمان یا بخش بزرگی از دانشگاه)
									</option>
								</select>
							</div>
							<div className="form-group full-width">
								<label htmlFor="description">شرح کامل مشکل *</label>
								<textarea
									id="description"
									name="description"
									value={formData.description}
									onChange={handleChange}
									placeholder="لطفاً مشکل را با جزئیات توضیح دهید..."
									rows={6}
									required
									maxLength={3000}
								/>
								<span className="character-count">
									{formData.description.length} / 3000
								</span>
							</div>
						</div>
					</div>

					<div className="form-section">
						<div className="form-section-heading">
							<Upload size={20} />
							<div>
								<h2>پیوست فایل</h2>
								<p>در صورت نیاز، تصویر یا فایل مرتبط را بارگذاری کنید.</p>
							</div>
						</div>

						<label className="file-upload-area">
							<Upload size={27} />
							<strong>برای انتخاب فایل کلیک کنید</strong>
							<span>تصویر یا فایل موردنظر را انتخاب کنید.</span>
							<input
								type="file"
								multiple
								accept="image/*,.pdf,.doc,.docx"
								onChange={handleFileChange}
							/>
						</label>

						{files.length > 0 && (
							<div className="selected-files">
								{files.map((file, index) => (
									<div className="selected-file" key={`${file.name}-${index}`}>
										<FileText size={18} />
										<span>{file.name}</span>
										<button
											type="button"
											onClick={() => removeFile(index)}
											aria-label="حذف فایل"
										>
											<X size={17} />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
					{submitError && (
						<p className="form-error" role="alert">
							{submitError}
						</p>
					)}
					<div className="form-actions">
						<button
							type="submit"
							className="submit-issue-button"
							disabled={isSubmitting}
						>
							{isSubmitting ? "در حال ثبت..." : "ثبت درخواست"}
						</button>
					</div>
				</form>
			</div>
		</DashboardLayout>
	);
}

export default CreateIssue;

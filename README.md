<div align="center">
  <h1>🧪 LabFlow</h1>
  <p><b>A Comprehensive Cloud-Based Computer Lab Management System</b></p>
</div>

## 📖 About The Project

**LabFlow** is a modern, cloud-native web application designed to digitize, streamline, and automate the daily operations of academic computer laboratories. By transitioning from traditional paper-based ledgers to a synchronized digital platform, LabFlow enhances transparency, optimizes lab resource utilization, and significantly reduces the administrative overhead for teaching staff and lab administrators.

### ✨ Core Features

* **🔑 Role-Based Access Control (RBAC):** Dedicated dashboards and permission levels for Administrators, Faculty (Teachers), and Students.
* **📸 Verifiable Digital Attendance:** Students check into practical sessions using a digital interface with real-time timestamps and selfie verification powered by device cameras.
* **📅 Smart Lab Booking & Scheduling:** Faculty can request ad-hoc lab sessions, which are routed to Administrators for conflict-free approval.
* **📚 Centralized Resource Hub:** A cloud-storage-backed module allowing teachers to upload lab manuals, notes, and study materials for instant student access.
* **📝 Task & Assignment Management:** Digital creation, submission, and grading workflow for lab records and practical assignments.
* **🤖 AI Lab Assistant:** An integrated conversational AI, providing 24/7 conceptual and programming support to students during their lab sessions.


## 💻 Tech Stack

* **Frontend:** React.js, TypeScript, Vite, Tailwind CSS, Recharts (for analytics)
* **Backend & Database:** Firebase Authentication, Cloud Firestore (NoSQL)
* **Cloud Storage:** Cloudinary API (for media, avatars, and assignment proofs)
* **Artificial Intelligence:** Google Gemini API


## 🚀 Getting Started

Follow these instructions to set up and run the project locally on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
* npm (Node Package Manager)

### Installation & Setup

1. **Clone the repository:**

   git clone [https://github.com/your-username/labflow-computer-lab-management-system.git](https://github.com/your-username/labflow-computer-lab-management-system.git)
   cd labflow-computer-lab-management-system



2. **Install dependencies:**

npm install



3. **Configure Environment Variables:**

Create a `.env` file in the root directory of your project and add your specific API keys for Firebase, Cloudinary, and Gemini. Use the following template:

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset

# Google Gemini API
VITE_GEMINI_API_KEY=your_gemini_api_key



4. **Run the development server:**

npm run dev



5. Open your browser and navigate to `http://localhost:5173` to view the application.

## 🛡️ License

This project is submitted as an academic requirement and is intended for educational purposes.


Just make sure to update the `git clone` URL in the installation steps to match your actual GitHub repository URL.
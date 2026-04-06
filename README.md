# 🚀 AutoHealX: AI-Powered Device Self-Healing Dashboard

AutoHealX is a futuristic, real-time device monitoring and autonomous maintenance platform. It combines deep system telemetry with AI-driven "self-healing" capabilities to ensure your devices always run at peak performance.

![AutoHealX Banner](https://picsum.photos/seed/autohealx/1200/400)

## ✨ Key Features

- **📊 Real-Time Telemetry**: Monitor CPU, Memory, GPU, Disk, and Network metrics with high-precision, time-based charts.
- **🧠 AI Self-Healing**: 
  - **Suggest Mode**: Receive intelligent alerts and manual "Fix Now" recommendations.
  - **Auto Mode**: Let the AI agent autonomously resolve performance spikes and security threats.
- **🛡️ Process Management**: View all active processes and instantly terminate resource-heavy tasks with a single click.
- **📚 Intelligent Knowledge Base**: Access a curated library of solutions for common performance, network, and security issues.
- **📜 Action Transparency**: Full audit logs of every command executed by the AI agent or the user.
- **📱 Multi-Device Support**: Manage and monitor multiple registered devices from a single unified dashboard.
- **🎨 Futuristic UI**: A high-performance "Bento-style" interface built with Tailwind CSS and Framer Motion.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS (Utility-first, responsive design)
- **Database & Auth**: Firebase (Firestore for real-time data, Firebase Auth for secure access)
- **Charts**: Recharts (High-performance SVG charts)
- **Animations**: Framer Motion (Smooth transitions and micro-interactions)
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Firebase Project

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/autohealx.git
   cd autohealx
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## 📂 Project Structure

```text
src/
├── components/        # Reusable UI components (Dashboard, Charts, etc.)
├── services/          # Firebase and API integration logic
├── lib/               # Utility functions (cn, formatting)
├── types.ts           # Global TypeScript interfaces
├── App.tsx            # Main application routing and state
└── index.css          # Global styles and Tailwind imports
```

## 🔒 Security Rules

The application uses strict Firestore Security Rules to ensure:
- Users can only access their own devices and data.
- Admins have global read/write access for support.
- Data integrity is enforced through schema validation at the database level.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

*Built with ❤️ for a faster, safer digital world.*

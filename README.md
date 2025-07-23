# 🌍 ExploreNow – Travel Discovery & Booking Platform

ExploreNow is a full-stack travel booking and exploration platform that helps travelers discover curated trips, book top-rated hotels, and use smart AI-powered tools like trip recommendations, local tourist guides, and language translation — all within a seamless user experience.

![ExploreNow Preview](https://your-preview-image-link-if-any.com)

---

## ✨ Features

### 🔐 Authentication
- JWT-based login/signup with secure access/refresh tokens
- Role-based access (Traveler/Admin)
- Separate login/signup pages for Admin and Users
- Google & Facebook social login options

### 🏠 Home Interface
- Fully responsive UI with pure black/white monochrome design
- Hero section with CTA: “Plan. Book. Explore.”
- Featured Destinations, Top Hotels, Testimonials
- Sticky header with dark/light toggle, language selector

### 🧰 Traveler Tools
- ✅ **Trip Recommender** – Suggests trips based on user budget, interests, and duration
- ✅ **Local Explorer** – Provides popular tourist spots based on location and preference
- ✅ **Text Translator** – Helps travelers communicate across languages
- ✅ **Expense Estimator** – Estimates total trip budget
- ✅ **Tourist & Crowd Map** – Shows crowded areas for better planning

### 🧑‍💼 Admin Dashboard
- Protected dashboard for uploading trips & hotels
- Admin CRUD operations (add, edit, delete)
- Upload images, set prices, descriptions, ratings

---

## 🛠️ Tech Stack

| Frontend | Backend | Database | Deployment |
|----------|---------|----------|------------|
| React (Vite) + Tailwind CSS | Node.js + Express.js | PostgreSQL (via Prisma) | Render, Replit, Cursor |
| React Router DOM | RESTful APIs | Prisma ORM | GitHub CI/CD |
| JWT, Bcrypt, Multer | Role Middleware | Cloudinary (optional) | |

---

## 📂 Project Structure

ExploreNow/
├── frontend/               # React-based frontend
│   ├── components/
│   ├── pages/
│   └── tools/              # Trip Recommender, Translator, Explorer, etc.
├── backend/                # Express.js backend
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── services/
│   └── prisma/
│       └── schema.prisma

---

## 🚀 Getting Started

### 📦 Install Dependencies

bash
cd frontend
npm install

cd ../backend
npm install

🛠️ Setup Environment Variables

Create .env in backend/ with:

DATABASE_URL=your_postgres_db_url
JWT_SECRET=your_jwt_secret

🧪 Run Locally

# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev

🧠 AI Integrations
	•	🔎 Open-source models (Hugging Face) for:
	•	Text Translation
	•	Trip Recommendation (via keyword/interest matching)
	•	No OpenAI dependency (100% free)
	•	Can be hosted separately or integrated via API

⸻

✅ Future Enhancements
	•	✈️ Booking payment integration (Stripe/Razorpay)
	•	📊 Admin analytics dashboard
	•	🧠 LLM-based dynamic itinerary planning
	•	🔍 Real-time crowd & weather insights

⸻

🙌 Contributing

Contributions are welcome! Open issues, suggest features, or submit pull requests.

⸻

📜 License

This project is licensed under the MIT License.

# 📖 Digital Diary

A modern, full-stack cross-platform **Personal Journal & Notes Application** built with **React Native (Expo)** and **Node.js / Express / MongoDB**.

Designed for desktop web, mobile web, iOS, and Android with responsive layouts, dark mode, biometric security, handwritten sketches, and Google authentication.

---

## ✨ Features

### 🔐 Security & Privacy
- **Biometric & App Lock**: Secure your private notes with Face ID, Touch ID, or device passcode.
- **Locked Notes Category**: Separate encrypted category for sensitive thoughts and private journal entries.

### 🎨 Sketches & Handwritten Notes
- **Interactive Drawing Pad**: Built-in sketch canvas pad to draw handwritten notes, diagrams, or signatures.
- **Photo Attachments**: Upload and attach high-res photos to any diary entry.

### 💻 Modern Responsive Web UI
- **Desktop Navigation Bar**: Sleek top navigation bar featuring app branding, quick tab switches, theme toggle, and user profile chip.
- **Split-Screen Desktop Auth**: 2-column hero card layouts for Login and Registration on wide viewports.
- **Responsive Entry Grid**: Dynamic 2-column or 3-column desktop grid for diary cards on wide screens.
- **Side-by-Side Calendar View**: Desktop calendar view with an interactive calendar widget on the left and a live timeline feed on the right.

### 🔑 Authentication
- **Email & Password Authentication**: Standard secure registration and sign-in.
- **Google Sign-In**: Integrated Google authentication flow (`/api/auth/google`).

### 📅 Calendar & Timeline
- **Interactive Calendar**: View diary entries mapped by date.
- **Timeline Feed**: Time-stamped entry feed for selected dates.

### 🏷️ Categorization & Filters
- **Filter Categories**: 
  - 📝 **All Notes**
  - ⭐ **Favorites**
  - 🎨 **Handwritten Sketches**
  - 📦 **Archived**
  - 🔒 **Locked Notes**
  - 🗑️ **Recently Deleted (Trash & Restore)**
- **Live Search & Date Filter**: Search by title, keywords, content, or specific date query (`YYYY-MM-DD`).

### 🌙 Customization & Extras
- **Dark Mode Support**: Seamless toggle between Dark and Light color themes.
- **Export & Share**: Export entries as image captures or plain text messages.
- **Auto-Calculated Totals**: Automatic number detector that totals financial figures or numeric notes.

---

## 🛠️ Technology Stack

### Frontend (`/DigitalDiary`)
- **Framework**: React Native with Expo Web & TypeScript
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **Styling**: Responsive Flexbox, Expo Linear Gradient, Custom Design Tokens
- **Icons & Graphics**: `@expo/vector-icons` (Ionicons)
- **Canvas & Media**: `react-native-signature-canvas`, `expo-image-picker`, `react-native-view-shot`

### Backend (`/backend`)
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB with Mongoose ODM
- **Auth & Security**: JSON Web Tokens (JWT) & Bcrypt password hashing
- **File Uploads**: Multer static uploads engine

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo "PORT=5000" > .env
echo "MONGO_URI=mongodb://127.0.0.1:27017/digitaldiary" >> .env
echo "JWT_SECRET=supersecretkey123" >> .env

# Start backend server
npm start
```

### 3. Frontend Setup
```bash
cd DigitalDiary

# Install dependencies
npm install

# Start Expo dev server
npm start

# Or run web directly
npm run web
```

---

## 📁 Project Structure

```
my-diary/
├── backend/
│   ├── config/          # Database connection
│   ├── middleware/      # Auth protect middleware
│   ├── models/          # Mongoose schemas (User, Diary)
│   ├── routes/          # API routes (authRoutes, diaryRoutes)
│   └── server.js        # Express server entry point
│
└── DigitalDiary/
    ├── App.tsx          # Root application component & web styles
    ├── src/
    │   ├── components/  # DesktopHeader, WebWrapper, AnimatedTouchable
    │   ├── context/     # AuthContext state
    │   ├── navigation/  # AppNavigator, TabNavigator
    │   ├── screens/     # HomeScreen, CalendarScreen, LoginScreen, etc.
    │   ├── services/    # Axios API client setup
    │   └── theme/       # Color palettes & ThemeContext
    └── package.json
```

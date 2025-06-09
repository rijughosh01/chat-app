# NexChat 💬

A modern, fullstack real-time chat application built with **React**, **Vite**, **Tailwind CSS**, **DaisyUI**, **Zustand**, **Socket.IO**, **Express**, **MongoDB**, and **Cloudinary**.  
Connect with friends, share messages and images, and enjoy a beautiful, chat experience!

---

## ✨ Features

- **Authentication:** Sign up, log in, and secure sessions with JWT cookies.
- **Real-Time Messaging:** Instant chat using Socket.IO.
- **Image Sharing:** Upload and share images in chat (stored via Cloudinary).
- **Profile Management:** Update your avatar and view your account info.
- **Online Status:** See who’s online in real time.
- **Message Actions:** Edit, delete, and see delivery/read status.
- **Typing Indicator:** Know when your friend is typing.
- **Emoji Support** – Pick and send emojis with ease using emoji-mart.
- **Responsive UI:** Works great on desktop and mobile.


## 🚀 Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/rijughosh01/chat-app.git
cd chat-app
```

### 2. Setup the Backend

```sh
cd backend
npm install
```

- Create a `.env` file in `backend/` with the following variables:

  ```
  PORT=5001
  MONGODB_URI=your_mongodb_connection_string
  JWT_SECRET=your_jwt_secret
  CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
  CLOUDINARY_API_KEY=your_cloudinary_api_key
  CLOUDINARY_API_SECRET=your_cloudinary_api_secret
  NODE_ENV=development
  ```

- Start the backend server:

  ```sh
  npm run dev
  ```

### 3. Setup the Frontend

```sh
cd ../frontend
npm install
```

- Start the frontend dev server:

  ```sh
  npm run dev
  ```

- The app will be available at [http://localhost:5173]

---

## ⚙️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, DaisyUI, Zustand, Socket.IO Client, Axios, Emoji Mart
- **Backend:** Express, MongoDB, Mongoose, Socket.IO, Cloudinary, JWT, bcryptjs, dotenv
- **Other:** ESLint, Nodemon



### Backend

- `npm run dev` — Start backend in development mode (nodemon)
- `npm start` — Start backend in production

### Frontend

- `npm run dev` — Start frontend in development mode
- `npm run build` — Build frontend for production
- `npm run preview` — Preview production build



## 📄 License

MIT

---

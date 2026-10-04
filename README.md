# Store Rating App

A full-stack web application for managing stores and user ratings with role-based access for **System Administrators, Normal Users, and Store Owners**.

## Features

- User registration and login
- JWT-based authentication with HttpOnly cookies
- Role-based authorization
- Store search by name and address
- Submit and update ratings from 1–5
- Admin dashboard for managing users and stores
- Store owner dashboard with rating statistics
- Password change functionality
- User and store filtering and sorting
- Backend and frontend input validation

## Tech Stack

- **Frontend:** React.js, Vite, JavaScript, CSS
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** JWT, bcrypt
- **Tools:** Git, GitHub, Postman

## Project Structure

```text
FullStack-Store-Rating-App/
├── backend/
│   ├── src/
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
└── README.md
Installation

Clone the repository:

git clone https://github.com/JanhaviSalokhe/FullStack-Store-Rating-App.git
cd FullStack-Store-Rating-App
Backend Setup
cd backend
npm install

Create a .env file inside backend:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=store_rating
JWT_SECRET=your_secure_secret
PORT=5000

Set up the database:

npm run db:setup

Start the backend:

npm run dev
Frontend Setup

Open another terminal:

cd frontend
npm install
npm run dev

The frontend will usually run at:

http://localhost:5173

The backend API runs at:

http://localhost:5000
User Roles
System Administrator
Manage users and stores
View platform statistics
Search, filter, and sort records
View user and store details
Normal User
Browse and search stores
View store ratings
Submit and update ratings
Change password
Store Owner
View owned stores
View average ratings
View customer ratings
Change password
Security
Passwords are hashed using bcrypt
JWT authentication
HttpOnly cookies
Role-based authorization
Backend validation
Sensitive configuration stored in .env
GitHub

Repository:

https://github.com/JanhaviSalokhe/FullStack-Store-Rating-App

Author

Janhavi Salokhe
Computer Science (Data Science)

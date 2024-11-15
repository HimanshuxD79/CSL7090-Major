# Secure Group Chat Platform (Zero Trust Architecture)

This project is a secure group chat platform implemented using **Zero Trust Architecture** (ZTA) principles. It allows users to securely communicate within groups, with end-to-end encryption and public/private key management. The frontend is built with React, and the backend is implemented using Node.js, Express, and MongoDB. Encryption is handled using RSA and AES algorithms.
![Blank diagram](https://github.com/user-attachments/assets/78337da1-9fb3-44aa-ae5a-a89e05420fce)

## Features

- **Zero Trust Architecture** for enhanced security
- User authentication using JWT (JSON Web Tokens)
- End-to-end encryption of messages using RSA and AES
- Group management, including adding users and group encryption key management
- Secure registration, login, and group chat functionalities

## Tech Stack

- **Frontend**: React (Vite)
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Encryption**: RSA, AES
- **Authentication**: JWT
- **Deployment**: Vercel (Frontend), Node.js server

## Setup Instructions

Follow these steps to get the project up and running locally:

### 1. **Clone the repository**

```bash
git clone https://github.com/your-username/secure-group-chat.git
cd secure-group-chat
cd client
npm install
```
### 2. **Run the frontend**
```bash
npm run dev
```
> This will start the frontend on http://localhost:3000.
### 3. **Install dependencies for the backend**
```bash
node server.js
```
### 4. Start the backend server
```bash
node server.js
```
>The backend will be running on http://localhost:5000.
### 5. Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017/secure_chat
JWT_SECRET=your_jwt_secret_key
```
## Directory Structure

### **Frontend (Client)**

- **`src/pages`**
  - `GroupChatPage`: Handles the chat interface and message encryption/decryption
  - `GroupManagement`: Handles group creation, adding users, and group key management
  - `LandingPage`: Main landing page with login/signup options
  - `RegisterPage`: Handles user registration
  - `LoginPage`: Handles user login
- **`src/cryptoUtils.js`**: Implements RSA and AES encryption/decryption functions
- **`public/index.html`**: Main HTML file for the frontend
- **`package.json`**: Contains frontend dependencies and scripts
- **`vite.config.js`**: Configuration file for Vite build tool

### **Backend (Server)**

- **`models/group.js`**: Defines the group schema for MongoDB
- **`models/message.js`**: Defines the message schema for MongoDB
- **`models/user.js`**: Defines the user schema for MongoDB
- **`public/index.html`**: Static HTML file for the server
- **`router/auth.js`**: Contains authentication API routes for login/signup
- **`router/discussionSection.js`**: Contains APIs for fetching messages and managing groups
- **`server.js`**: Main server file for setting up Express and routing
- **`.env`**: Environment variables for server configuration
- **`package.json`**: Contains backend dependencies and scripts

# Performance Tracker Admin Dashboard - Installation Guide 🎯

## Prerequisites

- Node.js (14.x or higher)
- npm or yarn package manager
- Performance Tracker API server running

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/RND036/intern-web-.git
cd intern_app
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure API Endpoint
Open `src/App.js` and update the API base URL:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
// For production: 'https://your-api-domain.com/api'
```

### 4. Start Development Server 
```bash
npm start
# or
yarn start
# backend #
backend server
cd backend
node server.js
```

### 5. Open Browser
Navigate to `http://localhost:3000`

## Test Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

## Environment Configuration (Optional)

Create `.env` file in backend directory:
```env
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
PORT=
```


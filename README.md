# shopSquare — Clothing E-Commerce PWA

## Project Overview

shopSquare is a full-stack clothing e-commerce Progressive Web
Application (PWA). It allows customers to browse clothing products,
manage their shopping cart, place orders and receive real-time
order status notifications.

Administrators can manage products, inventory information and
customer orders through a dedicated management interface.

## Key Features

### Customer Features
- User registration and login
- Product browsing and searching
- Category filtering and product sorting
- Product details
- Shopping cart with persistent storage
- Order placement and order history
- Push notifications for order status updates
- Installable Progressive Web Application
- Offline access to previously cached products

### Administrator Features
- Create, read, update and delete products
- Manage product inventory information
- View customer orders
- Update order status
- Delete orders
- Trigger customer order notifications

## Technologies Used

### Frontend
- React
- TypeScript
- Vite
- React Router
- Lucide React
- CSS
- Vite PWA Plugin

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- Web Push API

### Development Tools
- Visual Studio Code
- Postman
- MongoDB Compass
- Git and GitHub
- Vitest
- Chrome Developer Tools

## System Architecture

The application follows a client-server architecture.

React Frontend -> Express REST API -> MongoDB Database

The backend handles authentication, authorisation, database
operations and push notification delivery.

## Installation Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Vraj-Patel-1/shopSquare.git
cd shopSquare
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder.

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopSquare
JWT_SECRET=your_generated_secret
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Ensure MongoDB is running before starting the backend.

```bash
npm run dev
```

Backend URL: http://localhost:5000

### 3. Frontend Setup

Open a separate terminal from the project root.

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: http://localhost:5173

### 4. PWA Production Preview

Stop the frontend development server before running:

```bash
npm run build
npm run preview -- --port 5173 --strictPort
```

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing using bcrypt
- Protected API endpoints
- Server-side input validation
- Environment variable protection
- VAPID-based push notification authentication
- Trusted push endpoint validation
- Push subscription ownership protection
- Unique MongoDB subscription indexes

Sensitive environment files are excluded from version control.

## Design Patterns

- Strategy Pattern for product sorting
- React Context and Provider Pattern for cart management
- Observer-like reactive state updates
- Route Guard Pattern for protected pages
- Service Layer Pattern for push notifications
- MVC-inspired backend architecture

## Testing

The application was tested using:

- Postman API testing
- Frontend functional testing
- Authentication and authorisation testing
- Push notification testing
- Offline caching testing
- VS Code debugging and variable watchers
- Vitest unit testing

Eight cart utility unit tests passed successfully.

To run the unit tests:

```bash
cd frontend
npx vitest run
```

## Future Improvements

- Online payment integration
- Cloud deployment
- Advanced sales analytics
- Automatic stock deduction after order placement
- Expanded automated test coverage
- Improved product image management

## Academic Information

Course: IA730001 Advanced Application Development

Project: Final Assessment

Programme: Bachelor of Information Technology

Year: 2026

## Author

Vraj Patel

## Repository

https://github.com/Vraj-Patel-1/shopSquare
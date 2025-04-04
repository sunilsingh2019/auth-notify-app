# Auth Notification App

A simple authentication-based web application with real-time notifications.

## Features

- User registration and login
- JWT-based authentication
- Real-time notifications for new user registrations
- WebSocket-based live updates

## Technologies Used

### Backend
- Python FastAPI
- SQLite Database
- JWT Authentication
- WebSockets for real-time communication

### Frontend
- React with TypeScript
- React Router for navigation
- React Context for state management
- WebSockets for real-time updates

## Prerequisites

- Docker and Docker Compose

## Running Locally with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/auth-notify-app.git
   cd auth-notify-app
   ```

2. Start the application using Docker Compose:
   ```bash
   docker-compose up
   ```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Testing the Application

1. Open the application in your browser at http://localhost:5173

2. Register a new user account with an email and password.

3. Login with your credentials.

4. To test the notification system:
   - Open the application in another browser or an incognito window
   - Register a new user
   - You should see a notification in the first browser window

## Project Structure

```
/auth-notify-app
│── /backend                # FastAPI backend
│   ├── /config             # App-wide settings
│   ├── /apps               # Feature-based apps
│   │   ├── /users          # Authentication module
│   │   ├── /notifications  # WebSockets-based notifications
│   ├── /common             # Shared utilities
│   ├── /tests              # Backend tests
│   ├── main.py             # FastAPI entry point
│── /frontend               # React frontend
│   ├── /src
│   │   ├── /components     # Reusable UI components
│   │   ├── /pages          # Page-level components
│   │   ├── /services       # API calls
│   │   ├── /context        # Auth & WebSocket context
│── docker-compose.yml      # Docker setup for full stack
```

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/me` - Get current user info
- `WebSocket /api/notifications/ws` - Real-time notifications

## Development

If you want to run the services individually for development:

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Documentation

The API documentation is available via Swagger UI at http://localhost:8000/docs when the backend is running. This interactive documentation allows you to:

- View all available endpoints
- See detailed request/response schemas
- Test the API directly from the browser
- Understand authentication requirements
- Try out the WebSocket connection

![Swagger UI](https://i.imgur.com/8Q9QtyP.png)

For a more detailed, alternative API documentation, you can also visit http://localhost:8000/redoc

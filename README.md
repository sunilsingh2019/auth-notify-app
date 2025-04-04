# Auth Notification App

A simple authentication-based web application with real-time notifications.

## Demo Video

<div align="center">
  <a href="https://youtu.be/hL7ZaWSwUvU">
    <img src="https://img.youtube.com/vi/hL7ZaWSwUvU/maxresdefault.jpg" alt="Auth Notification App Demo" style="max-width:100%;">
  </a>
  <p>
    <strong>▶️ Click the image above to watch the tutorial video</strong><br>
    <em>Learn how to set up and use all features of the application</em>
  </p>
</div>

## Features

- User registration and login with email verification
- Password reset functionality
- JWT-based authentication
- Real-time notifications for new user registrations
- WebSocket-based live updates
- Responsive mobile-friendly design

## Technologies Used

### Backend
- Python FastAPI
- SQLite Database
- JWT Authentication
- WebSockets for real-time communication
- Email verification system

### Frontend
- React with TypeScript
- React Router for navigation
- React Context for state management
- WebSockets for real-time updates
- Modern CSS with variables for theming

## Prerequisites

- Docker and Docker Compose
- Git

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

> **Note**: On first run, you might need to update the database schema. You can do this by running:
> ```bash
> docker-compose exec backend python /app/scripts/update_reset_password_fields.py
> ```

## Testing the Application

1. Open the application in your browser at http://localhost:5173

2. Register a new user account with an email and password.

3. Login with your credentials.

4. To test the notification system:
   - Open the application in another browser or an incognito window
   - Register a new user
   - You should see a notification in the first browser window

5. Try other features:
   - Password reset functionality
   - Email verification
   - Various notification actions

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
│   ├── docker-compose.yml  # Docker setup for full stack
```

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-email` - Verify email with token
- `WebSocket /api/notifications/ws` - Real-time notifications

## Development

If you want to run the services individually for development:

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database Maintenance

If you need to reset the database:

```bash
docker-compose exec backend python /app/scripts/drop_all_tables.py
```

To update the database schema:

```bash
docker-compose exec backend python /app/scripts/update_database_schema.py
docker-compose exec backend python /app/scripts/update_reset_password_fields.py
```

## Troubleshooting

If you encounter issues:

1. **WebSocket Connection Issues**:
   - Make sure your browser supports WebSockets
   - Check that the backend is running
   - Try using the Check WebSocket button in the notification debug page

2. **Database Errors**:
   - You might need to update the database schema as mentioned above
   - Try resetting the database if you encounter persistent issues

3. **Email Verification**:
   - The app uses console logging for email verification (no actual emails are sent)
   - Check the backend logs for verification links

## Learn More

To learn more about the technologies used in this project, check out:
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/)
- [WebSockets Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

## API Documentation

The API documentation is available via Swagger UI at http://localhost:8000/docs when the backend is running. This interactive documentation allows you to:

- View all available endpoints
- See detailed request/response schemas
- Test the API directly from the browser
- Understand authentication requirements
- Try out the WebSocket connection

For a more detailed, alternative API documentation, you can also visit http://localhost:8000/redoc

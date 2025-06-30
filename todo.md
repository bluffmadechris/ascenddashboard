# API Server Setup Guide

This guide will help you set up and run the API server for the Ascend Media Dashboard.

## Prerequisites

Before setting up the API server, make sure you have:

1. **Node.js** (v16 or higher)
2. **PostgreSQL** database
3. **AWS S3** bucket (for file storage)
4. **npm** or **yarn** package manager

## Environment Configuration

1. Create a `.env` file in your project root with the following variables:

```env
# API Server Configuration
API_SERVER_URL=http://localhost:8000
API_PORT=8000
API_JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
API_ENCRYPTION_KEY=your-32-character-encryption-key-here

# Database Configuration
POSTGRES_URL=postgresql://username:password@localhost:5432/ascend_dashboard

# AWS S3 Configuration for File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
S3_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## API Server Dependencies

Install the required dependencies for the API server:

```bash
cd api-server
npm install express cors helmet express-rate-limit bcryptjs jsonwebtoken pg aws-sdk multer uuid crypto dotenv
```

## Database Setup

1. **Create PostgreSQL Database:**
   ```sql
   CREATE DATABASE ascend_dashboard;
   ```

2. **Database Tables:**
   The API server will automatically create the required tables when it starts:
   - `users` - User accounts and authentication
   - `contracts` - File/contract storage
   - `user_sessions` - Session management
   - `clients` - Client information
   - `invoices` - Invoice data
   - `team_members` - Team member records
   - `calendar_events` - Calendar and scheduling
   - `notifications` - User notifications

## AWS S3 Setup

1. **Create S3 Bucket:**
   - Log into AWS Console
   - Create a new S3 bucket
   - Enable versioning (recommended)
   - Configure appropriate permissions

2. **IAM User Setup:**
   - Create an IAM user with S3 access
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)
   - Generate access keys

## Running the API Server

1. **Start the API Server:**
   ```bash
   cd api-server
   node server.js
   ```

2. **Verify Installation:**
   - API Health Check: `http://localhost:8000/api/health`
   - Should return: `{"success": true, "message": "API server is running"}`

## Frontend Integration

The frontend is already configured to work with the API server. Key integration points:

### API Client (`lib/api-client.ts`)
- Handles all API communication
- Automatic token management
- Error handling and retries

### Authentication (`lib/auth-context.tsx`)
- JWT-based authentication
- Automatic fallback to local storage when API unavailable
- Role-based access control

### Components
- Dashboard stats with real-time data
- Contract management with S3 file storage
- User management
- Client and invoice management

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Invoices
- `GET /api/invoices` - Get invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Contracts/Files
- `POST /api/contracts/upload` - Upload contract
- `GET /api/contracts` - Get contracts
- `GET /api/contracts/:id/download` - Download contract
- `DELETE /api/contracts/:id` - Delete contract

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Calendar
- `GET /api/calendar/events` - Get calendar events
- `POST /api/calendar/events` - Create calendar event

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read

### Team Management
- `GET /api/team-members` - Get team members
- `POST /api/team-members` - Create team member

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Prevents abuse and DDoS attacks
- **CORS Protection** - Cross-origin request security
- **File Upload Security** - File type validation and size limits
- **SQL Injection Prevention** - Parameterized queries
- **Data Encryption** - Sensitive data encryption at rest
- **Session Management** - Secure session tracking

## Development vs Production

### Development
- Uses `NODE_ENV=development`
- Detailed error messages
- No SSL requirement for database

### Production
- Set `NODE_ENV=production`
- Enable SSL for database connections
- Use environment secrets management
- Configure proper CORS origins
- Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **Database Connection Failed:**
   - Check PostgreSQL is running
   - Verify connection string format
   - Ensure database exists

2. **AWS S3 Errors:**
   - Verify AWS credentials
   - Check bucket permissions
   - Ensure region is correct

3. **Frontend API Connection Issues:**
   - Check API server is running on correct port
   - Verify `API_SERVER_URL` in frontend environment
   - Check CORS configuration

4. **Authentication Problems:**
   - Verify JWT secret is set
   - Check token expiration settings
   - Ensure user exists in database

### Logs
- API server logs to console
- Check browser network tab for frontend API calls
- Monitor database logs for connection issues

## Next Steps

1. **Create Admin User:**
   ```javascript
   // Use the API to create your first admin user
   // Or insert directly into database with hashed password
   ```

2. **Import Existing Data:**
   - Use provided migration scripts
   - Import from local storage data
   - Bulk import via API endpoints

3. **Customize Configuration:**
   - Adjust rate limits
   - Configure file upload limits
   - Set up email notifications

4. **Monitoring & Backup:**
   - Set up database backups
   - Monitor API performance
   - Configure error tracking 
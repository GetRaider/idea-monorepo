# GitHub OAuth Authentication Setup

This guide will help you set up GitHub OAuth authentication for the Devinity application.

## Prerequisites

1. A GitHub account
2. PostgreSQL database running locally or remotely
3. Node.js and pnpm installed

## 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App" (or edit your existing OAuth App)
3. Fill in the application details:
   - **Application name**: Devinity
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:8090/api/auth/callback/github`
4. Click "Register application" (or "Update application")
5. Copy the **Client ID** and **Client Secret**

## 2. Create a GitHub Personal Access Token

1. Go to [GitHub Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Devinity API"
4. Select the following scopes:
   - `repo` (if you need access to private repositories)
   - `user` (for user information)
   - `read:org` (if you need organization information)
5. Click "Generate token"
6. Copy the token (you won't be able to see it again)

## 3. Set up Environment Variables

### For the API (devinity-api)

Create a `.env.local` file in `/apps/devinity-api/`:

```env
# API Environment Variables
API_BASE_URL=http://localhost:8090
WEB_BASE_URL=http://localhost:3001
PORT=8090

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_TOKEN=your_github_personal_access_token_here

# Better Auth Configuration
BETTER_AUTH_SECRET=your_random_secret_string_here

# Database Configuration
DEV_DB_URL=postgresql://username:password@localhost:5432/devinity_dev
LOCAL_DB_URL=postgresql://username:password@localhost:5432/devinity_local
```

### For the Web App (devinity-web)

Create a `.env.local` file in `/apps/devinity-web/`:

```env
# Web App Environment Variables
# Points directly to the NestJS API backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8090
```

## 4. Set up the Database

1. Make sure PostgreSQL is running
2. Create the database:
   ```sql
   CREATE DATABASE devinity_dev;
   ```
3. Run the database migrations:
   ```bash
   cd apps/devinity-api
   pnpm db:migrate
   ```

## 5. Start the Applications

### Start the API server:

```bash
cd apps/devinity-api
pnpm dev
```

### Start the web application:

```bash
cd apps/devinity-web
pnpm dev
```

## 6. Test the Authentication

1. Open your browser and go to `http://localhost:3001`
2. Click "Sign in with GitHub"
3. You should be redirected to GitHub for authorization
4. After authorizing, you'll be redirected back to the app
5. You should see your GitHub profile information displayed

## Features

- **GitHub OAuth Integration**: Users can sign in/sign up using their GitHub account
- **Session Management**: Automatic session handling with better-auth
- **User Profile Display**: Shows user avatar, name, and email
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, modern interface with glassmorphism effects

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**: Make sure the callback URL in your GitHub OAuth app matches exactly: `http://localhost:8090/api/auth/callback/github` (points directly to the NestJS API)

2. **"Client ID not found"**: Verify that your environment variables are set correctly and the `.env.local` files are in the right locations

3. **Database connection errors**: Ensure PostgreSQL is running and the database URL is correct

4. **CORS errors**: The API is configured to accept requests from `http://localhost:3001`

### Environment Variables Not Loading:

- Make sure `.env.local` files are in the correct directories
- Restart the development servers after changing environment variables
- Check that there are no syntax errors in the `.env.local` files

## Security Notes

- Never commit `.env.local` files to version control
- Use strong, random values for `BETTER_AUTH_SECRET`
- In production, use HTTPS URLs for all OAuth configurations
- Regularly rotate your GitHub personal access tokens

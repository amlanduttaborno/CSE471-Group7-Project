# Vercel Deployment Guide for TailorCraft

## Pre-deployment Checklist

### ✅ **Already Fixed:**
- ✅ Updated `vercel.json` configuration
- ✅ Removed file system dependencies 
- ✅ Updated MongoDB connection for serverless
- ✅ Created environment variables template
- ✅ Updated upload middleware for cloud storage

## Step-by-Step Deployment Process

### 1. Prerequisites
- GitHub repository with your project
- Vercel account (free tier available)
- MongoDB Atlas database
- Gmail account for email services
- SSLCommerz account for payments

### 2. Environment Variables Setup

Copy the `.env.example` file and set these variables in your Vercel dashboard:

#### Required Environment Variables:
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/TailorCraft?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Payment Gateway
SSLCZ_STORE_ID=your-store-id
SSLCZ_STORE_PASSWD=your-store-password
SSLCZ_IS_LIVE=false

# Server
NODE_ENV=production
PORT=3000
```

### 3. Setting Up MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist Vercel's IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string and add it to `MONGODB_URI`

### 4. Setting Up Gmail for Email Service
1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password
3. Use your Gmail address for `EMAIL_USER`
4. Use the app-specific password for `EMAIL_PASS`

### 5. Deploying to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import your repository
4. Configure environment variables
5. Deploy

### 6. Adding Environment Variables in Vercel Dashboard
1. Go to your project in Vercel dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add each variable from the list above
4. Redeploy the project

### 7. Post-Deployment Configuration

#### File Upload Solution (IMPORTANT)
The current file upload system won't work on Vercel. Choose one option:

**Option A: Implement Cloudinary (Recommended)**
```bash
npm install cloudinary
```

Add to environment variables:
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Option B: Implement AWS S3**
```bash
npm install aws-sdk
```

Add to environment variables:
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket-name
```

## Important Notes

### Limitations Fixed:
- ✅ Serverless function timeouts (added maxDuration: 30)
- ✅ File system access (conditional based on environment)
- ✅ MongoDB connection pooling for serverless
- ✅ Static file routing conflicts

### Still Need Implementation:
- ⚠️ **File Upload Cloud Storage**: Currently using placeholder
- ⚠️ **Production Image URLs**: Need to update file paths in database

### Testing Your Deployment
1. Check if the main page loads: `https://your-app.vercel.app`
2. Test API endpoints: `https://your-app.vercel.app/api/test`
3. Verify database connectivity
4. Test authentication flows
5. Check email functionality

### Troubleshooting Common Issues

#### 1. 500 Internal Server Error
- Check Vercel function logs
- Verify environment variables are set
- Ensure MongoDB connection string is correct

#### 2. API Routes Not Working
- Verify `vercel.json` configuration
- Check that routes start with `/api/`

#### 3. Static Files Not Loading
- Ensure files are in the `public` directory
- Check vercel.json routes configuration

#### 4. Database Connection Issues
- Verify MongoDB Atlas IP whitelist
- Check connection string format
- Ensure database user has proper permissions

### Performance Optimization
- MongoDB indexes are already set up
- Serverless function configuration optimized
- Static file caching enabled through Vercel

## Support
If you encounter issues, check:
1. Vercel function logs
2. Browser developer console
3. MongoDB Atlas logs
4. This deployment guide

Remember to keep your environment variables secure and never commit them to version control!

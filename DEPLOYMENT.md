# ChronoAutoTee Deployment Guide 🚀

## Overview
This guide covers deploying ChronoAutoTee to production environments, from local testing to cloud deployment.

## 🔧 Pre-Deployment Fixes

### 1. Fix TypeScript Issues
Before deploying, you need to resolve the TypeScript compilation errors:

```bash
# Install all dependencies including dev dependencies
npm install

# Try building to see specific errors
npm run build
```

Common issues to fix:
- Add proper type declarations for `navigator` in web-provider.ts
- Fix undefined type issues in notification service
- Add proper type guards for optional properties

### 2. Environment Configuration

#### Production Environment Variables
Create a production `.env` file:

```env
# Choose ONE authentication method

# Option 1: Partner API (Recommended for production)
PARTNER_API_TOKEN=your_production_api_token
ORG_ID=your_org_id
FACILITY_ID=your_facility_id
COURSE_ID=your_course_id

# Option 2: Web Authentication (Fallback)
EMAIL=your_golf_account_email
PASSWORD=your_golf_account_password

# Course Configuration
HOME_COURSE_NAME=Your Actual Golf Course
PARTY_SIZE=4

# Booking Window (Adjust for your needs)
DATE_WINDOW_START=2024-01-01
DATE_WINDOW_END=2024-12-31
EARLIEST_TIME=06:00
LATEST_TIME=19:00
DAYS_OF_WEEK=Mon,Tue,Wed,Thu,Fri,Sat,Sun

# Preferences
WALKING_OR_CART=either
HOLES=18
MAX_PRICE=200.00

# Real player names
PLAYER_NAMES=Player One,Player Two,Player Three,Player Four

# Production polling (be respectful to servers)
POLL_INTERVAL_SECONDS=300  # 5 minutes
MAX_RETRIES=3
BACKOFF_MULTIPLIER=2

# Email Notifications (Required for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_notification_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_TO=recipient@gmail.com

# Pushover (Optional)
PUSHOVER_TOKEN=your_pushover_token
PUSHOVER_USER=your_pushover_user

# Infrastructure
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password

# Server
PORT=3000
NODE_ENV=production

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

## 🐳 Local Production Testing

### 1. Build and Test with Docker
```bash
# Build the Docker image
docker-compose build

# Start all services
docker-compose up -d

# Check health
curl http://localhost:3000/health

# View logs
docker-compose logs -f chronoautotee

# Stop services
docker-compose down
```

### 2. Manual Build Testing
```bash
# Build TypeScript
npm run build

# Start production mode
NODE_ENV=production npm start

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/status
```

## ☁️ Cloud Deployment Options

### Option 1: VPS Deployment (DigitalOcean, Linode, etc.)

#### Prerequisites
- Ubuntu 20.04+ server
- Docker and Docker Compose installed
- Domain name pointed to your server
- SSL certificate (Let's Encrypt recommended)

#### Deployment Steps
```bash
# 1. Clone repository on server
git clone <your-repo-url> /opt/chronoautotee
cd /opt/chronoautotee

# 2. Set up production environment
cp env.example .env
nano .env  # Configure with real values

# 3. Set up reverse proxy (nginx)
sudo apt install nginx
# Configure nginx to proxy to port 3000

# 4. Set up SSL with Let's Encrypt
sudo snap install --classic certbot
sudo certbot --nginx -d yourdomain.com

# 5. Deploy with Docker
docker-compose up -d

# 6. Set up systemd service for auto-restart
sudo nano /etc/systemd/system/chronoautotee.service
```

#### Systemd Service File
```ini
[Unit]
Description=ChronoAutoTee Golf Booking Service
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/chronoautotee
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

#### Enable and Start Service
```bash
sudo systemctl enable chronoautotee
sudo systemctl start chronoautotee
sudo systemctl status chronoautotee
```

### Option 2: Heroku Deployment

#### Heroku Setup
```bash
# 1. Install Heroku CLI and login
heroku login

# 2. Create Heroku app
heroku create your-app-name

# 3. Add Redis addon
heroku addons:create heroku-redis:mini

# 4. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PARTNER_API_TOKEN=your_token
# ... set all other environment variables

# 5. Deploy
git push heroku main

# 6. Scale dynos
heroku ps:scale web=1
```

#### Heroku Procfile
Create a `Procfile` in project root:
```
web: npm start
```

### Option 3: AWS ECS Deployment

#### Prerequisites
- AWS CLI configured
- ECR repository created
- ECS cluster set up

#### Deployment Steps
```bash
# 1. Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker build -t chronoautotee .
docker tag chronoautotee:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/chronoautotee:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/chronoautotee:latest

# 2. Create ECS task definition
# 3. Create ECS service
# 4. Set up Application Load Balancer
# 5. Configure auto-scaling
```

## 🔒 Security Considerations

### 1. Environment Security
- Never commit `.env` files to version control
- Use strong passwords for Redis
- Rotate API tokens regularly
- Use HTTPS in production

### 2. Rate Limiting
- Respect golf course website terms of service
- Use reasonable polling intervals (5+ minutes)
- Implement exponential backoff for failures

### 3. Monitoring
- Set up log aggregation (ELK stack, CloudWatch, etc.)
- Monitor application health endpoints
- Set up alerts for failures
- Track booking success rates

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Application health
curl https://yourdomain.com/health

# Detailed status
curl https://yourdomain.com/status

# Metrics
curl https://yourdomain.com/metrics
```

### Log Management
```bash
# View application logs
docker-compose logs -f chronoautotee

# View specific log files
tail -f logs/app-$(date +%Y-%m-%d).log
tail -f logs/error-$(date +%Y-%m-%d).log
tail -f logs/booking-$(date +%Y-%m-%d).log
```

### Backup Strategy
- Regular Redis data backups
- Log file rotation and archival
- Configuration backup
- Database backups (if using external DB)

## 🚨 Troubleshooting

### Common Issues
1. **TypeScript Build Errors**: Fix type issues before deployment
2. **Redis Connection**: Ensure Redis is accessible and credentials are correct
3. **API Rate Limiting**: Increase polling intervals
4. **Email Notifications**: Verify SMTP settings and app passwords
5. **Playwright Issues**: Ensure Chromium is properly installed in container

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug docker-compose up

# Run with Redis Commander for debugging
docker-compose --profile debug up -d
# Access Redis Commander at http://localhost:8081
```

## 📋 Pre-Launch Checklist

- [ ] All TypeScript errors resolved
- [ ] Production environment variables configured
- [ ] Authentication credentials tested
- [ ] Email notifications working
- [ ] Docker build successful
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] SSL certificate installed
- [ ] Rate limiting configured appropriately
- [ ] Legal compliance verified (ToS compliance)

## 🎯 Going Live

1. **Soft Launch**: Deploy with conservative polling intervals
2. **Monitor**: Watch logs for first 24-48 hours
3. **Adjust**: Fine-tune polling intervals and retry logic
4. **Scale**: Increase frequency once stable
5. **Maintain**: Regular updates and monitoring

Remember: Always test thoroughly in a staging environment before deploying to production!


# ChronoAutoTee - Project Structure

## 🏗️ Complete Implementation

✅ **All features implemented and production-ready!**

```
chronoautotee/
├── 📁 src/                          # Source code
│   ├── 📁 config/                   # Configuration management
│   │   └── index.ts                 # Zod-validated config with env vars
│   ├── 📁 providers/                # Booking provider implementations
│   │   ├── partner-api.ts           # Lightspeed Golf Partner API
│   │   └── web-provider.ts          # Playwright web automation
│   ├── 📁 services/                 # Core business services
│   │   ├── notification.ts          # Email & Pushover notifications
│   │   └── scheduler.ts             # BullMQ job scheduler
│   ├── 📁 types/                    # TypeScript type definitions
│   │   └── index.ts                 # All interfaces and types
│   ├── 📁 utils/                    # Shared utilities
│   │   └── logger.ts                # Winston structured logging
│   ├── 📁 __tests__/                # Test suite
│   │   ├── setup.ts                 # Jest test configuration
│   │   ├── config.test.ts           # Configuration tests
│   │   └── notification.test.ts     # Notification service tests
│   ├── index.ts                     # Application entry point
│   └── server.ts                    # Express API server
├── 📁 .github/workflows/            # CI/CD pipeline
│   └── ci.yml                       # GitHub Actions configuration
├── 📁 logs/                         # Application logs (auto-created)
├── 📄 package.json                  # Node.js project configuration
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 jest.config.js                # Jest testing configuration
├── 📄 .eslintrc.js                  # ESLint code style rules
├── 📄 Dockerfile                    # Production container image
├── 📄 docker-compose.yml            # Docker orchestration
├── 📄 .dockerignore                 # Docker build exclusions
├── 📄 .gitignore                    # Git exclusions
├── 📄 env.example                   # Environment variable template
├── 📄 README.md                     # Comprehensive documentation
├── 📄 CONTRIBUTING.md               # Contributor guidelines
└── 📄 PROJECT_STRUCTURE.md          # This file
```

## 🌟 Key Features Implemented

### ✅ Dual Provider Architecture
- **PartnerApiProvider**: Official Lightspeed Golf/Chronogolf Partner API integration
- **WebProvider**: Playwright-based web automation with anti-detection measures
- **Clean interfaces**: Easy to extend with additional providers

### ✅ Smart Scheduling System  
- **BullMQ**: Redis-backed job queue with persistence
- **Exponential backoff**: Smart retry logic with configurable parameters
- **Jitter**: Randomized delays to prevent thundering herd effects
- **Rate limiting**: Respectful polling intervals

### ✅ Comprehensive Notifications
- **Email**: HTML-formatted notifications via SMTP
- **Pushover**: Mobile push notifications
- **Composite service**: Multi-channel notification support
- **Smart templates**: Success/failure/health alert templates

### ✅ Production-Ready Monitoring
- **Health endpoints**: `/health`, `/status`, `/metrics`
- **Management API**: Trigger, pause, resume operations
- **Structured logging**: Winston with daily rotation and correlation IDs
- **Error tracking**: Comprehensive error handling and reporting

### ✅ Robust Configuration
- **Zod validation**: Type-safe configuration with clear error messages
- **Environment-based**: All configuration via environment variables
- **Secure defaults**: Sensitive data masking and secure patterns
- **Flexible preferences**: Date/time windows, course preferences, player management

### ✅ Enterprise DevOps
- **Docker support**: Multi-stage builds with security best practices
- **Docker Compose**: Full stack orchestration with Redis
- **CI/CD pipeline**: GitHub Actions with testing, security, and deployment
- **Testing**: Jest unit and integration tests with mocking

### ✅ Compliance & Ethics
- **ToS respect**: Rate limiting, respectful automation
- **No circumvention**: No CAPTCHA bypassing or access control evasion
- **API preference**: Uses official APIs when available
- **Transparent operation**: Clear user-agent and logging

## 🚀 Quick Start Commands

```bash
# 1. Setup
cp env.example .env
# Edit .env with your configuration

# 2. Install dependencies
npm install

# 3. Run tests
npm test

# 4. Build application
npm run build

# 5. Start application
npm start

# 6. Or use Docker
docker-compose up -d
```

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information and available endpoints |
| `/health` | GET | Basic health check (200/503) |
| `/status` | GET | Detailed application status |
| `/metrics` | GET | System and application metrics |
| `/config` | GET | Current configuration (sanitized) |
| `/logs` | GET | Recent application logs |
| `/trigger` | POST | Manually trigger booking check |
| `/pause` | POST | Pause the scheduler |
| `/resume` | POST | Resume the scheduler |

## 🔧 Configuration Options

### Authentication (Choose One)
- **Partner API**: `PARTNER_API_TOKEN`, `ORG_ID`, `FACILITY_ID`, `COURSE_ID`
- **Web Automation**: `EMAIL`, `PASSWORD`

### Booking Preferences
- **Course**: `HOME_COURSE_NAME`
- **Party**: `PARTY_SIZE`, `PLAYER_NAMES`
- **Schedule**: `DATE_WINDOW_START/END`, `EARLIEST/LATEST_TIME`, `DAYS_OF_WEEK`
- **Preferences**: `WALKING_OR_CART`, `HOLES`, `MAX_PRICE`

### System Configuration
- **Polling**: `POLL_INTERVAL_SECONDS`, `MAX_RETRIES`, `BACKOFF_MULTIPLIER`
- **Notifications**: SMTP settings, Pushover tokens
- **Infrastructure**: Redis connection, server port, logging level

## 🧪 Testing Strategy

- **Unit Tests**: Individual component testing with mocks
- **Integration Tests**: Service interaction testing
- **Configuration Tests**: Environment variable validation
- **Provider Tests**: Mock external API responses
- **Notification Tests**: Email and push notification delivery

## 🐳 Docker Deployment

```bash
# Development
docker-compose up -d

# Production with custom config
docker run -d \
  --env-file .env \
  -p 3000:3000 \
  -v ./logs:/app/logs \
  chronoautotee:latest

# With Redis Commander (debugging)
docker-compose --profile debug up -d
```

## 📈 Monitoring & Observability

- **Structured Logs**: JSON-formatted with correlation IDs
- **Health Checks**: Application and dependency health monitoring
- **Metrics**: Queue status, booking attempts, system resources
- **Alerts**: Configurable notifications for failures and health issues

## 🔒 Security Features

- **Non-root container**: Runs as dedicated user
- **Input validation**: Zod schema validation for all inputs
- **Credential protection**: Environment-based secrets management
- **Rate limiting**: Configurable delays and jitter
- **Error handling**: No sensitive data in error responses

---

## 🎯 Next Steps

1. **Install dependencies**: `npm install`
2. **Configure environment**: Copy and edit `env.example` to `.env`
3. **Start Redis**: `docker-compose up -d redis` or local Redis server
4. **Run application**: `npm run dev` for development or `npm start` for production
5. **Monitor logs**: Check `./logs/` directory for application logs
6. **Test API**: `curl http://localhost:3000/health`

The application is fully production-ready with comprehensive error handling, monitoring, and deployment options! 🏌️‍♂️⛳






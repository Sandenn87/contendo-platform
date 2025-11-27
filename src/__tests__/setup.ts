import { jest } from '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.HOME_COURSE_NAME = 'Test Golf Course';
process.env.DATE_WINDOW_START = '2024-01-01';
process.env.DATE_WINDOW_END = '2024-12-31';
process.env.EARLIEST_TIME = '07:00';
process.env.LATEST_TIME = '18:00';
process.env.DAYS_OF_WEEK = 'Mon,Tue,Wed,Thu,Fri,Sat,Sun';
process.env.PARTY_SIZE = '4';
process.env.PLAYER_NAMES = 'Test Player 1,Test Player 2,Test Player 3,Test Player 4';
process.env.WALKING_OR_CART = 'either';
process.env.HOLES = '18';
process.env.POLL_INTERVAL_SECONDS = '60';
process.env.MAX_RETRIES = '3';
process.env.BACKOFF_MULTIPLIER = '2';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error';
process.env.LOG_FILE_PATH = './logs/test';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};


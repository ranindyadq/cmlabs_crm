import winston from 'winston';
import 'winston-daily-rotate-file'; // Import plugin rotation

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Konfigurasi Rotasi untuk Log Gabungan (Combined)
const dailyRotateCombined = new winston.transports.DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,     // Kompres file lama jadi .gz (hemat tempat!)
  maxSize: '20m',          // Pecah file jika sudah mencapai 20MB
  maxFiles: '14d',         // Hapus log yang lebih tua dari 14 hari
});

// Konfigurasi Rotasi khusus untuk Error
const dailyRotateError = new winston.transports.DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '30d',         // Error disimpan lebih lama (30 hari) untuk audit
  level: 'error',
});

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    dailyRotateCombined,
    dailyRotateError,
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    })
  );
}

export default logger;
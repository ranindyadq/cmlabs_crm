import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Inisialisasi logger tanpa file transport untuk Production
const logger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
  ],
});

// Hapus atau beri komentar bagian yang menambahkan File transport (DailyRotateFile, dll)
// Karena Vercel adalah Read-Only File System (EROFS)

export default logger;
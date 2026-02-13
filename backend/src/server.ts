import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   ContentHub API Server                  ║
║                                          ║
║   🚀 Server running on port ${PORT}        ║
║   📝 Environment: ${process.env.NODE_ENV || 'development'}      ║
║   🌐 API Base: http://localhost:${PORT}/api  ║
║                                          ║
╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

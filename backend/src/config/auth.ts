import dotenv from 'dotenv';

dotenv.config();

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'default_secret_change_this',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret_change_this',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  bcryptRounds: 10
};

export default authConfig;

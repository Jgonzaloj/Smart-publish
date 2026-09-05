import dotenv from 'dotenv';
import path from 'path';

// Load .env before any application modules are evaluated
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

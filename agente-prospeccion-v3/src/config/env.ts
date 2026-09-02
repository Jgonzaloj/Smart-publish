import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  USE_MOCK_MODE: process.env.USE_MOCK_MODE !== 'false',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || 'localhost',
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || '',
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'gemini',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN || '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  WHATSAPP_TEMPLATE_NAME: process.env.WHATSAPP_TEMPLATE_NAME || 'first_contact_audit_v1',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Prospección Técnica <auditoria@tudominio.com>',
  MAX_BOUNCE_RATE: parseFloat(process.env.MAX_BOUNCE_RATE || '0.05'),
  MAX_DAILY_WHATSAPP_SENDS: parseInt(process.env.MAX_DAILY_WHATSAPP_SENDS || '50', 10),
  MAX_DAILY_EMAIL_SENDS: parseInt(process.env.MAX_DAILY_EMAIL_SENDS || '100', 10),
  ADMIN_USER: process.env.ADMIN_USER || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'agente2026vawi',
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'agente_prospeccion_webhook_token_2026',
  WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET || '',
  RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET || '',
  DEFAULT_COUNTRY_CODE: process.env.DEFAULT_COUNTRY_CODE || '+51',
  FOLLOWUP_1_HOURS: parseInt(process.env.FOLLOWUP_1_HOURS || '48', 10),
  FOLLOWUP_2_HOURS: parseInt(process.env.FOLLOWUP_2_HOURS || '72', 10),
  SCHEDULER_ENABLED: process.env.SCHEDULER_ENABLED !== 'false',
  SCHEDULER_INTERVAL_MINUTES: parseInt(process.env.SCHEDULER_INTERVAL_MINUTES || '60', 10),
  DEFAULT_CLOSER_NAME: process.env.DEFAULT_CLOSER_NAME || 'Equipo de Cierre Humano',
  CLOSER_NOTIFICATION_EMAIL: process.env.CLOSER_NOTIFICATION_EMAIL || '',
  CLOSER_NOTIFICATION_PHONE: process.env.CLOSER_NOTIFICATION_PHONE || '',
  DB_PATH: path.resolve(process.cwd(), 'storage', 'database.sqlite'),
  STORAGE_PATH: path.resolve(process.cwd(), 'storage'),
  SCREENSHOTS_PATH: path.resolve(process.cwd(), 'storage', 'screenshots'),
};


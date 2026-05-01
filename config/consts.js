import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const PORT = process.env.PORT || 3000;

export const DB_CONFIG = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};

export const EMAIL_CONFIG = {
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.MAIL_FROM || "DataField <onboarding@resend.dev>",
};
export const CLOUDINARY_CONFIG = {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

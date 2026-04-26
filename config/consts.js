import dotenv from "dotenv"

dotenv.config({quiet:true})

export const PORT = 3000

export const DB_CONFIG = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
}

export const EMAIL_CONFIG = {
    host: process.env.MAIL_HOST || 'smtp.resend.com',
    port: process.env.MAIL_PORT || 587,
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || 'DataField <onboarding@resend.dev>'
}
export const CLOUDINARY_CONFIG = {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}

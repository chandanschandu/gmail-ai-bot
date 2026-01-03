
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(express.json());
app.use(cors());

// ====== CONFIG ======
// const MONGODB_URI = 'mongodb+srv://chandans7711_db_user:Coolpad0101%40@cluster0.20ep56d.mongodb.net/?appName=Cluster0';
// const N8N_URL = 'https://primary-production-74db.up.railway.app';
// const GOOGLE_CLIENT_ID = '587945469976-jvb0htoknrvo8vu3tvvbdpf64r4v8l9u.apps.googleusercontent.com';
// const GOOGLE_CLIENT_SECRET = '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';
// const GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/callback';
// const WEBHOOK_URL = 'https://primary-production-74db.up.railway.app/webhook/email-reply';
// Use environment variables for production, fallback to hardcoded for local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://chandans7711_db_user:Coolpad0101%40@cluster0.20ep56d.mongodb.net/?appName=Cluster0';
const N8N_URL = process.env.N8N_URL || 'https://primary-production-74db.up.railway.app';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '587945469976-jvb0htoknrvo8vu3tvvbdpf64r4v8l9u.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://primary-production-74db.up.railway.app/webhook/email-reply';

// Dynamic redirect URI for Railway deployment
const GOOGLE_REDIRECT_URI = process.env.RAILWAY_PUBLIC_DOMAIN 
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/auth/callback`
  : process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback';


// Simple admin password (change this!)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';


// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error', err));

// User schema
const UserSchema = new mongoose.Schema({
  email: String,
  googleTokens: Object,
  n8nWebhookUrl: String,
  lastEmailCheck: Date,
  automationActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// Google OAuth client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// ============================================
// SHARED CSS STYLES
// ============================================
const sharedStyles = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a;
      min-height: 100vh;
      padding: 20px;
      position: relative;
      overflow-x: hidden;
    }
    
    /* Animated gradient background */
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, 
        #667eea 0%, 
        #764ba2 25%, 
        #f093fb 50%, 
        #4facfe 75%, 
        #00f2fe 100%);
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
      opacity: 0.15;
      z-index: 0;
    }
    
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    /* Floating particles */
    body::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(79, 172, 254, 0.1) 0%, transparent 50%);
      animation: particleFloat 20s ease-in-out infinite;
      z-index: 0;
    }
    
    @keyframes particleFloat {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(30px, -30px); }
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-radius: 32px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.05) inset,
        0 2px 8px rgba(255, 255, 255, 0.1) inset;
      overflow: hidden;
      position: relative;
      z-index: 1;
      transform-style: preserve-3d;
      transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    }
    
    .container:hover {
      transform: translateY(-4px);
      box-shadow: 
        0 16px 64px rgba(102, 126, 234, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset,
        0 2px 12px rgba(255, 255, 255, 0.15) inset;
    }
    
    .header {
      background: linear-gradient(135deg, 
        rgba(102, 126, 234, 0.9) 0%, 
        rgba(118, 75, 162, 0.9) 100%);
      backdrop-filter: blur(10px);
      color: white;
      padding: 60px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: headerGlow 10s linear infinite;
    }
    
    @keyframes headerGlow {
      0% { transform: translate(0, 0) rotate(0deg); }
      100% { transform: translate(50%, 50%) rotate(360deg); }
    }
    
    .header h1 {
      font-size: 56px;
      margin-bottom: 16px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 20px rgba(255, 255, 255, 0.3);
    }
    
    .header p {
      font-size: 20px;
      opacity: 0.95;
      font-weight: 400;
      position: relative;
      z-index: 1;
      letter-spacing: -0.2px;
    }
    
    .content {
      padding: 60px 50px;
      position: relative;
    }
    
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 18px 48px;
      text-decoration: none;
      border-radius: 16px;
      font-size: 18px;
      font-weight: 600;
      transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
      border: none;
      cursor: pointer;
      box-shadow: 
        0 8px 24px rgba(102, 126, 234, 0.4),
        0 2px 8px rgba(255, 255, 255, 0.1) inset;
      position: relative;
      overflow: hidden;
      letter-spacing: -0.2px;
    }
    
    .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }
    
    .btn:hover::before {
      left: 100%;
    }
    
    .btn:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 
        0 16px 40px rgba(102, 126, 234, 0.5),
        0 2px 12px rgba(255, 255, 255, 0.15) inset;
    }
    
    .btn:active {
      transform: translateY(-1px) scale(0.98);
    }
    
    .btn-danger {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      box-shadow: 
        0 8px 24px rgba(245, 87, 108, 0.4),
        0 2px 8px rgba(255, 255, 255, 0.1) inset;
    }
    
    .btn-danger:hover {
      box-shadow: 
        0 16px 40px rgba(245, 87, 108, 0.5),
        0 2px 12px rgba(255, 255, 255, 0.15) inset;
    }
    
    .btn-success {
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      box-shadow: 
        0 8px 24px rgba(76, 175, 80, 0.4),
        0 2px 8px rgba(255, 255, 255, 0.1) inset;
    }
    
    .card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 40px;
      margin: 30px 0;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.2),
        0 1px 2px rgba(255, 255, 255, 0.1) inset;
      transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
      position: relative;
      overflow: hidden;
    }
    
    .card::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.4s;
    }
    
    .card:hover::before {
      opacity: 1;
    }
    
    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 0.15);
      box-shadow: 
        0 16px 48px rgba(0, 0, 0, 0.3),
        0 2px 4px rgba(255, 255, 255, 0.15) inset;
    }
    
    .card h2, .card h3 {
      color: #fff;
      margin-bottom: 12px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .card p {
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
      margin: 40px 0;
    }
    
    .stat-card {
      background: linear-gradient(135deg, 
        rgba(102, 126, 234, 0.2) 0%, 
        rgba(118, 75, 162, 0.2) 100%);
      backdrop-filter: blur(10px);
      color: white;
      padding: 40px;
      border-radius: 24px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.2),
        0 2px 8px rgba(255, 255, 255, 0.1) inset;
      transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
      position: relative;
      overflow: hidden;
    }
    
    .stat-card::after {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
      animation: statGlow 8s linear infinite;
    }
    
    @keyframes statGlow {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .stat-card:hover {
      transform: translateY(-8px) scale(1.02);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 
        0 20px 60px rgba(102, 126, 234, 0.4),
        0 2px 12px rgba(255, 255, 255, 0.2) inset;
    }
    
    .stat-card h3 {
      font-size: 56px;
      margin-bottom: 12px;
      font-weight: 800;
      background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      position: relative;
      z-index: 1;
    }
    
    .stat-card p {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 500;
      position: relative;
      z-index: 1;
      letter-spacing: 0.5px;
    }
    
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 8px;
      margin-top: 20px;
    }
    
    th, td {
      padding: 18px 20px;
      text-align: left;
      color: rgba(255, 255, 255, 0.9);
    }
    
    th {
      background: rgba(255, 255, 255, 0.05);
      font-weight: 600;
      color: #fff;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: none;
    }
    
    tbody tr {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      border-radius: 12px;
    }
    
    tbody tr:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateX(4px);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
    }
    
    tbody td:first-child {
      border-radius: 12px 0 0 12px;
    }
    
    tbody td:last-child {
      border-radius: 0 12px 12px 0;
    }
    
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .badge-success {
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(69, 160, 73, 0.3) 100%);
      color: #4ade80;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }
    
    .badge-danger {
      background: linear-gradient(135deg, rgba(245, 87, 108, 0.3) 0%, rgba(240, 68, 90, 0.3) 100%);
      color: #fb7185;
      border: 1px solid rgba(245, 87, 108, 0.3);
    }
    
    .emoji {
      font-size: 72px;
      margin: 24px 0;
      display: inline-block;
      animation: float 3s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    input[type="password"] {
      width: 100%;
      padding: 18px 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      font-size: 16px;
      color: #fff;
      margin: 12px 0;
      transition: all 0.3s ease;
      font-family: 'Inter', sans-serif;
    }
    
    input[type="password"]::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
    
    input[type="password"]:focus {
      outline: none;
      border-color: rgba(102, 126, 234, 0.5);
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }
    
    .alert {
      padding: 20px 24px;
      border-radius: 16px;
      margin: 24px 0;
      backdrop-filter: blur(10px);
      border: 1px solid;
    }
    
    .alert-success {
      background: rgba(76, 175, 80, 0.15);
      color: #4ade80;
      border-color: rgba(76, 175, 80, 0.3);
    }
    
    /* Feature grid enhancement */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      text-align: left;
    }
    
    .feature-item {
      padding: 24px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.3s ease;
    }
    
    .feature-item:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 0.15);
    }
    
    .feature-item h3 {
      font-size: 20px;
      margin-bottom: 8px;
      color: #fff;
    }
    
    .feature-item p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 15px;
    }
    
    /* Scrollbar styling */
    ::-webkit-scrollbar {
      width: 12px;
    }
    
    ::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
    }
    
    ::-webkit-scrollbar-thumb {
      background: rgba(102, 126, 234, 0.5);
      border-radius: 6px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(102, 126, 234, 0.7);
    }
    
    /* Responsive */
  /* ============================================ */
/* MOBILE & TABLET RESPONSIVE DESIGN */
/* ============================================ */

/* Tablet (768px - 1024px) */
@media (max-width: 1024px) {
  body { padding: 15px; }
  .container { border-radius: 24px; }
  .header { padding: 50px 30px; }
  .header h1 { font-size: 48px; }
  .content { padding: 40px 30px; }
  .card { padding: 30px; }
  
  .feature-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
  }
  
  .stats {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
  }
  
  table {
    font-size: 14px;
  }
  
  th, td {
    padding: 14px 16px;
  }
}

/* Mobile (max 768px) */
@media (max-width: 768px) {
  body { 
    padding: 10px; 
    font-size: 14px;
  }
  
  .container { 
    border-radius: 20px;
    margin: 10px 0;
  }
  
  .container:hover {
    transform: none; /* Disable hover lift on mobile */
  }
  
  .header { 
    padding: 40px 20px;
  }
  
  .header h1 { 
    font-size: 32px;
    line-height: 1.2;
    margin-bottom: 12px;
  }
  
  .header p { 
    font-size: 15px;
    line-height: 1.5;
  }
  
  .content { 
    padding: 30px 20px;
  }
  
  .card { 
    padding: 24px;
    margin: 20px 0;
    border-radius: 16px;
  }
  
  .card h2 {
    font-size: 22px;
  }
  
  .card h3 {
    font-size: 18px;
  }
  
  /* Feature grid - Stack on mobile */
  .feature-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .feature-item {
    padding: 20px;
  }
  
  .feature-item h3 {
    font-size: 18px;
  }
  
  .feature-item p {
    font-size: 14px;
  }
  
  /* Stats cards - 1 column on mobile */
  .stats {
    grid-template-columns: 1fr;
    gap: 16px;
    margin: 30px 0;
  }
  
  .stat-card {
    padding: 30px 20px;
  }
  
  .stat-card h3 { 
    font-size: 44px;
  }
  
  .stat-card p {
    font-size: 15px;
  }
  
  /* Buttons - Full width on mobile */
  .btn { 
    width: 100%;
    padding: 16px 32px;
    font-size: 16px;
    margin: 8px 0 !important;
    display: block;
    text-align: center;
  }
  
  .btn:hover {
    transform: translateY(-2px) scale(1);
  }
  
  /* Emoji smaller on mobile */
  .emoji {
    font-size: 56px;
    margin: 16px 0;
  }
  
  /* Table responsive - Scroll horizontally */
  .card {
    overflow-x: auto;
  }
  
  table {
    min-width: 600px;
    font-size: 13px;
  }
  
  th, td {
    padding: 12px 10px;
    font-size: 13px;
  }
  
  th {
    font-size: 11px;
  }
  
  .badge {
    padding: 4px 12px;
    font-size: 12px;
  }
  
  /* Form inputs */
  input[type="password"] {
    padding: 16px 20px;
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  /* Alert */
  .alert {
    padding: 16px 20px;
    font-size: 14px;
  }
  
  /* Admin dashboard specific */
  .stat-card:hover {
    transform: translateY(-4px) scale(1); /* Reduce scale on mobile */
  }
  
  tbody tr:hover {
    transform: none; /* Disable hover transform on mobile tables */
  }
}

/* Small Mobile (max 480px) */
@media (max-width: 480px) {
  body { 
    padding: 8px; 
  }
  
  .container {
    border-radius: 16px;
  }
  
  .header { 
    padding: 30px 16px;
  }
  
  .header h1 { 
    font-size: 28px;
  }
  
  .header p { 
    font-size: 14px;
  }
  
  .content { 
    padding: 24px 16px;
  }
  
  .card {
    padding: 20px;
    margin: 16px 0;
  }
  
  .card h2 {
    font-size: 20px;
  }
  
  .stat-card {
    padding: 24px 16px;
  }
  
  .stat-card h3 {
    font-size: 36px;
  }
  
  .stat-card p {
    font-size: 14px;
  }
  
  .btn {
    padding: 14px 24px;
    font-size: 15px;
  }
  
  .emoji {
    font-size: 48px;
  }
  
  table {
    font-size: 12px;
  }
  
  th, td {
    padding: 10px 8px;
  }
  
  /* Action buttons in table - Stack vertically */
  tbody td:last-child {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  tbody td:last-child .btn {
    width: 100%;
    margin: 0 !important;
  }
}

/* iPhone SE / Very Small Screens (max 375px) */
@media (max-width: 375px) {
  .header h1 { 
    font-size: 24px;
  }
  
  .header p {
    font-size: 13px;
  }
  
  .card h2 {
    font-size: 18px;
  }
  
  .feature-item h3 {
    font-size: 16px;
  }
  
  .stat-card h3 {
    font-size: 32px;
  }
  
  .btn {
    font-size: 14px;
    padding: 12px 20px;
  }
}

/* Landscape Mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .header {
    padding: 20px;
  }
  
  .header h1 {
    font-size: 24px;
    margin-bottom: 8px;
  }
  
  .header p {
    font-size: 13px;
  }
  
  .emoji {
    font-size: 36px;
    margin: 10px 0;
  }
  
  .content {
    padding: 20px;
  }
  
  .card {
    padding: 16px;
    margin: 12px 0;
  }
  
  .stats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .stat-card {
    padding: 20px 16px;
  }
  
  .stat-card h3 {
    font-size: 32px;
  }
}

/* Prevent text zoom on iOS */
@supports (-webkit-touch-callout: none) {
  input, textarea, select {
    font-size: 16px !important;
  }
}

  </style>
`;


// ============================================
// ROUTES
// ============================================

// Home page (User)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

      <title>AI Email Auto-Reply Bot</title>
      ${sharedStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="emoji">🤖</div>
          <h1>AI Email Auto-Reply Bot</h1>
          <p>Connect your Gmail and get intelligent automatic replies powered by AI</p>
        </div>
        <div class="content" style="text-align: center;">
          <div class="card">
            <h2 style="color: #667eea; margin-bottom: 20px;">✨ Features</h2>
            <div class="feature-grid">

              <div>
                <h3>⚡ Instant Replies</h3>
                <p>AI responds within 60 seconds</p>
              </div>
              <div>
                <h3>🎯 Smart Filtering</h3>
                <p>Only replies to personal emails</p>
              </div>
              <div>
                <h3>🔒 Secure</h3>
                <p>Your data stays private</p>
              </div>
              <div>
                <h3>🚀 Easy Setup</h3>
                <p>Connect in just one click</p>
              </div>
            </div>
          </div>
          <div style="margin: 40px 0;">
            <a href="/connect-gmail" class="btn" style="margin: 10px;">📧 Connect Gmail</a>
            <a href="/admin" class="btn" style="margin: 10px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">🔐 Admin Login</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Admin Login Page
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
     <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

      <title>Admin Login</title>
      ${sharedStyles}
    </head>
    <body>
      <div class="container" style="max-width: 500px; margin-top: 100px;">
        <div class="header">
          <div class="emoji">🔐</div>
          <h1>Admin Login</h1>
          <p>Enter admin password to continue</p>
        </div>
        <div class="content">
          <form action="/admin/dashboard" method="GET">
            <input type="password" name="password" placeholder="Enter admin password" required>
            <button type="submit" class="btn" style="width: 100%; margin-top: 20px;">Login</button>
          </form>
          <div style="text-align: center; margin-top: 20px;">
            <a href="/" style="color: #667eea; text-decoration: none;">← Back to Home</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Admin Dashboard
app.get('/admin/dashboard', async (req, res) => {
  const { password } = req.query;
  
  if (password !== ADMIN_PASSWORD) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Access Denied</title>${sharedStyles}</head>
      <body>
        <div class="container" style="max-width: 500px; margin-top: 100px;">
          <div class="content" style="text-align: center;">
            <div class="emoji">❌</div>
            <h2 style="color: #f5576c;">Access Denied</h2>
            <p>Invalid admin password</p>
            <a href="/admin" class="btn" style="margin-top: 20px;">Try Again</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const activeUsers = users.filter(u => u.automationActive).length;
    
    const userRows = users.map(user => `
      <tr>
        <td>${user.email}</td>
        <td><span class="badge badge-${user.automationActive ? 'success' : 'danger'}">${user.automationActive ? '✅ Active' : '❌ Inactive'}</span></td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td>${user.lastEmailCheck ? new Date(user.lastEmailCheck).toLocaleString() : 'Never'}</td>
        <td>
          <button onclick="toggleUser('${user.email}')" class="btn btn-success" style="padding: 8px 20px; font-size: 14px; margin-right: 10px;">
            ${user.automationActive ? 'Disable' : 'Enable'}
          </button>
          <button onclick="deleteUser('${user.email}')" class="btn btn-danger" style="padding: 8px 20px; font-size: 14px;">
            Delete
          </button>
        </td>
      </tr>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

        <title>Admin Dashboard</title>
        ${sharedStyles}
        <script>
          async function toggleUser(email) {
            if (!confirm('Toggle automation for ' + email + '?')) return;
            const res = await fetch('/toggle-automation/' + encodeURIComponent(email), { method: 'PATCH' });
            if (res.ok) {
              alert('Automation toggled successfully!');
              location.reload();
            } else {
              alert('Error toggling automation');
            }
          }

          async function deleteUser(email) {
            if (!confirm('Are you sure you want to delete ' + email + '? This cannot be undone!')) return;
            const res = await fetch('/delete-user/' + encodeURIComponent(email), { method: 'DELETE' });
            if (res.ok) {
              alert('User deleted successfully!');
              location.reload();
            } else {
              alert('Error deleting user');
            }
          }
        </script>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">👨‍💼</div>
            <h1>Admin Dashboard</h1>
            <p>Manage connected users and monitor system</p>
          </div>
          <div class="content">
            <div class="stats">
              <div class="stat-card">
                <h3>${users.length}</h3>
                <p>Total Users</p>
              </div>
              <div class="stat-card" style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);">
                <h3>${activeUsers}</h3>
                <p>Active Users</p>
              </div>
              <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <h3>${users.length - activeUsers}</h3>
                <p>Inactive Users</p>
              </div>
            </div>

            <div class="card">
              <h2 style="color: #667eea; margin-bottom: 20px;">👥 Connected Users</h2>
              ${users.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Connected</th>
                      <th>Last Check</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${userRows}
                  </tbody>
                </table>
              ` : `
                <div style="text-align: center; padding: 40px; color: #999;">
                  <div class="emoji" style="font-size: 48px;">📭</div>
                  <p>No users connected yet</p>
                </div>
              `}
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="/" class="btn">🏠 Back to Home</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Error loading dashboard: ' + error.message);
  }
});

// User clicks "Connect Gmail"
app.get('/connect-gmail', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid',
    ],
  });
  res.redirect(url);
});

// OAuth callback
app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const me = await oauth2.userinfo.get();
    const email = me.data.email;
    
    console.log(`📧 Connected Gmail: ${email}`);

    await User.findOneAndUpdate(
      { email },
      { 
        email, 
        googleTokens: tokens,
        n8nWebhookUrl: WEBHOOK_URL,
        lastEmailCheck: new Date(),
        automationActive: true
      },
      { upsert: true, new: true }
    );

    console.log(`✅ User saved: ${email}`);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

        <title>Success!</title>
        ${sharedStyles}
      </head>
      <body>
        <div class="container" style="max-width: 700px; margin-top: 50px;">
          <div class="header">
            <div class="emoji">✅</div>
            <h1>Successfully Connected!</h1>
            <p>Your Gmail is now connected to AI Auto-Reply Bot</p>
          </div>
          <div class="content">
            <div class="alert alert-success">
              <strong>📧 Email:</strong> ${email}
            </div>
            <div class="card">
              <h3 style="color: #667eea;">🎉 What's Next?</h3>
              <ul style="line-height: 2; font-size: 16px;">
                <li>✅ Auto-replies are now active</li>
                <li>✅ AI will respond within 60 seconds</li>
                <li>✅ Only personal emails get replies</li>
                <li>✅ Automated emails are skipped</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="/" class="btn">🏠 Back to Home</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('❌ OAuth error:', err.message);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Error</title>${sharedStyles}</head>
      <body>
        <div class="container" style="max-width: 500px; margin-top: 100px;">
          <div class="content" style="text-align: center;">
            <div class="emoji">❌</div>
            <h2 style="color: #f5576c;">Connection Failed</h2>
            <p>${err.message}</p>
            <a href="/" class="btn" style="margin-top: 20px;">Try Again</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

// API: Toggle automation
app.patch('/toggle-automation/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.automationActive = !user.automationActive;
    await user.save();
    
    console.log(`🔄 Automation ${user.automationActive ? 'enabled' : 'disabled'} for ${user.email}`);
    res.json({ success: true, active: user.automationActive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete user
app.delete('/delete-user/:email', async (req, res) => {
  try {
    const result = await User.findOneAndDelete({ email: req.params.email });
    if (result) {
      console.log(`🗑️ User deleted: ${req.params.email}`);
      res.json({ success: true, message: 'User deleted' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GMAIL POLLING SERVICE
// ============================================

async function checkGmailForUser(user) {
  try {
    if (!user.automationActive) return;

    const userOAuth = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
    
    userOAuth.setCredentials(user.googleTokens);
    const gmail = google.gmail({ version: 'v1', auth: userOAuth });

    console.log(`\n👤 Checking Gmail for: ${user.email}`);

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread in:inbox',
      maxResults: 5
    });

    const messages = response.data.messages || [];
    if (messages.length === 0) return;

    console.log(`📧 Found ${messages.length} new email(s) for ${user.email}`);

    for (const message of messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });

      const headers = msg.data.payload.headers;
      const from = headers.find(h => h.name === 'From')?.value || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      
      const skipKeywords = [
        'noreply', 'no-reply', 'donotreply', 'notification', 'alert',
        'timesjobs.com', 'jobalert', 'naukri.com', 'indeed.com',
        'instagram.com', 'facebook.com', 'twitter.com', 'linkedin.com',
        'pinterest.com', 'infosys.com', 'adobe.com', 'zapier.com',
        'newsletter', 'marketing@', 'promotions@', 'updates@', 'news@',
        'info@', 'support@', 'team@', 'automated', 'mailer-daemon'
      ];

      const shouldSkip = skipKeywords.some(keyword => 
        from.toLowerCase().includes(keyword.toLowerCase())
      );

      if (shouldSkip) {
        console.log(`⏭️  [${user.email}] Skipping automated: ${from}`);
        await gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: { removeLabelIds: ['UNREAD'] }
        });
        continue;
      }

      const allUsers = await User.find({}, 'email');
      const userEmails = allUsers.map(u => u.email.toLowerCase());
      const fromEmail = from.match(/<(.+?)>/) ? from.match(/<(.+?)>/)[1] : from;
      
      if (userEmails.includes(fromEmail.toLowerCase())) {
        console.log(`⏭️  [${user.email}] Skipping connected user: ${from}`);
        await gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: { removeLabelIds: ['UNREAD'] }
        });
        continue;
      }

      console.log(`✅ [${user.email}] Personal email from: ${from}`);

      let body = '';
      if (msg.data.payload.parts) {
        const textPart = msg.data.payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (msg.data.payload.body?.data) {
        body = Buffer.from(msg.data.payload.body.data, 'base64').toString('utf-8');
      }

      console.log(`🤖 [${user.email}] Getting AI reply...`);

      const aiResponse = await axios.post(WEBHOOK_URL, {
        from, subject,
        emailBody: body.substring(0, 500),
        recipientEmail: user.email
      });

      const aiReply = aiResponse.data.reply;

      const replyRaw = [
        `From: ${user.email}`,
        `To: ${from}`,
        `Subject: Re: ${subject}`,
        `In-Reply-To: <${message.id}>`,
        `References: <${message.id}>`,
        'Content-Type: text/plain; charset=utf-8',
        '', aiReply
      ].join('\r\n');

      const encodedReply = Buffer.from(replyRaw)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedReply, threadId: msg.data.threadId }
      });

      await gmail.users.messages.modify({
        userId: 'me',
        id: message.id,
        requestBody: { removeLabelIds: ['UNREAD'] }
      });

      console.log(`✅ [${user.email}] Sent AI reply to: ${from}`);
    }

    user.lastEmailCheck = new Date();
    await user.save();

  } catch (error) {
    console.error(`❌ Error for ${user.email}:`, error.message);
  }
}

setInterval(async () => {
  try {
    const users = await User.find({ automationActive: true });
    if (users.length > 0) {
      console.log(`\n🔄 Checking emails for ${users.length} user(s)...`);
      for (const user of users) {
        await checkGmailForUser(user);
      }
    }
  } catch (error) {
    console.error('❌ Polling error:', error.message);
  }
}, 60000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
    : `http://localhost:${PORT}`;
  
  console.log('\n===========================================');
  console.log(`🚀 Server running on ${baseUrl}`);
  console.log(`🔐 Admin URL: ${baseUrl}/admin`);
  console.log(`🔑 Admin Password: ${ADMIN_PASSWORD}`);
  console.log('===========================================\n');
});


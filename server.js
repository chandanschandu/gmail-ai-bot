
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(express.json());
app.use(cors());
const path = require('path'); // Add at top with other requires
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files



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

    
    /* Responsive */



// ============================================
// ROUTES
// ============================================
// Home page (User)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Email Auto-Reply Bot</title>
      <link rel="stylesheet" href="/css/styles.css">
    </head>
    <body>
      <div class="container">
        <!-- Hero Header -->
        <div class="header">
          <div class="logo-3d">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="35" r="18" fill="url(#logoGrad)"/>
              <rect x="35" y="50" width="30" height="35" rx="5" fill="url(#logoGrad)"/>
              <circle cx="43" cy="32" r="4" fill="#000"/>
              <circle cx="57" cy="32" r="4" fill="#000"/>
              <path d="M 43 40 Q 50 42 57 40" stroke="#000" stroke-width="2" fill="none"/>
              <rect x="28" y="55" width="8" height="20" rx="3" fill="url(#logoGrad)" opacity="0.8"/>
              <rect x="64" y="55" width="8" height="20" rx="3" fill="url(#logoGrad)" opacity="0.8"/>
            </svg>
          </div>
          <h1>AI Email Auto-Reply Bot</h1>
          <p>Connect your Gmail and get intelligent automatic replies powered by AI</p>
        </div>

        <!-- Features Section -->
        <div class="content">
          <div class="features-container">
            <h2>Features</h2>
            <div class="features-grid">
              
              <!-- Feature 1 -->
              <div class="feature-card">
                <div class="feature-icon-container">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3>Instant Replies</h3>
                <p>AI responds within 60 seconds of receiving new emails</p>
              </div>

              <!-- Feature 2 -->
              <div class="feature-card">
                <div class="feature-icon-container">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3>Smart Filtering</h3>
                <p>Only replies to personal emails, skips spam and automated messages</p>
              </div>

              <!-- Feature 3 -->
              <div class="feature-card">
                <div class="feature-icon-container">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="white" stroke-width="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <h3>Secure & Private</h3>
                <p>Your data is encrypted and never shared with third parties</p>
              </div>

              <!-- Feature 4 -->
              <div class="feature-card">
                <div class="feature-icon-container">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
                    <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3>Easy Setup</h3>
                <p>Connect your Gmail account in just one click and start automating</p>
              </div>

            </div>
          </div>

          <!-- CTA Button -->
          <div class="cta-section">
            <a href="/connect-gmail" class="btn">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M2 7l10 6 10-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Connect Gmail Now
            </a>
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
      <link rel="stylesheet" href="/css/styles.css">

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
<title>Access Denied</title><link rel="stylesheet" href="/css/styles.css">
</head>
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
        <link rel="stylesheet" href="/css/styles.css">

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
       <link rel="stylesheet" href="/css/styles.css">

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
<title>Error</title><link rel="stylesheet" href="/css/styles.css">
</head>
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


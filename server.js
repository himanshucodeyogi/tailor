require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const flash = require('connect-flash');
const methodOverride = require('method-override');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const connectDB = require('./config/db');
const flashMiddleware = require('./middleware/flash');
const { isAdmin, isTailor } = require('./middleware/auth');

// Validate required env vars at startup
const requiredEnvVars = ['MONGODB_URI', 'SESSION_SECRET', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: ${envVar} environment variable is not set`);
    process.exit(1);
  }
}

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Trust proxy (for Render, Heroku, etc. behind reverse proxy)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Helmet - secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // disabled for EJS views with inline scripts
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10kb' }));

// NoSQL injection prevention - sanitize req.body, req.query, req.params
app.use(mongoSanitize());

// HTTP Parameter Pollution protection
app.use(hpp());

// Method override for PUT/DELETE
app.use(methodOverride('_method'));

// Rate limiting - login endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting - general API (DDoS protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Session configuration
const sessionConfig = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI,
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
});

app.use(sessionConfig);

// Flash middleware
app.use(flash());

// Attach flash messages and user data to locals
app.use(flashMiddleware);

// Make request object available to all views
app.use((req, res, next) => {
  res.locals.request = req;
  next();
});

// CORS for /api routes (Flutter app)
const cors = require('cors');
app.use('/api', cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any localhost or 10.0.2.2 origin (Flutter web/emulator dev)
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://10.0.2.2:')) {
      return callback(null, true);
    }
    // Allow custom origins from env
    const allowed = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Apply rate limiters
app.use('/api/auth', authLimiter);
app.use('/admin/login', authLimiter);
app.use('/tailor/login', authLimiter);
app.use('/api', apiLimiter);

// Routes
const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const adminTailorRoutes = require('./routes/admin-tailors');
const tailorAuthRoutes = require('./routes/tailor-auth');
const tailorRoutes = require('./routes/tailor');

// Mount routes
app.use('/', publicRoutes);
app.use('/admin', authRoutes);
app.use('/admin', isAdmin, dashboardRoutes);
app.use('/admin/customers', isAdmin, customerRoutes);
app.use('/admin/orders', isAdmin, orderRoutes);
app.use('/admin/inventory', isAdmin, inventoryRoutes);
app.use('/admin/tailors', isAdmin, adminTailorRoutes);
app.use('/tailor', tailorAuthRoutes);
app.use('/tailor', isTailor, tailorRoutes);

// === REST API Routes (JWT-protected, for Flutter app) ===
const { verifyAdminToken, verifyTailorToken, verifyCuttingMasterToken } = require('./middleware/jwt-auth');

const apiAuthRoutes = require('./routes/api/auth');
const apiPublicRoutes = require('./routes/api/public');
const apiShopRoutes = require('./routes/api/shop');
const apiDashboardRoutes = require('./routes/api/admin/dashboard');
const apiCustomerRoutes = require('./routes/api/admin/customers');
const apiOrderRoutes = require('./routes/api/admin/orders');
const apiInventoryRoutes = require('./routes/api/admin/inventory');
const apiAdminTailorRoutes = require('./routes/api/admin/tailors');
const apiAdminCuttingMasterRoutes = require('./routes/api/admin/cutting-masters');
const apiTailorRoutes = require('./routes/api/tailor');
const apiCuttingMasterRoutes = require('./routes/api/cutting-master');

app.use('/api/auth', apiAuthRoutes);
app.use('/api/shops', apiShopRoutes);
app.use('/api', apiPublicRoutes);
app.use('/api/admin/dashboard', verifyAdminToken, apiDashboardRoutes);
app.use('/api/admin/customers', verifyAdminToken, apiCustomerRoutes);
app.use('/api/admin/orders', verifyAdminToken, apiOrderRoutes);
app.use('/api/admin/inventory', verifyAdminToken, apiInventoryRoutes);
app.use('/api/admin/tailors', verifyAdminToken, apiAdminTailorRoutes);
app.use('/api/admin/cutting-masters', verifyAdminToken, apiAdminCuttingMasterRoutes);
app.use('/api/tailor', verifyTailorToken, apiTailorRoutes);
app.use('/api/cuttingmaster', verifyCuttingMasterToken, apiCuttingMasterRoutes);

// 404 Not Found handler
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.status(404).render('404', {
    title: 'Page Not Found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ error: 'Server error' });
  }
  res.status(500).render('500', {
    title: 'Server Error',
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    request: req,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✓ Server running at http://localhost:${PORT}`);
  console.log(`✓ Admin panel: http://localhost:${PORT}/admin/login`);
  console.log(`✓ Home page: http://localhost:${PORT}/\n`);
});

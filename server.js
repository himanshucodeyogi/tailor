require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const flash = require('connect-flash');
const methodOverride = require('method-override');

const connectDB = require('./config/db');
const flashMiddleware = require('./middleware/flash');
const { isAdmin, isTailor } = require('./middleware/auth');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method override for PUT/DELETE
app.use(methodOverride('_method'));

// Session configuration
const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI,
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
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

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('500', {
    title: 'Server Error',
    error: err.message,
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

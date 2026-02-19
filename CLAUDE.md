# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tailor Management Website** - A full-stack Express.js application for managing tailor shop operations (customer measurements, order tracking, inventory). Features include public order tracking, admin dashboard, customer/order/inventory management, and a tailor panel for assignment tracking.

## Quick Commands

```bash
npm run dev       # Start development server (auto-restarts with nodemon)
npm start         # Start production server
npm run seed      # Initialize/reset database with admin account and inventory
```

**Prerequisites**: MongoDB must be running. The application expects MongoDB at the URI specified in `.env` (defaults to local or uses remote URI if configured).

## Architecture Overview

### Tech Stack
- **Backend**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: EJS templates + Tailwind CSS (CDN)
- **Authentication**: express-session + bcryptjs with MongoDB session store
- **Middleware**: method-override (for PUT/DELETE in forms), connect-flash (for messages)

### High-Level Structure

```
server.js                          # Main entry point, configures middleware and mounts routes
├── config/db.js                   # MongoDB connection
├── middleware/
│   ├── auth.js                    # Role protection: isAdmin, isTailor, redirects
│   └── flash.js                   # Flash message middleware
├── models/                        # Mongoose schemas: Admin, Tailor, Customer, Order, Inventory
├── routes/                        # 9 route files organized by feature
└── views/                         # EJS templates organized by section (public/, auth/, admin panels)
```

### Core Flow

1. **Session Management**: Sessions stored in MongoDB via `connect-mongo`, persists across restarts, 8-hour timeout
2. **Authentication**: Two roles—
   - **Admin** (via `/admin` routes): Single admin account in seed script, manages customers/orders/inventory/tailors
   - **Tailor** (via `/tailor` routes): Multi-tailor support for assignment tracking
3. **Request Flow**: Public routes → Auth routes (login) → Protected routes (checked by `isAdmin`/`isTailor` middleware) → Render with flash messages

### Database Models

- **Admin**: username, passwordHash (bcryptjs hashed)
- **Tailor**: name, phone, email, passwordHash
- **Customer**: name, phone (unique), measurements object (6 fields: length/chest/shoulder/waist/arm/neck in inches), notes, timestamps
- **Order**: customer ref, orderNumber (auto `ORD-{timestamp}`), garmentType, description, status (5-step enum), price, advancePaid, dueDate, isActive flag, timestamps
- **Inventory**: itemName (unique), quantity, unit (pieces/boxes/meters), lowStockThreshold

## Key Implementation Details

### Routes Organization

Each route file handles a feature area:
- `public.js` - Home, pricing, portfolio, public order tracking
- `auth.js` - Admin login/logout
- `dashboard.js` - Admin dashboard with stats
- `customers.js` - CRUD for customers, search by phone
- `orders.js` - CRUD for orders, filter by status
- `inventory.js` - List, increment/decrement stock
- `tailor-auth.js` - Tailor login/logout
- `tailor.js` - Tailor dashboard and assignments
- `admin-tailors.js` - Admin management of tailors (CRUD)

### Order Status Progression

Orders follow a fixed 5-step status enum: Order Placed → Cutting → In Stitching → Final Touches → Ready for Pickup

### Important Session Details

- Session secret in `.env` (SESSION_SECRET) - change in production
- Secure cookies only in production (`NODE_ENV=production`)
- httpOnly flag prevents client-side JS from accessing session cookie (security)
- Session middleware must be initialized before flash and auth middlewares (order matters)

## Configuration

Environment variables in `.env`:
- `MONGODB_URI` - Connection string (local or remote cluster)
- `SESSION_SECRET` - Session encryption key
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` - Credentials for seed script
- `PORT` - Server port (default 3000)
- `NODE_ENV` - Set to 'production' for secure cookies

## Common Patterns

### Adding a New Admin Route

1. Create route file in `routes/` (e.g., `reports.js`)
2. Mount with `app.use('/admin/reports', isAdmin, reportRoutes)` in server.js
3. Create corresponding views in `views/admin/reports/`
4. Use flash messages: `req.flash('success', 'message')` or `req.flash('error', 'message')`

### Querying Data

All models use Mongoose, so standard query patterns apply:
- `Model.find()`, `Model.findById()`, `Model.findByIdAndUpdate()`
- Lean queries for read-only: `Model.find().lean()`
- Population: `Order.findById(id).populate('customer')` for customer details

### Form Submission Patterns

- PUT/DELETE requests use method-override: `<form action="/route?_method=PUT" method="POST">`
- Flash messages appear in layout for success/error feedback
- Validation errors should flash and redirect back to form

## Troubleshooting Common Issues

- **MongoDB Connection Fails**: Ensure MongoDB is running on the configured URI. For local dev, `mongod` command or service startup.
- **Port Already in Use**: Change PORT in `.env` or kill process on that port.
- **Sessions Not Persisting**: MongoDB must be running and accessible (sessions stored there, not in memory).
- **Admin Can't Login**: Run `npm run seed` to initialize admin account from `.env` variables.

## File Reading Order for New Features

When implementing features, read files in this order for context:
1. `server.js` - Understand middleware order and route mounting
2. Relevant route file (e.g., `routes/customers.js`)
3. Corresponding model (e.g., `models/Customer.js`)
4. Corresponding views in `views/`
5. Relevant middleware if auth is involved

## Notes

- The `method-override` package allows PUT/DELETE from HTML forms (required for browser support)
- Flash messages are rendered in layout partials—customizing messages requires editing both controller and view
- Order numbers are auto-generated and unique by design (timestamp-based)
- Low stock alerts on dashboard trigger when inventory quantity <= threshold
- Phone number search works by exact digit match (spaces/dashes stripped in queries)

# Tailor Management Website

A full-stack web application for managing tailor shop operations, including customer measurements, order tracking, inventory management, and a public order tracking page.

## Features

### Public Pages
- **Home Page** - Order tracking by mobile number with visual status stepper
- **Pricing Page** - Display stitching charges for different garment types
- **Portfolio Page** - Text-based descriptions of work types

### Admin Panel (Protected)
- **Dashboard** - Overview stats, order status breakdown, low stock alerts
- **Customer Management** - Add/edit customers with 6 measurements (Length, Chest, Shoulder, Waist, Arm, Neck)
- **Order Management** - Create orders with 5-step status progression
- **Search Feature** - Find customers by phone number for quick repeat orders
- **Inventory Management** - Track stock with increment/decrement buttons for 3 items: Buttons, Thread Boxes, Lining/Asttar

### Order Status Steps
1. Order Placed
2. Cutting
3. In Stitching
4. Final Touches
5. Ready for Pickup

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Frontend**: EJS templates + Tailwind CSS (CDN)
- **Authentication**: express-session + bcryptjs
- **Session Store**: MongoDB (via connect-mongo)

## Prerequisites

- Node.js (v14+)
- MongoDB (running locally on port 27017 or accessible via MONGODB_URI)
- npm

## Installation

1. **Clone/navigate to the project**
   ```bash
   cd C:\Users\codey\allcode\ta
   ```

2. **Install dependencies** (already done)
   ```bash
   npm install
   ```

3. **Start MongoDB**

   **On Windows with MongoDB installed:**
   ```bash
   mongod
   ```

   **Or using MongoDB Community Edition:**
   - Ensure MongoDB is running (check system tray or start MongoDB service)

   **Or with Docker:**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

4. **Seed the database**

   Once MongoDB is running, run the seed script to create the initial admin account and inventory items:

   ```bash
   npm run seed
   ```

   **Expected Output:**
   ```
   ✓ Connected to MongoDB
   ✓ Admin created: admin
   ✓ Inventory item: Buttons
   ✓ Inventory item: Thread Boxes
   ✓ Inventory item: Lining/Asttar

   ✓ Database seeded successfully!

   You can now login with:
     Username: admin
     Password: changeme123
   ```

## Running the Application

**Development mode** (with auto-restart):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The application will start at `http://localhost:3000`

## Access Points

- **Home Page**: http://localhost:3000/
- **Pricing**: http://localhost:3000/pricing
- **Portfolio**: http://localhost:3000/portfolio
- **Order Tracking**: Enter phone number on home page

**Admin Panel**:
- **Login**: http://localhost:3000/admin/login
- **Default Credentials**:
  - Username: `admin`
  - Password: `changeme123`

**Admin Pages**:
- Dashboard: `/admin/dashboard`
- Customers: `/admin/customers`
- Orders: `/admin/orders`
- Inventory: `/admin/inventory`

## Project Structure

```
C:\Users\codey\allcode\ta\
├── config/
│   └── db.js                    # MongoDB connection
├── middleware/
│   ├── auth.js                  # Authentication middleware
│   └── flash.js                 # Flash messages middleware
├── models/
│   ├── Admin.js                 # Admin account model
│   ├── Customer.js              # Customer + measurements model
│   ├── Order.js                 # Order model with status enum
│   └── Inventory.js             # Inventory items model
├── routes/
│   ├── public.js                # Public routes (home, track, pricing, portfolio)
│   ├── auth.js                  # Login/logout routes
│   ├── dashboard.js             # Admin dashboard route
│   ├── customers.js             # Customer CRUD routes
│   ├── orders.js                # Order CRUD routes
│   └── inventory.js             # Inventory routes
├── views/
│   ├── partials/                # Reusable components
│   ├── public/                  # Public pages
│   ├── auth/                    # Login page
│   ├── dashboard/               # Dashboard
│   ├── customers/               # Customer CRUD pages
│   ├── orders/                  # Order CRUD pages
│   └── inventory/               # Inventory page
├── .env                         # Environment variables
├── .gitignore                   # Git ignore file
├── package.json                 # Project dependencies
├── seed.js                      # Database seed script
└── server.js                    # Main application entry point
```

## Database Models

### Admin
```javascript
{
  username: String (unique),
  passwordHash: String
}
```

### Customer
```javascript
{
  name: String,
  phone: String (unique, 10-15 digits),
  measurements: {
    length, chest, shoulder, waist, arm, neck (all in inches)
  },
  notes: String,
  timestamps: true
}
```

### Order
```javascript
{
  customer: ObjectId (ref: Customer),
  orderNumber: String (auto-generated),
  garmentType: String (Suit | Shirt | Kurta | Other),
  description: String,
  status: String (5 steps: Order Placed → Cutting → In Stitching → Final Touches → Ready for Pickup),
  price: Number,
  advancePaid: Number,
  dueDate: Date,
  isActive: Boolean,
  timestamps: true
}
```

### Inventory
```javascript
{
  itemName: String (unique),
  quantity: Number,
  unit: String (pieces | boxes | meters),
  lowStockThreshold: Number
}
```

## Key Features Explained

### Order Tracking (Public)
Customers can track their orders by entering their 10-15 digit mobile number on the home page. The system displays:
- Active orders for that customer
- A 5-step visual stepper showing progress
- Order details (garment type, created date, due date)

### Measurements
6 standard measurements are stored per customer (all in inches):
- **Length** - Total length of garment
- **Chest** - Chest circumference
- **Shoulder** - Shoulder width
- **Waist** - Waist circumference
- **Arm** - Arm/sleeve length
- **Neck** - Neck circumference

Measurements can be added when creating a customer or updated later via the edit form. This enables fast repeat orders without re-measuring.

### Inventory Management
Three core items are tracked:
1. **Buttons** - measured in pieces
2. **Thread Boxes** - measured in boxes
3. **Lining/Asttar** - measured in meters

Each item has:
- Current quantity
- Low stock threshold
- +/- buttons for quick adjustments
- Low stock alerts on dashboard

### Session & Authentication
- Admin login uses bcryptjs for password hashing
- Sessions stored in MongoDB (survives server restarts)
- Session timeout: 8 hours of inactivity
- All admin routes protected by `isAdmin` middleware

## Customization

### Change Admin Credentials
1. Edit `.env` file:
   ```
   ADMIN_USERNAME=your_username
   ADMIN_PASSWORD=your_password
   ```
2. Run `npm run seed` again to update

### Change Database
Edit `.env`:
```
MONGODB_URI=mongodb://your_server:27017/your_db_name
```

### Pricing Table
Edit `views/public/pricing.ejs` to update garment types and prices.

### Portfolio Content
Edit `views/public/portfolio.ejs` to customize work descriptions.

## Excluded Features

As per requirements, the following are NOT included:
- ❌ WhatsApp notifications
- ❌ Image uploads
- ❌ QR codes
- ❌ Email notifications
- ❌ Multi-admin system (single admin only)

## Styling

All styling uses **Tailwind CSS via CDN** (`https://cdn.tailwindcss.com`), which means:
- No build step required
- Changes reflect immediately
- All Tailwind utilities available
- Mobile-responsive design out of the box

## API Routes Summary

### Public Routes
- `GET /` - Home page
- `POST /track` - Track order by phone
- `GET /pricing` - Pricing page
- `GET /portfolio` - Portfolio page

### Admin Routes (all protected)
- `GET /admin/login` - Login form
- `POST /admin/login` - Process login
- `POST /admin/logout` - Logout

- `GET /admin/dashboard` - Stats overview
- `GET /admin/customers` - List customers (with search)
- `GET /admin/customers/new` - New customer form
- `POST /admin/customers` - Create customer
- `GET /admin/customers/:id` - Customer detail
- `GET /admin/customers/:id/edit` - Edit customer
- `PUT /admin/customers/:id` - Update customer
- `DELETE /admin/customers/:id` - Delete customer

- `GET /admin/orders` - List orders (with status filter)
- `GET /admin/orders/new` - New order form
- `POST /admin/orders` - Create order
- `GET /admin/orders/:id` - Order detail with stepper
- `GET /admin/orders/:id/edit` - Edit order
- `PUT /admin/orders/:id` - Update order
- `DELETE /admin/orders/:id` - Delete order

- `GET /admin/inventory` - Inventory list
- `POST /admin/inventory/:id/increment` - Add stock
- `POST /admin/inventory/:id/decrement` - Remove stock

## Troubleshooting

### MongoDB Connection Error
```
✗ Seed failed: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB service before running the app or seed script.

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**: Change PORT in `.env` or kill the process using port 3000.

### Session Issues
If sessions aren't persisting, ensure MongoDB is running and the MONGODB_URI is correct.

## Development Tips

1. **Flash Messages** appear for all success/error operations. Check the view to customize messages.
2. **Search** works by matching phone numbers (digits only).
3. **Order Numbers** are auto-generated as `ORD-{timestamp}` and are unique.
4. **Low Stock Alerts** appear on dashboard when inventory <= threshold.
5. **Method Override** allows PUT/DELETE from HTML forms using `?_method=PUT` in the action.

## License

MIT

## Support

For issues or questions, check the code comments or refer to this README.

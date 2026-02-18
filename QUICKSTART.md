# Quick Start Guide - Tailor Management Website

## 🚀 Get Started in 3 Steps

### Step 1: Start MongoDB

**Option A - Windows (if MongoDB installed as service)**
```bash
# MongoDB should start automatically, or manually start:
net start MongoDB
```

**Option B - Using Docker**
```bash
docker run -d -p 27017:27017 --name tailor-mongo mongo:latest
```

**Option C - Direct MongoDB**
```bash
mongod
```

Wait for confirmation:
```
[initandlisten] waiting for connections on port 27017
```

### Step 2: Seed the Database

Open a new terminal and run:
```bash
cd C:\Users\codey\allcode\ta
npm run seed
```

You'll see:
```
✓ Connected to MongoDB
✓ Admin created: admin
✓ Inventory item: Buttons
✓ Inventory item: Thread Boxes
✓ Inventory item: Lining/Asttar
✓ Database seeded successfully!
```

### Step 3: Start the Application

```bash
npm run dev
```

Or for production:
```bash
npm start
```

You'll see:
```
✓ Server running at http://localhost:3000
✓ Admin panel: http://localhost:3000/admin/login
✓ Home page: http://localhost:3000/
```

---

## 🌐 Access the Application

| Page | URL | Access |
|------|-----|--------|
| Home & Tracking | http://localhost:3000 | Public |
| Pricing | http://localhost:3000/pricing | Public |
| Portfolio | http://localhost:3000/portfolio | Public |
| Admin Login | http://localhost:3000/admin/login | Public |
| Dashboard | http://localhost:3000/admin/dashboard | Admin |
| Customers | http://localhost:3000/admin/customers | Admin |
| Orders | http://localhost:3000/admin/orders | Admin |
| Inventory | http://localhost:3000/admin/inventory | Admin |

---

## 🔐 Default Login Credentials

```
Username: admin
Password: changeme123
```

Change these in `.env` file and re-run `npm run seed` to update.

---

## 📝 Quick Test Workflow

1. **Login to Admin** → http://localhost:3000/admin/login
2. **Create a Customer** → Go to "Customers" → "+ Add New Customer"
   - Fill name, phone (10-15 digits), and measurements
3. **Create an Order** → Go to "Orders" → "+ Create New Order"
   - Select the customer
   - Choose garment type
   - Set price and due date
4. **Track the Order** → Go to home page (/)
   - Enter the phone number
   - See the 5-step status stepper
5. **Update Inventory** → Go to "Inventory"
   - Use +/- buttons to adjust stock

---

## 🛠️ Common Commands

```bash
# Start development server (auto-restart on file changes)
npm run dev

# Start production server
npm start

# Seed/reset database
npm run seed

# Install dependencies
npm install
```

---

## 🎨 Features at a Glance

✅ **Public Pages**
- Home page with order tracking by phone number
- Pricing page (static)
- Portfolio page (text-based)

✅ **Customer Management**
- Add customers with 6 measurements
- Store and search by phone number
- View all orders for a customer
- Edit measurements anytime

✅ **Order Management**
- Create orders with 5 status steps
- Visual stepper showing progress
- Track price and advance payments
- Filter orders by status

✅ **Inventory**
- Track 3 core items (Buttons, Thread Boxes, Lining)
- Low stock alerts
- Quick increment/decrement

✅ **Admin Panel**
- Session-based login (8-hour timeout)
- Dashboard with statistics
- Protected routes

---

## 📱 Testing Order Tracking

1. Create a customer with phone: `9876543210`
2. Create an order for that customer
3. Visit http://localhost:3000/
4. Enter phone: `9876543210`
5. See the order with its status stepper

---

## 🔧 Troubleshooting

**Can't connect to MongoDB:**
- Ensure MongoDB is running (`mongod` command or service)
- Check MONGODB_URI in `.env` (default: `mongodb://127.0.0.1:27017/tailor_db`)

**Port 3000 in use:**
- Change PORT in `.env` to another port (e.g., 3001)
- Or kill the process: `lsof -ti:3000 | xargs kill -9`

**Session not working:**
- Ensure MongoDB is running (sessions stored there)
- Check SESSION_SECRET is set in `.env`

---

## 📚 Full Documentation

See `README.md` for comprehensive documentation on:
- Project structure
- Database models
- All API routes
- Customization options

---

## 🎯 Next Steps

1. Start MongoDB
2. Run `npm run seed`
3. Run `npm run dev`
4. Visit http://localhost:3000
5. Login at http://localhost:3000/admin/login

**Enjoy!** 🎉

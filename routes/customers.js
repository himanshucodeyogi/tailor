const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Order = require('../models/Order');

// GET /admin/customers - List all customers with search
router.get('/', async (req, res) => {
  try {
    const { phone } = req.query;
    let filter = {};

    if (phone && phone.trim()) {
      filter.phone = { $regex: phone.replace(/\D/g, ''), $options: 'i' };
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    res.render('customers/index', {
      title: 'Customers',
      customers,
      searchPhone: phone || '',
    });
  } catch (error) {
    console.error('Customer list error:', error);
    req.flash('error', 'Failed to load customers');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/customers/new - Show new customer form
router.get('/new', (req, res) => {
  res.render('customers/new', { title: 'Add Customer' });
});

// POST /admin/customers - Create new customer
router.post('/', async (req, res) => {
  try {
    console.log('===== FORM DATA RECEIVED =====');
    console.log('Full req.body:', JSON.stringify(req.body, null, 2));
    const { name, phone, notes, measurementTypes } = req.body;
    console.log('Name:', name);
    console.log('Phone:', phone);
    console.log('Measurement Types:', measurementTypes);
    console.log('Type of measurementTypes:', typeof measurementTypes);
    console.log('Is Array?', Array.isArray(measurementTypes));

    // Validate phone
    if (!phone || !/^\d{10,15}$/.test(phone.replace(/\D/g, ''))) {
      req.flash('error', 'Please enter a valid phone number (10-15 digits)');
      return res.redirect('/admin/customers/new');
    }

    // Check if phone already exists
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      req.flash('error', 'Customer with this phone number already exists');
      return res.redirect('/admin/customers/new');
    }

    // Parse measurements - handle both single value and array
    let typesArray = measurementTypes;
    if (!Array.isArray(typesArray)) {
      typesArray = typesArray ? [typesArray] : [];
    }

    console.log('Measurement types array:', typesArray);

    const measurements = [];
    typesArray.forEach((type) => {
      // Filter out empty types
      if (!type) {
        console.log('Skipping empty type');
        return;
      }

      console.log(`Processing type: ${type}`);

      const measurement = {
        type,
        length: req.body[`length_${type}`] ? parseFloat(req.body[`length_${type}`]) : null,
        chest: req.body[`chest_${type}`] ? parseFloat(req.body[`chest_${type}`]) : null,
        shoulder: req.body[`shoulder_${type}`] ? parseFloat(req.body[`shoulder_${type}`]) : null,
        waist: req.body[`waist_${type}`] ? parseFloat(req.body[`waist_${type}`]) : null,
        arm: req.body[`arm_${type}`] ? parseFloat(req.body[`arm_${type}`]) : null,
        neck: req.body[`neck_${type}`] ? parseFloat(req.body[`neck_${type}`]) : null,
        hip: req.body[`hip_${type}`] ? parseFloat(req.body[`hip_${type}`]) : null,
        thigh: req.body[`thigh_${type}`] ? parseFloat(req.body[`thigh_${type}`]) : null,
        notes: req.body[`notes_${type}`] || '',
      };
      console.log(`Measurement object for ${type}:`, measurement);
      measurements.push(measurement);
    });
    console.log('All parsed measurements:', measurements);

    // Create customer
    const customer = new Customer({
      name,
      phone,
      notes,
      measurements,
    });

    await customer.save();

    req.flash('success', `Customer "${name}" added successfully!`);
    res.redirect(`/admin/customers/${customer._id}`);
  } catch (error) {
    console.error('Create customer error:', error);
    if (error.message.includes('E11000')) {
      req.flash('error', 'Customer with this phone number already exists');
    } else {
      req.flash('error', 'Failed to create customer');
    }
    res.redirect('/admin/customers/new');
  }
});

// GET /admin/customers/:id - View single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      req.flash('error', 'Customer not found');
      return res.redirect('/admin/customers');
    }

    const orders = await Order.find({ customer: customer._id }).sort({
      createdAt: -1,
    });

    res.render('customers/show', {
      title: customer.name,
      customer,
      orders,
    });
  } catch (error) {
    console.error('Customer show error:', error);
    req.flash('error', 'Failed to load customer');
    res.redirect('/admin/customers');
  }
});

// GET /admin/customers/:id/edit - Show edit form
router.get('/:id/edit', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      req.flash('error', 'Customer not found');
      return res.redirect('/admin/customers');
    }

    res.render('customers/edit', {
      title: 'Edit Customer',
      customer,
    });
  } catch (error) {
    console.error('Customer edit error:', error);
    req.flash('error', 'Failed to load customer');
    res.redirect('/admin/customers');
  }
});

// PUT /admin/customers/:id - Update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, notes, measurementTypes } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      req.flash('error', 'Customer not found');
      return res.redirect('/admin/customers');
    }

    // Check if phone changed and is unique
    if (phone !== customer.phone) {
      const existingPhone = await Customer.findOne({ phone });
      if (existingPhone) {
        req.flash('error', 'Phone number already in use by another customer');
        return res.redirect(`/admin/customers/${customer._id}/edit`);
      }
    }

    // Parse measurements - handle both single value and array
    let typesArray = measurementTypes;
    if (!Array.isArray(typesArray)) {
      typesArray = typesArray ? [typesArray] : [];
    }

    console.log('Measurement types array:', typesArray);

    const measurements = [];
    typesArray.forEach((type) => {
      // Filter out empty types
      if (!type) {
        console.log('Skipping empty type');
        return;
      }

      console.log(`Processing type: ${type}`);

      const measurement = {
        type,
        length: req.body[`length_${type}`] ? parseFloat(req.body[`length_${type}`]) : null,
        chest: req.body[`chest_${type}`] ? parseFloat(req.body[`chest_${type}`]) : null,
        shoulder: req.body[`shoulder_${type}`] ? parseFloat(req.body[`shoulder_${type}`]) : null,
        waist: req.body[`waist_${type}`] ? parseFloat(req.body[`waist_${type}`]) : null,
        arm: req.body[`arm_${type}`] ? parseFloat(req.body[`arm_${type}`]) : null,
        neck: req.body[`neck_${type}`] ? parseFloat(req.body[`neck_${type}`]) : null,
        hip: req.body[`hip_${type}`] ? parseFloat(req.body[`hip_${type}`]) : null,
        thigh: req.body[`thigh_${type}`] ? parseFloat(req.body[`thigh_${type}`]) : null,
        notes: req.body[`notes_${type}`] || '',
      };
      console.log(`Measurement object for ${type}:`, measurement);
      measurements.push(measurement);
    });
    console.log('All parsed measurements:', measurements);

    // Update fields
    customer.name = name;
    customer.phone = phone;
    customer.notes = notes;
    customer.measurements = measurements;

    await customer.save();

    req.flash('success', `Customer "${name}" updated successfully!`);
    res.redirect(`/admin/customers/${customer._id}`);
  } catch (error) {
    console.error('Update customer error:', error);
    req.flash('error', 'Failed to update customer');
    res.redirect(`/admin/customers/${req.params.id}`);
  }
});

// DELETE /admin/customers/:id - Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      req.flash('error', 'Customer not found');
      return res.redirect('/admin/customers');
    }

    // Optionally delete associated orders
    await Order.deleteMany({ customer: req.params.id });

    req.flash('success', `Customer deleted successfully!`);
    res.redirect('/admin/customers');
  } catch (error) {
    console.error('Delete customer error:', error);
    req.flash('error', 'Failed to delete customer');
    res.redirect('/admin/customers');
  }
});

module.exports = router;

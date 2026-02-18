const STATUS_COLORS = {
  'Order Placed': 'bg-gray-100 text-gray-800',
  'Cutting': 'bg-yellow-100 text-yellow-800',
  'In Stitching': 'bg-blue-100 text-blue-800',
  'Final Touches': 'bg-orange-100 text-orange-800',
  'Ready for Pickup': 'bg-green-100 text-green-800',
};

const STATUSES = [
  'Order Placed',
  'Cutting',
  'In Stitching',
  'Final Touches',
  'Ready for Pickup',
];

async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log(`Updating order ${orderId} to status: ${newStatus}`);

    const response = await fetch(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await response.json();

    if (!response.ok) {
      showNotification('Error: ' + (data.error || 'Failed to update status'), 'error');
      return false;
    }

    showNotification(`Status updated to ${newStatus}`, 'success');
    updateStatusUI(newStatus);
    return true;
  } catch (error) {
    console.error('Error updating status:', error);
    showNotification('Error updating status', 'error');
    return false;
  }
}

function updateStatusUI(newStatus) {
  // Update status badge
  const statusBadge = document.getElementById('statusBadge');
  if (statusBadge) {
    statusBadge.textContent = newStatus;
    statusBadge.className = `inline-block px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[newStatus]}`;
  }

  // Update stepper
  updateStepper(newStatus);

  // Refresh the page after 1.5 seconds to show all updates
  setTimeout(() => {
    location.reload();
  }, 1500);
}

function updateStepper(currentStatus) {
  const currentIndex = STATUSES.indexOf(currentStatus);

  const stepperCircles = document.querySelectorAll('[data-step-number]');
  const stepperLines = document.querySelectorAll('[data-step-line]');

  stepperCircles.forEach((circle, i) => {
    if (currentIndex >= i) {
      circle.classList.remove('bg-gray-300', 'text-gray-600');
      circle.classList.add('bg-blue-600', 'text-white');
    } else {
      circle.classList.remove('bg-blue-600', 'text-white');
      circle.classList.add('bg-gray-300', 'text-gray-600');
    }
  });

  stepperLines.forEach((line, i) => {
    if (currentIndex > i) {
      line.classList.remove('bg-gray-300');
      line.classList.add('bg-blue-600');
    } else {
      line.classList.remove('bg-blue-600');
      line.classList.add('bg-gray-300');
    }
  });
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function openStatusModal() {
  const modal = document.getElementById('statusModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeStatusModal() {
  const modal = document.getElementById('statusModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function handleStatusSelect(status) {
  const orderId = document.getElementById('orderId').value;
  const confirmed = confirm(`Change status to "${status}"?`);

  if (confirmed) {
    updateOrderStatus(orderId, status);
    closeStatusModal();
  }
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('statusModal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeStatusModal();
      }
    });
  }
});

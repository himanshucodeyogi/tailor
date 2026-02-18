const MEASUREMENT_TYPES = [
  'pant',
  'shirt',
  'coat',
  'jacket',
  'kurta',
  'salwar',
  'sherwani',
  'lehenga',
  'saree',
  'other',
];

let measurementCounter = 0;

function addMeasurementType() {
  console.log('Adding measurement type...');
  const container = document.getElementById('measurementsContainer');

  // Get available types
  const usedTypes = Array.from(document.querySelectorAll('select[name="measurementTypes"]'))
    .map((s) => s.value)
    .filter((v) => v);

  console.log('Used types:', usedTypes);
  const availableTypes = MEASUREMENT_TYPES.filter((t) => !usedTypes.includes(t));

  if (availableTypes.length === 0) {
    alert('All measurement types have been added');
    return;
  }

  const blockId = `measurement-block-${measurementCounter++}`;
  const html = `
    <div class="measurement-type-block bg-blue-50 border border-blue-200 rounded p-4 mb-4" id="${blockId}">
      <div class="flex justify-between items-center mb-4">
        <select name="measurementTypes" class="measurement-type-select border border-gray-300 rounded px-3 py-2 font-semibold" required onchange="updateBlockInputNames('${blockId}')">
          <option value="">Select Type</option>
          ${availableTypes.map((t) => `<option value="${t}">${capitalize(t)}</option>`).join('')}
        </select>
        <button type="button" onclick="removeMeasurementType('${blockId}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
          Remove
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Length</label>
          <input type="number" name="length_temp" placeholder="Length" step="0.5" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Chest</label>
          <input type="number" name="chest_temp" placeholder="Chest" step="0.5" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Shoulder</label>
          <input type="number" name="shoulder_temp" placeholder="Shoulder" step="0.5" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Waist</label>
          <input type="number" name="waist_temp" placeholder="Waist" step="0.5" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Arm</label>
          <input type="number" name="arm_temp" placeholder="Arm" step="0.5" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Neck</label>
          <input type="number" name="neck_temp" placeholder="Neck" step="0.5" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Hip</label>
          <input type="number" name="hip_temp" placeholder="Hip" step="0.5" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Thigh</label>
          <input type="number" name="thigh_temp" placeholder="Thigh" step="0.5" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
        </div>
        <div class="col-span-2 md:col-span-1">
          <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
          <input type="text" name="notes_temp" placeholder="Notes" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', html);
  console.log('Measurement block added:', blockId);
}

function updateBlockInputNames(blockId) {
  console.log('Updating block:', blockId);
  const block = document.getElementById(blockId);
  const select = block.querySelector('select[name="measurementTypes"]');
  const type = select.value;

  console.log('Selected type:', type);

  if (!type) return;

  const inputs = block.querySelectorAll('input');
  inputs.forEach((input) => {
    const baseName = input.name.split('_')[0];
    const newName = `${baseName}_${type}`;
    input.name = newName;
    console.log(`Updated: ${baseName} → ${newName}`);
  });
}

function removeMeasurementType(blockId) {
  console.log('Removing block:', blockId);
  document.getElementById(blockId).remove();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function validateMeasurements() {
  console.log('Validating measurements...');
  const blocks = document.querySelectorAll('.measurement-type-block');
  console.log('Number of measurement blocks:', blocks.length);

  if (blocks.length === 0) {
    alert('Please add at least one measurement type');
    return false;
  }

  for (let block of blocks) {
    const select = block.querySelector('select[name="measurementTypes"]');
    const type = select.value;
    console.log('Block type:', type);

    if (!type) {
      alert('Please select a measurement type for all blocks');
      return false;
    }
  }

  console.log('Validation passed!');
  return true;
}

function logFormData(e) {
  console.log('===== FORM SUBMISSION =====');
  const form = e.target;
  const formData = new FormData(form);

  console.log('All form fields:');
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}: ${value}`);
  }

  const blocks = document.querySelectorAll('.measurement-type-block');
  console.log('Measurement blocks:', blocks.length);
  blocks.forEach((block, idx) => {
    const select = block.querySelector('select[name="measurementTypes"]');
    console.log(`Block ${idx}: type="${select.value}"`);
    const inputs = block.querySelectorAll('input');
    inputs.forEach((input) => {
      if (input.value) {
        console.log(`  ${input.name}: ${input.value}`);
      }
    });
  });

  return true;
}

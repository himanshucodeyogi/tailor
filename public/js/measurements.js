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

const FIELDS_FOR_TYPE = {
  pant: ['length', 'waist', 'hip', 'thigh', 'knee', 'bottom', 'crotch'],
  shirt: ['length', 'shoulder', 'chest', 'waist', 'sleeveLength', 'bicep', 'collar', 'cuff'],
  coat: ['length', 'shoulder', 'chest', 'waist', 'hip', 'sleeveLength', 'armhole', 'crossBack'],
  sherwani: ['length', 'shoulder', 'chest', 'waist', 'hip', 'sleeveLength', 'armhole', 'crossBack'],
  jacket: ['length', 'shoulder', 'chest', 'waist', 'sleeve', 'neck'],
  kurta: ['length', 'shoulder', 'chest', 'waist', 'hip', 'sleeveLength', 'collar', 'slits'],
  salwar: ['length', 'waist', 'hip', 'crotch', 'bottom'],
  lehenga: ['skirtLength', 'skirtWaist', 'skirtHip', 'blouseLength', 'blouseChest', 'blouseUnderbust', 'blouseShoulder', 'blouseSleeve'],
  saree: ['blouseLength', 'blouseChest', 'blouseUnderbust', 'blouseShoulder', 'blouseSleeve', 'petticoatLength', 'petticoatWaist'],
  other: ['length', 'shoulder', 'chest', 'waist', 'hip', 'neck', 'thigh', 'knee', 'bottom', 'crotch', 'sleeveLength', 'bicep', 'collar', 'cuff', 'armhole', 'crossBack', 'sleeve', 'slits'],
};

const FIELD_LABELS = {
  length: 'Length',
  shoulder: 'Shoulder',
  chest: 'Chest',
  waist: 'Waist',
  hip: 'Hip',
  neck: 'Neck',
  thigh: 'Thigh',
  knee: 'Knee',
  bottom: 'Bottom',
  crotch: 'Crotch',
  sleeveLength: 'Sleeve Length',
  bicep: 'Bicep',
  collar: 'Collar',
  cuff: 'Cuff',
  armhole: 'Armhole',
  crossBack: 'Cross Back',
  sleeve: 'Sleeve',
  slits: 'Slits',
  skirtLength: 'Skirt Length',
  skirtWaist: 'Skirt Waist',
  skirtHip: 'Skirt Hip',
  blouseLength: 'Blouse Length',
  blouseChest: 'Blouse Chest',
  blouseUnderbust: 'Blouse Underbust',
  blouseShoulder: 'Blouse Shoulder',
  blouseSleeve: 'Blouse Sleeve',
  petticoatLength: 'Petticoat Length',
  petticoatWaist: 'Petticoat Waist',
};

let measurementCounter = 0;

function buildFieldsHtml(fields, type) {
  return fields.map((f) => `
    <div>
      <label class="block text-xs font-medium text-gray-700 mb-1">${FIELD_LABELS[f] || f}</label>
      <input type="number" name="${f}_${type}" placeholder="${FIELD_LABELS[f] || f}" step="0.5" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
    </div>
  `).join('');
}

function addMeasurementType() {
  const container = document.getElementById('measurementsContainer');

  const usedTypes = Array.from(document.querySelectorAll('select[name="measurementTypes"]'))
    .map((s) => s.value)
    .filter((v) => v);

  const availableTypes = MEASUREMENT_TYPES.filter((t) => !usedTypes.includes(t));

  if (availableTypes.length === 0) {
    alert('All measurement types have been added');
    return;
  }

  const blockId = `measurement-block-${measurementCounter++}`;
  const html = `
    <div class="measurement-type-block bg-blue-50 border border-blue-200 rounded p-4 mb-4" id="${blockId}">
      <div class="flex justify-between items-center mb-4">
        <select name="measurementTypes" class="measurement-type-select border border-gray-300 rounded px-3 py-2 font-semibold" required onchange="updateBlockFields('${blockId}')">
          <option value="">Select Type</option>
          ${availableTypes.map((t) => `<option value="${t}">${capitalize(t)}</option>`).join('')}
        </select>
        <button type="button" onclick="removeMeasurementType('${blockId}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
          Remove
        </button>
      </div>
      <div class="measurement-fields grid grid-cols-2 md:grid-cols-3 gap-3">
        <p class="text-sm text-gray-500 col-span-2 md:col-span-3">Select a type to see fields</p>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', html);
}

function updateBlockFields(blockId) {
  const block = document.getElementById(blockId);
  const select = block.querySelector('select[name="measurementTypes"]');
  const type = select.value;
  const fieldsContainer = block.querySelector('.measurement-fields');

  if (!type) {
    fieldsContainer.innerHTML = '<p class="text-sm text-gray-500 col-span-2 md:col-span-3">Select a type to see fields</p>';
    return;
  }

  const fields = FIELDS_FOR_TYPE[type] || FIELDS_FOR_TYPE['other'];
  fieldsContainer.innerHTML = buildFieldsHtml(fields, type) + `
    <div class="col-span-2 md:col-span-1">
      <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
      <input type="text" name="notes_${type}" placeholder="Notes" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
    </div>
  `;
}

function removeMeasurementType(blockId) {
  document.getElementById(blockId).remove();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function validateMeasurements() {
  const blocks = document.querySelectorAll('.measurement-type-block');

  if (blocks.length === 0) {
    alert('Please add at least one measurement type');
    return false;
  }

  for (let block of blocks) {
    const select = block.querySelector('select[name="measurementTypes"]');
    const type = select.value;

    if (!type) {
      alert('Please select a measurement type for all blocks');
      return false;
    }
  }

  return true;
}

function logFormData(e) {
  const form = e.target;
  const formData = new FormData(form);

  console.log('===== FORM SUBMISSION =====');
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}: ${value}`);
  }

  return true;
}

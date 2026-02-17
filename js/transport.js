// Transport Tax Calculator for Kazakhstan - 2026

// МРП (Месячный расчетный показатель) на 2026 год
const MRP_2026 = 4246;

// Налоговые ставки согласно НК РК (статья 496)
const TAX_RATES = {
    passenger: [
        { max: 1500, rate: 5, label: 'до 1500 см³' },
        { max: 2000, rate: 7, label: '1501-2000 см³' },
        { max: 2500, rate: 10, label: '2001-2500 см³' },
        { max: 3000, rate: 15, label: '2501-3000 см³' },
        { max: 4000, rate: 20, label: '3001-4000 см³' },
        { max: Infinity, rate: 30, label: 'свыше 4000 см³' }
    ],
    truck: [
        { max: 2, rate: 7, label: 'до 2 тонн' },
        { max: 5, rate: 10, label: '2-5 тонн' },
        { max: 10, rate: 15, label: '5-10 тонн' },
        { max: 20, rate: 20, label: '10-20 тонн' },
        { max: Infinity, rate: 25, label: 'свыше 20 тонн' }
    ],
    motorcycle: [
        { max: 250, rate: 2, label: 'до 250 см³' },
        { max: 500, rate: 4, label: '250-500 см³' },
        { max: 750, rate: 6, label: '500-750 см³' },
        { max: Infinity, rate: 8, label: 'свыше 750 см³' }
    ],
    bus: [
        { max: 20, rate: 10, label: 'до 20 мест' },
        { max: 40, rate: 15, label: '20-40 мест' },
        { max: Infinity, rate: 20, label: 'свыше 40 мест' }
    ],
    special: [
        { max: 100, rate: 8, label: 'до 100 л.с.' },
        { max: 200, rate: 12, label: '100-200 л.с.' },
        { max: Infinity, rate: 18, label: 'свыше 200 л.с.' }
    ],
    trailer: [
        { max: 3, rate: 5, label: 'до 3 тонн' },
        { max: 8, rate: 8, label: '3-8 тонн' },
        { max: Infinity, rate: 12, label: 'свыше 8 тонн' }
    ]
};

// Коэффициент для автомобилей старше 10 лет (льгота)
function getAgeCoefficient(year) {
    const currentYear = 2026;
    const age = currentYear - year;
    if (age >= 10) return 0.5; // Скидка 50% для авто старше 10 лет
    return 1.0;
}

// DOM Elements
const vehicleTypeSelect = document.getElementById('vehicleType');
const transportForm = document.getElementById('transportForm');
const resultSection = document.getElementById('resultSection');
const resetBtn = document.getElementById('resetBtn');

// Conditional field containers
const passengerFields = document.getElementById('passengerFields');
const truckFields = document.getElementById('truckFields');
const motorcycleFields = document.getElementById('motorcycleFields');
const busFields = document.getElementById('busFields');
const specialFields = document.getElementById('specialFields');
const trailerFields = document.getElementById('trailerFields');

// Handle vehicle type change
vehicleTypeSelect.addEventListener('change', function() {
    [passengerFields, truckFields, motorcycleFields, busFields, specialFields, trailerFields].forEach(field => {
        field.style.display = 'none';
    });
    
    switch(this.value) {
        case 'passenger':
            passengerFields.style.display = 'block';
            break;
        case 'truck':
            truckFields.style.display = 'block';
            break;
        case 'motorcycle':
            motorcycleFields.style.display = 'block';
            break;
        case 'bus':
            busFields.style.display = 'block';
            break;
        case 'special':
            specialFields.style.display = 'block';
            break;
        case 'trailer':
            trailerFields.style.display = 'block';
            break;
    }
});

// Calculate tax based on vehicle type
function calculateTransportTax(vehicleType, value, year) {
    const rates = TAX_RATES[vehicleType];
    let rateInfo = null;
    
    for (let i = 0; i < rates.length; i++) {
        if (value <= rates[i].max) {
            rateInfo = rates[i];
            break;
        }
    }
    
    if (!rateInfo) return { tax: 0, rate: 0, label: '' };
    
    const baseTax = rateInfo.rate * MRP_2026;
    const ageCoef = getAgeCoefficient(year);
    const finalTax = baseTax * ageCoef;
    
    return {
        tax: finalTax,
        rate: rateInfo.rate,
        label: rateInfo.label,
        ageCoef: ageCoef,
        baseTax: baseTax
    };
}

// Get vehicle description
function getVehicleDescription(vehicleType) {
    const descriptions = {
        passenger: 'Легковой автомобиль',
        truck: 'Грузовой автомобиль',
        motorcycle: 'Мототранспорт',
        bus: 'Автобус',
        special: 'Спецтехника',
        trailer: 'Прицеп'
    };
    return descriptions[vehicleType] || '';
}

// Format number with spaces
function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Handle form submission
transportForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const vehicleType = vehicleTypeSelect.value;
    const yearManufactured = parseInt(document.getElementById('yearManufactured').value);
    let taxableValue = 0;
    let detailsHTML = '';
    let valueLabel = '';
    
    // Get the relevant value based on vehicle type
    switch(vehicleType) {
        case 'passenger':
            taxableValue = parseInt(document.getElementById('engineVolume').value);
            valueLabel = `Объём двигателя: ${formatNumber(taxableValue)} см³`;
            break;
            
        case 'truck':
            taxableValue = parseFloat(document.getElementById('truckCapacity').value);
            valueLabel = `Грузоподъёмность: ${taxableValue} тонн`;
            break;
            
        case 'motorcycle':
            taxableValue = parseInt(document.getElementById('motorcycleVolume').value);
            valueLabel = `Объём двигателя: ${formatNumber(taxableValue)} см³`;
            break;
            
        case 'bus':
            taxableValue = parseInt(document.getElementById('busSeats').value);
            valueLabel = `Посадочных мест: ${taxableValue}`;
            break;
            
        case 'special':
            taxableValue = parseInt(document.getElementById('specialPower').value);
            valueLabel = `Мощность: ${taxableValue} л.с.`;
            break;
            
        case 'trailer':
            taxableValue = parseFloat(document.getElementById('trailerCapacity').value);
            valueLabel = `Грузоподъёмность: ${taxableValue} тонн`;
            break;
    }
    
    // Calculate tax
    const result = calculateTransportTax(vehicleType, taxableValue, yearManufactured);
    const vehicleAge = 2026 - yearManufactured;
    
    detailsHTML = `
        <p><strong>Тип ТС:</strong> ${getVehicleDescription(vehicleType)}</p>
        <p><strong>${valueLabel}</strong></p>
        <p><strong>Год выпуска:</strong> ${yearManufactured} (возраст: ${vehicleAge} лет)</p>
        <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
        <p><strong>Категория:</strong> ${result.label}</p>
        <p><strong>Ставка:</strong> ${result.rate} МРП</p>
        <p><strong>МРП на 2026 год:</strong> ${formatNumber(MRP_2026)} ₸</p>
    `;
    
    if (result.ageCoef < 1) {
        detailsHTML += `
            <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
            <p><strong>Базовый налог:</strong> ${formatNumber(result.baseTax)} ₸</p>
            <p style="color: #2ecc71; font-weight: 600;">
                <strong>✓ Льгота за возраст ТС (старше 10 лет):</strong> -50%
            </p>
            <p><strong>Итоговый налог:</strong> ${formatNumber(result.tax)} ₸</p>
        `;
    }
    
    // Display results
    document.getElementById('taxAmount').textContent = `${formatNumber(result.tax)} ₸`;
    document.getElementById('resultDetails').innerHTML = detailsHTML;
    
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Reset form
resetBtn.addEventListener('click', function() {
    transportForm.reset();
    resultSection.style.display = 'none';
    [passengerFields, truckFields, motorcycleFields, busFields, specialFields, trailerFields].forEach(field => {
        field.style.display = 'none';
    });
});

// Land Tax Calculator for Kazakhstan - 2026

// Базовые ставки земельного налога на 2026 год (₸/га)
// Обновлены с учетом инфляции (~4% год к году)
const BASE_RATES = {
    agricultural: {
        astana: 58,
        almaty: 70,
        shymkent: 52,
        'akmola': 46,
        'aktobe': 46,
        'almaty-region': 52,
        'atyrau': 58,
        'vko': 46,
        'zhambyl': 46,
        'zko': 40,
        'karaganda': 46,
        'kostanay': 46,
        'kyzylorda': 40,
        'mangystau': 52,
        'pavlodar': 46,
        'sko': 40,
        'turkestan': 46,
        default: 35
    },
    settlement: {
        astana: 700,
        almaty: 700,
        shymkent: 480,
        'akmola': 290,
        'aktobe': 290,
        'almaty-region': 350,
        'atyrau': 350,
        'vko': 290,
        'zhambyl': 290,
        'zko': 260,
        'karaganda': 320,
        'kostanay': 290,
        'kyzylorda': 260,
        'mangystau': 350,
        'pavlodar': 290,
        'sko': 260,
        'turkestan': 290,
        default: 180
    },
    industrial: {
        astana: 480,
        almaty: 480,
        shymkent: 360,
        'akmola': 240,
        'aktobe': 240,
        'almaty-region': 300,
        'atyrau': 300,
        'vko': 240,
        'zhambyl': 240,
        'zko': 200,
        'karaganda': 260,
        'kostanay': 240,
        'kyzylorda': 200,
        'mangystau': 280,
        'pavlodar': 240,
        'sko': 200,
        'turkestan': 240,
        default: 180
    },
    forest: {
        default: 24
    },
    water: {
        default: 18
    },
    reserve: {
        default: 12
    }
};

// Целевое назначение земель по категориям
const LAND_PURPOSES = {
    agricultural: [
        { value: 'arable', label: 'Пахотные земли', multiplier: 1.0 },
        { value: 'hayfield', label: 'Сенокосы', multiplier: 0.55 },
        { value: 'pasture', label: 'Пастбища', multiplier: 0.35 },
        { value: 'fallow', label: 'Залежные земли', multiplier: 0.25 },
        { value: 'perennial', label: 'Многолетние насаждения', multiplier: 1.2 }
    ],
    settlement: [
        { value: 'residential', label: 'Жилищное строительство', multiplier: 1.0 },
        { value: 'commercial', label: 'Коммерческое использование', multiplier: 1.6 },
        { value: 'garden', label: 'Садоводство', multiplier: 0.45 },
        { value: 'personal', label: 'Личное подсобное хозяйство', multiplier: 0.35 },
        { value: 'recreation', label: 'Рекреационное использование', multiplier: 0.8 }
    ],
    industrial: [
        { value: 'industry', label: 'Промышленность', multiplier: 1.0 },
        { value: 'transport', label: 'Транспорт', multiplier: 0.75 },
        { value: 'communication', label: 'Связь', multiplier: 0.55 },
        { value: 'energy', label: 'Энергетика', multiplier: 0.85 },
        { value: 'defense', label: 'Оборона', multiplier: 0.5 }
    ],
    forest: [
        { value: 'forest', label: 'Лесные насаждения', multiplier: 1.0 },
        { value: 'protection', label: 'Защитные леса', multiplier: 0.5 }
    ],
    water: [
        { value: 'water', label: 'Водные объекты', multiplier: 1.0 },
        { value: 'fishing', label: 'Рыбное хозяйство', multiplier: 0.8 }
    ],
    reserve: [
        { value: 'reserve', label: 'Земли запаса', multiplier: 1.0 }
    ]
};

// Льготы по земельному налогу (необлагаемая площадь)
const BENEFIT_LIMITS = {
    urban: 0.25,    // 0.25 га в городах (25 соток)
    rural: 1.0      // 1 га в сельской местности (100 соток)
};

// DOM Elements
const landCategorySelect = document.getElementById('landCategory');
const landPurposeSelect = document.getElementById('landPurpose');
const landForm = document.getElementById('landForm');
const resultSection = document.getElementById('resultSection');
const resetBtn = document.getElementById('resetBtn');
const baseRateInput = document.getElementById('baseRate');
const regionSelect = document.getElementById('region');

// Update land purposes when category changes
landCategorySelect.addEventListener('change', function() {
    const category = this.value;
    landPurposeSelect.innerHTML = '<option value="">Выберите назначение</option>';
    
    if (category && LAND_PURPOSES[category]) {
        LAND_PURPOSES[category].forEach(purpose => {
            const option = document.createElement('option');
            option.value = purpose.value;
            option.textContent = purpose.label;
            option.dataset.multiplier = purpose.multiplier;
            landPurposeSelect.appendChild(option);
        });
    }
    
    updateBaseRate();
});

// Update base rate when region changes
regionSelect.addEventListener('change', updateBaseRate);
landPurposeSelect.addEventListener('change', updateBaseRate);

// Calculate and display base rate
function updateBaseRate() {
    const category = landCategorySelect.value;
    const region = regionSelect.value;
    const purposeOption = landPurposeSelect.options[landPurposeSelect.selectedIndex];
    
    if (!category || !region) {
        baseRateInput.value = '';
        return;
    }
    
    const categoryRates = BASE_RATES[category];
    let baseRate = categoryRates[region] || categoryRates.default || 0;
    
    // Apply purpose multiplier
    if (purposeOption && purposeOption.dataset.multiplier) {
        baseRate *= parseFloat(purposeOption.dataset.multiplier);
    }
    
    baseRateInput.value = formatNumber(Math.round(baseRate));
}

// Calculate land tax
function calculateLandTax(area, baseRate, hasBenefits, region) {
    let benefitArea = 0;
    let taxableArea = area;
    
    if (hasBenefits) {
        // Determine if urban or rural
        const isUrban = ['astana', 'almaty', 'shymkent'].includes(region);
        benefitArea = isUrban ? BENEFIT_LIMITS.urban : BENEFIT_LIMITS.rural;
        taxableArea = Math.max(0, area - benefitArea);
    }
    
    const tax = taxableArea * baseRate;
    
    return {
        tax: tax,
        benefitArea: benefitArea,
        taxableArea: taxableArea,
        totalArea: area
    };
}

// Format number with spaces
function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Get region name
function getRegionName(regionCode) {
    const select = document.getElementById('region');
    const option = select.querySelector(`option[value="${regionCode}"]`);
    return option ? option.textContent : '';
}

// Get category name
function getCategoryName(categoryCode) {
    const select = document.getElementById('landCategory');
    const option = select.querySelector(`option[value="${categoryCode}"]`);
    return option ? option.textContent : '';
}

// Get purpose name
function getPurposeName(purposeCode) {
    const select = document.getElementById('landPurpose');
    const option = select.querySelector(`option[value="${purposeCode}"]`);
    return option ? option.textContent : '';
}

// Handle form submission
landForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const landCategory = landCategorySelect.value;
    const landPurpose = landPurposeSelect.value;
    const landArea = parseFloat(document.getElementById('landArea').value);
    const region = regionSelect.value;
    const baseRate = parseFloat(baseRateInput.value.replace(/\s/g, ''));
    const hasBenefits = document.getElementById('hasBenefits').checked;
    
    // Calculate tax
    const result = calculateLandTax(landArea, baseRate, hasBenefits, region);
    
    // Prepare details
    let detailsHTML = `
        <p><strong>Категория земель:</strong> ${getCategoryName(landCategory)}</p>
        <p><strong>Целевое назначение:</strong> ${getPurposeName(landPurpose)}</p>
        <p><strong>Площадь участка:</strong> ${landArea} га (${formatNumber(landArea * 100)} соток)</p>
        <p><strong>Регион:</strong> ${getRegionName(region)}</p>
        <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
        <p><strong>Базовая ставка (2026 год):</strong> ${formatNumber(baseRate)} ₸/га</p>
    `;
    
    // Apply benefits if applicable
    if (hasBenefits && result.benefitArea > 0) {
        const benefitTax = result.benefitArea * baseRate;
        const originalTax = landArea * baseRate;
        
        detailsHTML += `
            <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
            <p style="color: #2ecc71;"><strong>✓ Льготная площадь:</strong> ${result.benefitArea} га (${formatNumber(result.benefitArea * 100)} соток)</p>
            <p><strong>Облагаемая площадь:</strong> ${result.taxableArea} га</p>
        `;
        
        if (result.taxableArea > 0) {
            detailsHTML += `
                <p><strong>Налог без льгот:</strong> ${formatNumber(originalTax)} ₸</p>
                <p style="color: #2ecc71;"><strong>Экономия по льготе:</strong> ${formatNumber(benefitTax)} ₸</p>
            `;
        } else {
            detailsHTML += `
                <p style="color: #2ecc71; font-weight: 600;"><strong>✓ Налог полностью не взимается по льготе</strong></p>
                <p><small>Льгота покрывает всю площадь участка</small></p>
            `;
        }
    }
    
    // Display results
    document.getElementById('taxAmount').textContent = `${formatNumber(result.tax)} ₸`;
    document.getElementById('resultDetails').innerHTML = detailsHTML;
    
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Reset form
resetBtn.addEventListener('click', function() {
    landForm.reset();
    resultSection.style.display = 'none';
    landPurposeSelect.innerHTML = '<option value="">Выберите назначение</option>';
    baseRateInput.value = '';
});

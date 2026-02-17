// Property Tax Calculator for Kazakhstan - 2026

// Налоговые ставки на имущество физлиц (НК РК статья 505)
// Прогрессивная шкала с учетом инфляции на 2026 год
const PROPERTY_TAX_RATES = [
    { threshold: 52000000, rate: 0, baseTax: 0 },  // До 52 млн ₸ - освобождены
    { threshold: 104000000, rate: 0.0005, baseTax: 0 },  // 52-104 млн: 0,05%
    { threshold: 156000000, rate: 0.0007, baseTax: 26000 },  // 104-156 млн: 26,000 + 0,07%
    { threshold: Infinity, rate: 0.001, baseTax: 62400 }  // Свыше 156 млн: 62,400 + 0,1%
];

// Базовые ставки за м² по типам населенных пунктов (2026 год)
const AREA_RATES = {
    astana: 240,    // Астана (увеличено с учетом инфляции)
    almaty: 240,    // Алматы
    shymkent: 180,  // Шымкент
    regional: 140,  // Областные центры
    district: 90,   // Районные центры
    rural: 55       // Сельская местность
};

// Коэффициенты по типу недвижимости
const PROPERTY_MULTIPLIERS = {
    apartment: 1.0,   // Квартира
    house: 1.3,       // Жилой дом (повышенный коэффициент)
    dacha: 0.75,      // Дача
    garage: 0.55      // Гараж
};

// Льготы (необлагаемая площадь в м²)
const BENEFIT_AREAS = {
    astana: 65,    // В столице - до 65 м²
    almaty: 65,    // В Алматы - до 65 м²
    shymkent: 70,  // В Шымкенте - до 70 м²
    regional: 80,  // В областных центрах - до 80 м²
    district: 100, // В районных центрах - до 100 м²
    rural: 150     // В сельской местности - до 150 м²
};

// DOM Elements
const calculationMethodSelect = document.getElementById('calculationMethod');
const propertyForm = document.getElementById('propertyForm');
const resultSection = document.getElementById('resultSection');
const resetBtn = document.getElementById('resetBtn');
const valueFields = document.getElementById('valueFields');
const areaFields = document.getElementById('areaFields');

// Handle calculation method change
calculationMethodSelect.addEventListener('change', function() {
    valueFields.style.display = 'none';
    areaFields.style.display = 'none';
    
    if (this.value === 'value') {
        valueFields.style.display = 'block';
    } else if (this.value === 'area') {
        areaFields.style.display = 'block';
    }
});

// Calculate tax based on property value (progressive scale)
function calculateTaxByValue(propertyValue) {
    if (propertyValue < PROPERTY_TAX_RATES[0].threshold) {
        return {
            tax: 0,
            exempt: true,
            details: `Объект освобождён от налога (стоимость менее ${formatNumber(PROPERTY_TAX_RATES[0].threshold)} ₸)`
        };
    }
    
    for (let i = 1; i < PROPERTY_TAX_RATES.length; i++) {
        const currentRate = PROPERTY_TAX_RATES[i];
        const previousThreshold = PROPERTY_TAX_RATES[i - 1].threshold;
        
        if (propertyValue <= currentRate.threshold) {
            const excess = propertyValue - previousThreshold;
            const tax = currentRate.baseTax + (excess * currentRate.rate);
            return {
                tax: tax,
                exempt: false,
                bracket: i,
                excess: excess,
                rate: currentRate.rate * 100,
                baseTax: currentRate.baseTax
            };
        }
    }
    
    return { tax: 0, exempt: false };
}

// Calculate tax based on area
function calculateTaxByArea(area, propertyType, cityType, hasBenefits) {
    const baseRate = AREA_RATES[cityType] || AREA_RATES.rural;
    const multiplier = PROPERTY_MULTIPLIERS[propertyType] || 1.0;
    const benefitArea = hasBenefits ? BENEFIT_AREAS[cityType] : 0;
    
    const taxableArea = Math.max(0, area - benefitArea);
    const tax = taxableArea * baseRate * multiplier;
    
    return {
        tax: tax,
        baseRate: baseRate,
        multiplier: multiplier,
        benefitArea: benefitArea,
        taxableArea: taxableArea,
        totalArea: area
    };
}

// Format number with spaces
function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Get city name
function getCityName(cityType) {
    const names = {
        astana: 'Астана',
        almaty: 'Алматы',
        shymkent: 'Шымкент',
        regional: 'Областной центр',
        district: 'Районный центр',
        rural: 'Сельская местность'
    };
    return names[cityType] || '';
}

// Get property type name
function getPropertyTypeName(propertyType) {
    const names = {
        apartment: 'Квартира',
        house: 'Жилой дом',
        dacha: 'Дача',
        garage: 'Гараж'
    };
    return names[propertyType] || '';
}

// Handle form submission
propertyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const calculationMethod = calculationMethodSelect.value;
    const hasBenefits = document.getElementById('hasBenefits').checked;
    let taxAmount = 0;
    let detailsHTML = '';
    
    if (calculationMethod === 'value') {
        const propertyValue = parseFloat(document.getElementById('propertyValue').value);
        const result = calculateTaxByValue(propertyValue);
        
        detailsHTML = `
            <p><strong>Метод расчёта:</strong> По стоимости имущества</p>
            <p><strong>Стоимость имущества:</strong> ${formatNumber(propertyValue)} ₸</p>
            <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
        `;
        
        if (result.exempt) {
            detailsHTML += `<p style="color: #2ecc71; font-weight: 600;">✓ ${result.details}</p>`;
            taxAmount = 0;
        } else {
            detailsHTML += `
                <p><strong>Превышение необлагаемого минимума:</strong> ${formatNumber(result.excess)} ₸</p>
                <p><strong>Налоговая ставка:</strong> ${result.rate}%</p>
            `;
            if (result.baseTax > 0) {
                detailsHTML += `<p><strong>Базовый налог:</strong> ${formatNumber(result.baseTax)} ₸</p>`;
            }
            taxAmount = result.tax;
        }
        
        if (hasBenefits && taxAmount > 0) {
            detailsHTML += `
                <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
                <p><strong>Налог до применения льгот:</strong> ${formatNumber(taxAmount)} ₸</p>
                <p style="color: #2ecc71; font-weight: 600;"><strong>✓ Применена льгота — налог не взимается</strong></p>
                <p><small>Льготы предоставляются пенсионерам, инвалидам I и II групп, многодетным матерям</small></p>
            `;
            taxAmount = 0;
        }
        
    } else if (calculationMethod === 'area') {
        const totalArea = parseFloat(document.getElementById('totalArea').value);
        const propertyType = document.getElementById('propertyType').value;
        const cityType = document.getElementById('cityType').value;
        
        const result = calculateTaxByArea(totalArea, propertyType, cityType, hasBenefits);
        taxAmount = result.tax;
        
        detailsHTML = `
            <p><strong>Метод расчёта:</strong> По площади</p>
            <p><strong>Тип недвижимости:</strong> ${getPropertyTypeName(propertyType)}</p>
            <p><strong>Населённый пункт:</strong> ${getCityName(cityType)}</p>
            <p><strong>Общая площадь:</strong> ${totalArea} м²</p>
            <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
            <p><strong>Базовая ставка:</strong> ${formatNumber(result.baseRate)} ₸/м²</p>
            <p><strong>Коэффициент типа недвижимости:</strong> ${result.multiplier}</p>
        `;
        
        if (result.benefitArea > 0) {
            detailsHTML += `
                <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
                <p style="color: #2ecc71;"><strong>✓ Льготная площадь:</strong> ${result.benefitArea} м² (не облагается)</p>
                <p><strong>Облагаемая площадь:</strong> ${result.taxableArea} м²</p>
            `;
        } else {
            detailsHTML += `<p><strong>Облагаемая площадь:</strong> ${result.taxableArea} м²</p>`;
        }
    }
    
    // Display results
    document.getElementById('taxAmount').textContent = `${formatNumber(taxAmount)} ₸`;
    document.getElementById('resultDetails').innerHTML = detailsHTML;
    
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Reset form
resetBtn.addEventListener('click', function() {
    propertyForm.reset();
    resultSection.style.display = 'none';
    valueFields.style.display = 'none';
    areaFields.style.display = 'none';
});

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Данные заявки
const orderData = {
    package: null,
    packageName: null,
    packageDesc: null,
    packagePrice: null,
    additionalParts: [],
    location: null,
    locationType: null,
    latitude: null,
    longitude: null,
    date: null,
    time: null,
    photos: [],
    vin: null,
    contact: null,
    userId: tg.initDataUnsafe?.user?.id || null,
    username: tg.initDataUnsafe?.user?.username || null,
    firstName: tg.initDataUnsafe?.user?.first_name || null
};

// Текущий шаг
let currentStep = 1;

// Список дополнительных элементов
const additionalPartsList = [
    "Бампер передний (полностью)",
    "Бампер задний (полностью)",
    "Дверь, 1шт",
    "Капот полностью",
    "Капот часть (полоса)",
    "Корпуса зеркал, 2шт",
    "Крыло переднее полностью, 1шт",
    "Крыло переднее частично (полоса), 1шт",
    "Крыша частично (полоса над лобовым стеклом)",
    "Горизонтальная полоса зоны погрузки заднего бампера",
    "Панель двери под ручкой, 1шт (без гарантии)",
    "Порог наружний, 2шт (без гарантии)",
    "Порог внутренний, 1шт",
    "Противотуманная фара, 1шт",
    "Фара головного света, 1шт",
    "Расширитель крыла, 1шт (без гарантии)",
    "Стойка задняя, 1шт",
    "Стойка передняя, 1шт",
    "Стойка передней двери, 1шт",
    "Крыша полностью",
    "Стойка задней двери, 1шт"
];

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initPackageSelection();
    initAdditionalParts();
    initDateTime();
    initPhotos();
});

// Шаг 1: Выбор комплекта
function initPackageSelection() {
    const packageCards = document.querySelectorAll('.package-card');
    packageCards.forEach(card => {
        card.addEventListener('click', () => {
            const packageId = card.dataset.package;
            
            if (packageId === 'custom') {
                const customDesc = prompt('Опишите, что нужно оклеить:');
                if (customDesc) {
                    orderData.package = 'custom';
                    orderData.packageName = 'Индивидуальный комплект';
                    orderData.packageDesc = customDesc;
                    orderData.packagePrice = 'рассчитывается индивидуально';
                    goToStep(2);
                }
            } else if (packageId === 'parts') {
                orderData.package = 'parts';
                orderData.packageName = 'Подетальная оклейка';
                orderData.packageDesc = '';
                orderData.packagePrice = 'рассчитывается индивидуально';
                goToStep(2);
            } else {
                const packageInfo = {
                    '1': { name: '№1 НЕОБХОДИМЫЙ', desc: 'капот, бампер, два крыла, два зеркала или фары', price: '31,450 - 42,550₽' },
                    '9': { name: '№9 БАЗОВЫЙ', desc: 'капот, бампер, защита под ручками', price: '46,750 - 63,250₽' },
                    '10': { name: '№10 ПРЕМИУМ', desc: 'капот, крылья, бампер, защита под ручки, зеркала, фары, стойки', price: '55,250 - 74,750₽' },
                    '20': { name: '№20 МАКСИМУМ', desc: 'кузов полностью', price: '148,750 - 201,250₽' }
                };
                
                const info = packageInfo[packageId];
                orderData.package = packageId;
                orderData.packageName = info.name;
                orderData.packageDesc = info.desc;
                orderData.packagePrice = info.price;
                goToStep(2);
            }
        });
    });
}

// Шаг 2: Дополнительные элементы
function initAdditionalParts() {
    const container = document.getElementById('additionalParts');
    additionalPartsList.forEach((part, index) => {
        const partItem = document.createElement('div');
        partItem.className = 'part-item';
        partItem.innerHTML = `
            <div class="part-checkbox"></div>
            <div>${part}</div>
        `;
        partItem.addEventListener('click', () => togglePart(partItem, part));
        container.appendChild(partItem);
    });
}

function togglePart(element, partName) {
    element.classList.toggle('selected');
    const index = orderData.additionalParts.indexOf(partName);
    if (index > -1) {
        orderData.additionalParts.splice(index, 1);
    } else {
        orderData.additionalParts.push(partName);
    }
}

function skipAdditional() {
    orderData.additionalParts = [];
    goToStep(3);
}

function confirmAdditional() {
    goToStep(3);
}

// Шаг 3: Локация
function requestLocation() {
    if (tg.LocationManager) {
        tg.LocationManager.getLocation((location) => {
            if (location) {
                orderData.location = `Координаты: ${location.latitude}, ${location.longitude}`;
                orderData.locationType = 'geo';
                orderData.latitude = location.latitude;
                orderData.longitude = location.longitude;
                goToStep(4);
            } else {
                alert('Не удалось получить геолокацию');
            }
        });
    } else {
        alert('Геолокация недоступна. Выберите дилерский центр или введите адрес.');
    }
}

function confirmLocation() {
    const dealership = document.getElementById('dealershipSelect').value;
    const customAddress = document.getElementById('customAddress').value;
    
    if (dealership) {
        const [name, address] = dealership.split('|');
        orderData.location = `${name}\n${address}`;
        orderData.locationType = 'dealership';
        goToStep(4);
    } else if (customAddress.trim()) {
        orderData.location = customAddress.trim();
        orderData.locationType = 'custom';
        goToStep(4);
    } else {
        alert('Пожалуйста, выберите дилерский центр или введите адрес');
    }
}

// Шаг 4: Дата и время
function initDateTime() {
    // Быстрые даты
    const dateBtns = document.querySelectorAll('.date-btn');
    dateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            dateBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            const offset = parseInt(btn.dataset.offset);
            const date = new Date();
            date.setDate(date.getDate() + offset);
            orderData.date = date.toISOString().split('T')[0];
            document.getElementById('customDate').value = orderData.date;
        });
    });
    
    // Кастомная дата
    document.getElementById('customDate').addEventListener('change', (e) => {
        orderData.date = e.target.value;
        dateBtns.forEach(b => b.classList.remove('selected'));
    });
    
    // Генерация времени
    const timeGrid = document.getElementById('timeGrid');
    const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
    times.forEach(time => {
        const btn = document.createElement('button');
        btn.className = 'time-btn';
        btn.textContent = time;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            orderData.time = time;
            document.getElementById('customTime').value = '';
        });
        timeGrid.appendChild(btn);
    });
    
    // Кастомное время
    document.getElementById('customTime').addEventListener('change', (e) => {
        orderData.time = e.target.value;
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
    });
}

function confirmDateTime() {
    if (!orderData.date) {
        alert('Пожалуйста, выберите дату');
        return;
    }
    if (!orderData.time) {
        alert('Пожалуйста, выберите время');
        return;
    }
    goToStep(5);
}

// Шаг 5: Фото
function initPhotos() {
    const photoInput = document.getElementById('photoInput');
    photoInput.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                orderData.photos.push(event.target.result);
                displayPhotos();
            };
            reader.readAsDataURL(file);
        });
    });
}

function displayPhotos() {
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = '';
    orderData.photos.forEach((photo, index) => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'photo-item';
        photoDiv.innerHTML = `
            <img src="${photo}" alt="Photo ${index + 1}">
            <button class="photo-remove" onclick="removePhoto(${index})">×</button>
        `;
        preview.appendChild(photoDiv);
    });
    
    document.getElementById('btnConfirmPhotos').disabled = orderData.photos.length === 0;
}

function removePhoto(index) {
    orderData.photos.splice(index, 1);
    displayPhotos();
}

function confirmPhotos() {
    if (orderData.photos.length === 0) {
        alert('Пожалуйста, загрузите хотя бы одно фото');
        return;
    }
    goToStep(6);
}

// Шаг 6: VIN
function confirmVIN() {
    const vinInput = document.getElementById('vinInput');
    const vin = vinInput.value.trim().toUpperCase().replace(/[\s-]/g, '');
    const errorDiv = document.getElementById('vinError');
    
    // Валидация VIN
    if (vin.length !== 17) {
        errorDiv.textContent = `VIN должен содержать 17 символов. У вас: ${vin.length}`;
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (/[IOQ]/.test(vin)) {
        errorDiv.textContent = 'В VIN не могут быть буквы I, O или Q';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
        errorDiv.textContent = 'VIN должен содержать только латинские буквы (кроме I, O, Q) и цифры';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    orderData.vin = vin;
    errorDiv.classList.add('hidden');
    goToStep(7);
}

// Шаг 7: Контакт
function confirmContact() {
    const contactInput = document.getElementById('phoneInput');
    const contact = contactInput.value.trim();
    const errorDiv = document.getElementById('contactError');
    
    if (!contact) {
        errorDiv.textContent = 'Пожалуйста, введите контакт';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Валидация контакта
    const isPhone = /^[\+]?[789]/.test(contact);
    const isEmail = /@/.test(contact) && /\./.test(contact);
    const isTelegram = /^@/.test(contact);
    
    if (isPhone) {
        const digits = contact.replace(/\D/g, '');
        if (digits.length < 10) {
            errorDiv.textContent = 'Номер телефона слишком короткий';
            errorDiv.classList.remove('hidden');
            return;
        }
    } else if (isEmail) {
        if (/[а-яА-ЯёЁ]/.test(contact)) {
            errorDiv.textContent = 'Email не может содержать кириллицу';
            errorDiv.classList.remove('hidden');
            return;
        }
    } else if (isTelegram) {
        if (contact.length < 6) {
            errorDiv.textContent = 'Telegram username слишком короткий';
            errorDiv.classList.remove('hidden');
            return;
        }
    }
    
    orderData.contact = contact;
    errorDiv.classList.add('hidden');
    goToStep(8);
}

// Шаг 8: Подтверждение
function goToStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`step${step}`).classList.remove('hidden');
    currentStep = step;
    
    if (step === 8) {
        displaySummary();
    }
    
    window.scrollTo(0, 0);
}

function displaySummary() {
    const summary = document.getElementById('summary');
    let html = '';
    
    html += `<div class="summary-item">
        <div class="summary-label">Комплект</div>
        <div class="summary-value">${orderData.packageName}<br><small>${orderData.packageDesc}</small></div>
    </div>`;
    
    if (orderData.additionalParts.length > 0) {
        html += `<div class="summary-item">
            <div class="summary-label">Дополнительно</div>
            <div class="summary-value">${orderData.additionalParts.join(', ')}</div>
        </div>`;
    }
    
    html += `<div class="summary-item">
        <div class="summary-label">Стоимость</div>
        <div class="summary-value">${orderData.packagePrice}</div>
    </div>`;
    
    html += `<div class="summary-item">
        <div class="summary-label">VIN</div>
        <div class="summary-value">${orderData.vin}</div>
    </div>`;
    
    html += `<div class="summary-item">
        <div class="summary-label">Локация</div>
        <div class="summary-value">${orderData.location}</div>
    </div>`;
    
    html += `<div class="summary-item">
        <div class="summary-label">Дата и время</div>
        <div class="summary-value">${orderData.date} ${orderData.time}</div>
    </div>`;
    
    html += `<div class="summary-item">
        <div class="summary-label">Фотографий</div>
        <div class="summary-value">${orderData.photos.length}</div>
    </div>`;
    
    html += `<div class="summary-item">
        <div class="summary-label">Контакт</div>
        <div class="summary-value">${orderData.contact}</div>
    </div>`;
    
    summary.innerHTML = html;
}

function goBack() {
    goToStep(1);
}

// Отправка заявки
function submitOrder() {
    // Отправляем данные боту
    tg.sendData(JSON.stringify(orderData));
    goToStep(9);
}

function restartApp() {
    window.location.reload();
}

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Диагностика - выводим информацию о Telegram
console.log('=== TELEGRAM WEB APP INFO ===');
console.log('initData:', tg.initData);
console.log('initDataUnsafe:', tg.initDataUnsafe);
console.log('version:', tg.version);
console.log('platform:', tg.platform);
console.log('User ID:', tg.initDataUnsafe?.user?.id);
console.log('Bot:', tg.initDataUnsafe?.receiver);
console.log('===========================');

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
    contactType: null,
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
    
    // Добавляем обработчик для кнопки отправки
    const btnSubmit = document.getElementById('btnSubmitOrder');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', submitOrder);
    }
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
let currentContactType = 'phone';

function selectContactType(type) {
    currentContactType = type;
    
    // Убираем active со всех табов
    document.querySelectorAll('.contact-tab').forEach(tab => tab.classList.remove('active'));
    
    // Добавляем active к выбранному табу
    event.target.classList.add('active');
    
    // Скрываем все инпуты
    document.getElementById('phoneInput').classList.add('hidden');
    document.getElementById('emailInput').classList.add('hidden');
    document.getElementById('telegramInput').classList.add('hidden');
    
    // Показываем нужный инпут и меняем подсказку
    const hintDiv = document.getElementById('contactHint');
    if (type === 'phone') {
        document.getElementById('phoneInput').classList.remove('hidden');
        hintDiv.textContent = 'Введите номер телефона';
    } else if (type === 'email') {
        document.getElementById('emailInput').classList.remove('hidden');
        hintDiv.textContent = 'Введите email адрес';
    } else if (type === 'telegram') {
        document.getElementById('telegramInput').classList.remove('hidden');
        hintDiv.textContent = 'Введите Telegram username (с @)';
    }
    
    // Очищаем ошибку
    document.getElementById('contactError').classList.add('hidden');
}

function sharePhone() {
    // Telegram Web App не поддерживает requestContact напрямую
    // Просим пользователя ввести номер или используем кнопку внизу
    alert('Пожалуйста, введите номер телефона вручную в поле ниже или выберите другой способ связи');
}

function useTelegram() {
    // Используем данные пользователя из Telegram
    if (orderData.username) {
        orderData.contact = '@' + orderData.username;
        orderData.contactType = 'telegram';
        goToStep(8);
    } else if (orderData.userId) {
        orderData.contact = 'Telegram ID: ' + orderData.userId;
        orderData.contactType = 'telegram';
        goToStep(8);
    } else {
        alert('Не удалось получить Telegram username. Пожалуйста, введите контакт вручную.');
    }
}

function confirmContact() {
    const errorDiv = document.getElementById('contactError');
    let contact = '';
    
    if (currentContactType === 'phone') {
        contact = document.getElementById('phoneInput').value.trim();
        
        if (!contact) {
            errorDiv.textContent = 'Пожалуйста, введите номер телефона';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        // Валидация телефона
        const digits = contact.replace(/\D/g, '');
        if (digits.length < 10) {
            errorDiv.textContent = 'Номер телефона слишком короткий (минимум 10 цифр)';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (!/^[\+]?[789]/.test(contact)) {
            errorDiv.textContent = 'Номер должен начинаться с +, 7, 8 или 9';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        orderData.contact = contact;
        orderData.contactType = 'phone';
        
    } else if (currentContactType === 'email') {
        contact = document.getElementById('emailInput').value.trim();
        
        if (!contact) {
            errorDiv.textContent = 'Пожалуйста, введите email';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        // Валидация email
        if (!/@/.test(contact)) {
            errorDiv.textContent = 'Email должен содержать символ @';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (/[а-яА-ЯёЁ]/.test(contact)) {
            errorDiv.textContent = 'Email не может содержать кириллицу';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(contact)) {
            errorDiv.textContent = 'Некорректный формат email';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        orderData.contact = contact;
        orderData.contactType = 'email';
        
    } else if (currentContactType === 'telegram') {
        contact = document.getElementById('telegramInput').value.trim();
        
        if (!contact) {
            errorDiv.textContent = 'Пожалуйста, введите Telegram username';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        // Валидация Telegram
        if (!contact.startsWith('@')) {
            errorDiv.textContent = 'Telegram username должен начинаться с @';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (contact.length < 6) {
            errorDiv.textContent = 'Telegram username слишком короткий';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        orderData.contact = contact;
        orderData.contactType = 'telegram';
    }
    
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
        
        // Настраиваем MainButton для отправки
        if (tg.MainButton) {
            // Сначала удаляем старые обработчики
            tg.MainButton.offClick(submitOrder);
            // Настраиваем кнопку
            tg.MainButton.setText('✅ Отправить заявку');
            tg.MainButton.enable();
            tg.MainButton.show();
            // Добавляем обработчик
            tg.MainButton.onClick(submitOrder);
        }
    } else {
        // Скрываем MainButton на других шагах
        if (tg.MainButton) {
            tg.MainButton.hide();
            tg.MainButton.offClick(submitOrder);
        }
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
        <div class="summary-value">`;
    
    if (orderData.contactType === 'phone') {
        html += `📱 ${orderData.contact}`;
    } else if (orderData.contactType === 'email') {
        html += `📧 ${orderData.contact}`;
    } else if (orderData.contactType === 'telegram') {
        html += `💬 ${orderData.contact}`;
    } else {
        html += orderData.contact;
    }
    
    html += `</div>
    </div>`;
    
    summary.innerHTML = html;
}

function goBack() {
    goToStep(1);
}

// Отправка заявки
function submitOrder() {
    try {
        console.log('=== НАЧАЛО ОТПРАВКИ ЗАЯВКИ ===');
        
        // Проверяем обязательные поля
        if (!orderData.packageName) { alert('Ошибка: не выбран комплект'); return; }
        if (!orderData.location) { alert('Ошибка: не указана локация'); return; }
        if (!orderData.date || !orderData.time) { alert('Ошибка: не указана дата или время'); return; }
        if (!orderData.photos || orderData.photos.length === 0) { alert('Ошибка: не загружены фотографии'); return; }
        if (!orderData.vin) { alert('Ошибка: не указан VIN-номер'); return; }
        if (!orderData.contact) { alert('Ошибка: не указан контакт'); return; }
        
        console.log('✓ Все поля заполнены');
        
        // Формируем компактные данные для команды
        const orderText = [
            `📦 ${orderData.packageName}`,
            orderData.packageDesc,
            orderData.additionalParts.length > 0 ? `➕ ${orderData.additionalParts.join(', ')}` : '',
            `💰 ${orderData.packagePrice}`,
            `🔢 VIN: ${orderData.vin}`,
            `📍 ${orderData.location}`,
            `📅 ${orderData.date} ${orderData.time}`,
            `📞 ${orderData.contact}`,
            `📸 Фото: ${orderData.photos.length} шт`
        ].filter(Boolean).join('\n');
        
        // Сохраняем данные в localStorage для бота
        const orderDataForBot = {
            package: orderData.package,
            packageName: orderData.packageName,
            packageDesc: orderData.packageDesc,
            packagePrice: orderData.packagePrice,
            additionalParts: orderData.additionalParts,
            location: orderData.location,
            locationType: orderData.locationType,
            latitude: orderData.latitude,
            longitude: orderData.longitude,
            date: orderData.date,
            time: orderData.time,
            photosCount: orderData.photos.length,
            vin: orderData.vin,
            contact: orderData.contact,
            contactType: orderData.contactType,
            timestamp: Date.now()
        };
        
        // Кодируем данные в base64 для передачи через команду
        const dataEncoded = btoa(encodeURIComponent(JSON.stringify(orderDataForBot)));
        
        console.log('Закрытие Mini App с передачей данных...');
        
        // Показываем превью заявки и закрываем
        tg.showPopup({
            title: '✅ Заявка готова!',
            message: 'Сейчас откроется чат. Нажмите кнопку "Отправить заявку" чтобы подтвердить.',
            buttons: [{type: 'ok'}]
        }, () => {
            // Закрываем Mini App и возвращаемся в чат
            // Бот автоматически покажет кнопку для подтверждения
            tg.close();
        });
        
        // Пытаемся отправить через sendData (как резервный вариант)
        try {
            tg.sendData(dataEncoded);
            console.log('✓ Данные отправлены через sendData');
        } catch (e) {
            console.log('sendData не сработал, используем резервный вариант');
        }
        
        console.log('=== ЗАВЕРШЕНО ===');
        
    } catch (error) {
        console.error('ОШИБКА:', error);
        alert('Ошибка: ' + error.message);
    }
}

function restartApp() {
    window.location.reload();
}

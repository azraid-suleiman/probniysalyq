/**
 * Salyq Calc — Auth System
 * Полноценная аутентификация через localStorage
 */

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function getUsers() {
    return JSON.parse(localStorage.getItem('sc_users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('sc_users', JSON.stringify(users));
}

function getCurrentUser() {
    const sessionUser = sessionStorage.getItem('sc_current');
    const persistUser = localStorage.getItem('sc_current');
    const raw = sessionUser || persistUser;
    return raw ? JSON.parse(raw) : null;
}

function saveCurrentUser(user, remember) {
    const data = JSON.stringify(user);
    sessionStorage.setItem('sc_current', data);
    if (remember) localStorage.setItem('sc_current', data);
}

function clearCurrentUser() {
    sessionStorage.removeItem('sc_current');
    localStorage.removeItem('sc_current');
}

// Простой хэш для пароля (не криптографический, только для демо)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const chr = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return 'h' + Math.abs(hash).toString(36) + password.length.toString(36);
}

// Получить инициалы из имени
function getInitials(name) {
    return name.trim().split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

// Цвет аватарки по имени
function getAvatarColor(name) {
    const colors = ['#c9a961', '#8b7355', '#6b8e5e', '#5e7a8e', '#8e5e6b', '#7a6b8e'];
    let idx = 0;
    for (let ch of name) idx += ch.charCodeAt(0);
    return colors[idx % colors.length];
}

// ─── Toast-уведомление ───────────────────────────────────────────────────────

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast toast--' + type + ' toast--visible';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// ─── Управление модалками ─────────────────────────────────────────────────────

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
    // Сбросить ошибки
    modal.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    modal.querySelectorAll('.input-wrap input').forEach(el => el.classList.remove('input--error', 'input--ok'));
    modal.querySelectorAll('.auth-alert').forEach(el => { el.style.display = 'none'; el.textContent = ''; });
    modal.querySelectorAll('form').forEach(f => f.reset());
    const sw = modal.querySelector('#strengthWrap');
    if (sw) sw.style.display = 'none';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => {
        m.classList.remove('modal--open');
    });
    document.body.style.overflow = '';
}

// ─── Валидация ───────────────────────────────────────────────────────────────

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function setFieldError(inputId, errId, msg) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) input.classList.add('input--error');
    if (input) input.classList.remove('input--ok');
    if (err) err.textContent = msg;
    return false;
}

function setFieldOk(inputId, errId) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) input.classList.remove('input--error');
    if (input) input.classList.add('input--ok');
    if (err) err.textContent = '';
    return true;
}

function showAlert(alertId, msg) {
    const el = document.getElementById(alertId);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

// ─── Сила пароля ─────────────────────────────────────────────────────────────

function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
        { label: 'Очень слабый', color: '#e74c3c', width: '20%' },
        { label: 'Слабый',       color: '#e67e22', width: '40%' },
        { label: 'Средний',      color: '#f39c12', width: '60%' },
        { label: 'Хороший',      color: '#2ecc71', width: '80%' },
        { label: 'Отличный',     color: '#27ae60', width: '100%' },
    ];
    return levels[Math.min(score, 4)];
}

// ─── Обновить UI после входа/выхода ──────────────────────────────────────────

function updateAuthUI() {
    const user = getCurrentUser();
    const authButtons = document.getElementById('authButtons');
    const userMenu    = document.getElementById('userMenu');
    const navAvatar   = document.getElementById('navAvatar');
    const navUserName = document.getElementById('navUserName');

    if (user) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu)    userMenu.style.display = 'flex';

        const initials = getInitials(user.name);
        const color    = getAvatarColor(user.name);
        const firstName = user.name.split(' ')[0];

        if (navAvatar) {
            navAvatar.textContent = initials;
            navAvatar.style.backgroundColor = color;
        }
        if (navUserName) navUserName.textContent = firstName;

        // Dropdown
        const dropName   = document.getElementById('dropdownName');
        const dropEmail  = document.getElementById('dropdownEmail');
        const dropAvatar = document.getElementById('dropdownAvatar');
        if (dropName)   dropName.textContent  = user.name;
        if (dropEmail)  dropEmail.textContent = user.email;
        if (dropAvatar) {
            dropAvatar.textContent = initials;
            dropAvatar.style.backgroundColor = color;
        }
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu)    userMenu.style.display = 'none';
    }
}

// ─── Загрузчик на кнопке ─────────────────────────────────────────────────────

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text   = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    btn.disabled = loading;
    if (text)   text.style.display   = loading ? 'none'   : 'inline';
    if (loader) loader.style.display = loading ? 'inline-block' : 'none';
}

// ─── Привязка событий ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {

    // Открытие модалок
    document.getElementById('loginBtn')   ?.addEventListener('click', () => openModal('loginModal'));
    document.getElementById('registerBtn')?.addEventListener('click', () => openModal('registerModal'));

    // Переключение между модалками
    document.getElementById('switchToRegister')?.addEventListener('click', e => {
        e.preventDefault(); closeModal('loginModal'); openModal('registerModal');
    });
    document.getElementById('switchToLogin')?.addEventListener('click', e => {
        e.preventDefault(); closeModal('registerModal'); openModal('loginModal');
    });

    // Закрытие по кнопке или фону
    document.querySelectorAll('[data-close]').forEach(el => {
        el.addEventListener('click', () => closeModal(el.dataset.close));
    });

    // Закрытие по Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeAllModals();
    });

    // ── Показать/скрыть пароль ──────────────────────────────────────────────
    document.querySelectorAll('.toggle-pw').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = document.getElementById(this.dataset.for);
            if (!input) return;
            const isText = input.type === 'text';
            input.type = isText ? 'password' : 'text';
            // Поменять иконку
            const svg = this.querySelector('svg');
            if (svg) {
                if (isText) {
                    svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
                } else {
                    svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
                }
            }
        });
    });

    // ── Индикатор силы пароля ──────────────────────────────────────────────
    const regPassword = document.getElementById('regPassword');
    if (regPassword) {
        regPassword.addEventListener('input', function () {
            const wrap  = document.getElementById('strengthWrap');
            const fill  = document.getElementById('strengthFill');
            const label = document.getElementById('strengthLabel');
            if (!this.value) { if (wrap) wrap.style.display = 'none'; return; }
            if (wrap) wrap.style.display = 'flex';
            const strength = checkPasswordStrength(this.value);
            if (fill)  { fill.style.width = strength.width; fill.style.backgroundColor = strength.color; }
            if (label) { label.textContent = strength.label; label.style.color = strength.color; }
        });
    }

    // ── Форма ВХОДА ────────────────────────────────────────────────────────
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email    = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const remember = document.getElementById('rememberMe')?.checked;

            // Скрыть предыдущий алерт
            const alertEl = document.getElementById('loginAlert');
            if (alertEl) alertEl.style.display = 'none';

            let valid = true;

            // Валидация email
            if (!email) {
                valid = setFieldError('loginEmail', 'loginEmailErr', 'Введите email адрес');
            } else if (!validateEmail(email)) {
                valid = setFieldError('loginEmail', 'loginEmailErr', 'Неверный формат email');
            } else {
                setFieldOk('loginEmail', 'loginEmailErr');
            }

            // Валидация пароля
            if (!password) {
                setFieldError('loginPassword', 'loginPasswordErr', 'Введите пароль');
                valid = false;
            } else {
                setFieldOk('loginPassword', 'loginPasswordErr');
            }

            if (!valid) return;

            setLoading('loginSubmit', true);

            // Имитация задержки (как будто запрос к серверу)
            setTimeout(() => {
                const users = getUsers();
                const hashedPw = hashPassword(password);
                const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hashedPw);

                if (user) {
                    saveCurrentUser(user, remember);
                    closeModal('loginModal');
                    updateAuthUI();
                    showToast(`Добро пожаловать, ${user.name.split(' ')[0]}! 👋`);
                } else {
                    setLoading('loginSubmit', false);
                    // Проверим, существует ли email вообще
                    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
                    if (emailExists) {
                        showAlert('loginAlert', '❌ Неверный пароль. Попробуйте ещё раз.');
                        setFieldError('loginPassword', 'loginPasswordErr', 'Неверный пароль');
                    } else {
                        showAlert('loginAlert', '❌ Аккаунт с таким email не найден.');
                        setFieldError('loginEmail', 'loginEmailErr', 'Email не зарегистрирован');
                    }
                }

                setLoading('loginSubmit', false);
            }, 600);
        });

        // Убирать ошибку при вводе
        document.getElementById('loginEmail')?.addEventListener('input', function () {
            if (this.value) setFieldOk('loginEmail', 'loginEmailErr');
        });
        document.getElementById('loginPassword')?.addEventListener('input', function () {
            if (this.value) setFieldOk('loginPassword', 'loginPasswordErr');
        });
    }

    // ── Форма РЕГИСТРАЦИИ ──────────────────────────────────────────────────
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name     = document.getElementById('regName').value.trim();
            const email    = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirm  = document.getElementById('regConfirm').value;

            const alertEl = document.getElementById('registerAlert');
            if (alertEl) alertEl.style.display = 'none';

            let valid = true;

            // Имя
            if (!name || name.length < 2) {
                valid = setFieldError('regName', 'regNameErr', 'Введите имя (минимум 2 символа)');
            } else if (name.split(' ').length < 2) {
                valid = setFieldError('regName', 'regNameErr', 'Введите имя и фамилию');
            } else {
                setFieldOk('regName', 'regNameErr');
            }

            // Email
            if (!email) {
                setFieldError('regEmail', 'regEmailErr', 'Введите email адрес');
                valid = false;
            } else if (!validateEmail(email)) {
                setFieldError('regEmail', 'regEmailErr', 'Неверный формат email');
                valid = false;
            } else {
                setFieldOk('regEmail', 'regEmailErr');
            }

            // Пароль
            if (!password) {
                setFieldError('regPassword', 'regPasswordErr', 'Придумайте пароль');
                valid = false;
            } else if (password.length < 6) {
                setFieldError('regPassword', 'regPasswordErr', 'Пароль должен быть не менее 6 символов');
                valid = false;
            } else {
                setFieldOk('regPassword', 'regPasswordErr');
            }

            // Подтверждение пароля
            if (!confirm) {
                setFieldError('regConfirm', 'regConfirmErr', 'Повторите пароль');
                valid = false;
            } else if (confirm !== password) {
                setFieldError('regConfirm', 'regConfirmErr', 'Пароли не совпадают');
                valid = false;
            } else {
                setFieldOk('regConfirm', 'regConfirmErr');
            }

            if (!valid) return;

            setLoading('registerSubmit', true);

            setTimeout(() => {
                const users = getUsers();

                // Проверить дубликат email
                if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                    setFieldError('regEmail', 'regEmailErr', 'Этот email уже зарегистрирован');
                    showAlert('registerAlert', '❌ Аккаунт с таким email уже существует.');
                    setLoading('registerSubmit', false);
                    return;
                }

                // Создать нового пользователя
                const newUser = {
                    id:           'user_' + Date.now(),
                    name:         name,
                    email:        email,
                    passwordHash: hashPassword(password),
                    createdAt:    new Date().toISOString(),
                };

                users.push(newUser);
                saveUsers(users);
                saveCurrentUser(newUser, true);

                closeModal('registerModal');
                updateAuthUI();
                showToast(`Аккаунт создан! Добро пожаловать, ${name.split(' ')[0]}! 🎉`);
                setLoading('registerSubmit', false);
            }, 700);
        });

        // Убирать ошибку при вводе
        ['regName','regEmail','regPassword','regConfirm'].forEach(id => {
            const errId = id.replace('reg','reg') + 'Err';
            const err = {
                regName: 'regNameErr', regEmail: 'regEmailErr',
                regPassword: 'regPasswordErr', regConfirm: 'regConfirmErr'
            }[id];
            document.getElementById(id)?.addEventListener('input', function () {
                if (this.value) {
                    this.classList.remove('input--error');
                    const errEl = document.getElementById(err);
                    if (errEl) errEl.textContent = '';
                }
            });
        });
    }

    // ── Пользовательское меню (аватарка) ───────────────────────────────────
    const userAvatarBtn = document.getElementById('userAvatarBtn');
    const userDropdown  = document.getElementById('userDropdown');

    if (userAvatarBtn && userDropdown) {
        userAvatarBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = userDropdown.classList.contains('dropdown--open');
            userDropdown.classList.toggle('dropdown--open', !isOpen);
        });

        document.addEventListener('click', function () {
            userDropdown.classList.remove('dropdown--open');
        });

        userDropdown.addEventListener('click', e => e.stopPropagation());
    }

    // ── Выход ───────────────────────────────────────────────────────────────
    document.getElementById('dropdownLogout')?.addEventListener('click', function (e) {
        e.preventDefault();
        clearCurrentUser();
        updateAuthUI();
        if (userDropdown) userDropdown.classList.remove('dropdown--open');
        showToast('Вы вышли из аккаунта');
    });

    // ── Мобильное меню ──────────────────────────────────────────────────────
    document.getElementById('mobileMenuToggle')?.addEventListener('click', function () {
        const links = document.querySelector('.nav-links');
        if (links) {
            const open = links.classList.toggle('nav-links--open');
            this.classList.toggle('toggle--open', open);
        }
    });

    // ── Плавный скролл к секциям ────────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
        });
    });

    // ── Инициализация ───────────────────────────────────────────────────────
    updateAuthUI();
});

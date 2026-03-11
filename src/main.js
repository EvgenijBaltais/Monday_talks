import '../assets/css/style.css'

;(function () {

    let Monday_talks_chat = {

        managers_name: 'Вилора',
        clients_name: 'Клиент',
        managers_photo: 'femalemanager.jpg',
        client_photo: 'femalemanager.jpg',
        text: '',
        step: 0,
        pollingActive: true,
        name_get_status: 'Готово',
        user_id: 0,
        dialog_id: 0,
        chat_identifier: 0,
        dialog_disabled: 0,
        dialog_in_proccess: 0,

        chat_start_phrases: [
            { manager: 'Добро пожаловать!' },
            { manager: 'Чем могу помочь?' }
        ],

        // Единый метод для отправки сообщения
        handleMessageSubmit(inputElement) {
            const messageText = inputElement.value.trim();
            
            if (messageText === '') return false;
            
            // Добавляем сообщение в чат
            document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.clientSpeech(messageText));
            
            // Скроллим вниз
            document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;
            
            // Очищаем поле ввода
            inputElement.value = '';

            this.sendMessage(messageText, this.dialog_id)
                .then(data => {
                    if (data && data.success) {
                        console.log('Сообщение отправлено:', messageText);
                    } else {
                        console.error('Ошибка отправки:', data?.error || 'Неизвестная ошибка');
                    }

                    if (!this.pollingActive) {
                        this.pollingActive = true

                        this.startLongPolling()
                    }
                })
                .catch(error => {
                    console.error('Ошибка при отправке:', error);
                });
            
            return true;
        },

        async startDialog () {

            const dialog_id = this.dialog_id
            const fingerprint = this.user_id

            try {
                const response = await fetch ('start_dialog.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ dialog_id, fingerprint })
                }) 

                const data = await response.json()

                this.dialog_id = data.dialog_id
                this.setCookie('dialog_id', data.dialog_id, 3);
                this.setCookie('dialog_in_proccess', 1, 3);

                console.log(data)

            } catch (error) {
                console.error('Start Dialog error:', error);
            }

            if (document.querySelectorAll('.blocking-dialog').length) {
                document.querySelectorAll('.blocking-dialog').forEach(item => item.remove())
            }
        },

        async restoreDialog () {

            const dialog_id = this.dialog_id
            const fingerprint = this.user_id

            try {
                const response = await fetch ('restore_dialog.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ dialog_id, fingerprint })
                }) 

                const data = await response.json()

                console.log(data)

                if (data.messages.length) {
                    let obj = {}
                    data.messages.forEach(item => {
                        obj[item.direction === 1 ? 'client' : 'manager'] = item.text
                        this.chat_start_phrases.push(obj)
                        obj = {}
                    })
                }

                if (!this.pollingActive) {
                    this.pollingActive += 1

                    this.startLongPolling()
                }

            } catch (error) {
                console.error('Start Dialog error:', error);
            }

            if (document.querySelectorAll('.blocking-dialog').length) {
                document.querySelectorAll('.blocking-dialog').forEach(item => item.remove())
            }
        },

        async endDialog () {

            const dialog_id = this.dialog_id

            try {

                this.deleteCookie('dialog_id')
                this.deleteCookie('dialog_in_proccess');
                this.dialog_in_proccess = false
                this.dialog_id = false

                const response = await fetch ('end_dialog.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ dialog_id })
                }) 

                const data = await response.json()
                return data

            } catch (error) {
                console.error('End Dialog error:', error);
            }
        },

        attachEvents() {
            document.addEventListener('click', e => {
                // Отмена всего лишнего по клику вне
                if (!e.target.classList.contains('dialog-smiles') && 
                    !e.target.classList.contains('smile') && 
                    !e.target.classList.contains('smiles')) {
                    const smilesPanel = document.querySelector('.smiles');
                    if (smilesPanel) {
                        smilesPanel.remove();
                    }
                }

                // Обработка клика по кнопке отправки
                if (e.target.classList.contains('message-send')) {
                    e.preventDefault();

                    const enterTextParent = e.target.closest('.enter-text');
                    const inputElement = enterTextParent ? enterTextParent.querySelector('.input-text') : null;

                    if (inputElement) {
                        this.handleMessageSubmit(inputElement);
                    }
                }

                // Закрытие сеанса чата

                if (e.target.classList.contains('finish-dialog')) {
                    e.preventDefault();
                    
                    this.endDialog (this.dialog_id).then(data => {

                        this.getParent(e.target, 'monday-dialog').querySelectorAll('.d-speech').forEach(item => item.remove())

                        this.chat_start_phrases = this.chat_start_phrases.slice(0, 2);

                        this.getParent(e.target, 'monday-dialog').querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', `
                            <div class = "dialog-end-w">
                                <img src = "/assets/images/end_chat/${this.getRandomNumber()}.png" class = "dialog-end-pic">
                                <p class = "dialog-end-p">Диалог завершен.</p>
                                <button class = "dialog-end-btn">Начать новый диалог</button>
                            </div>
                        `)

                        this.getParent(e.target, 'monday-dialog').querySelector('.dialog-form').insertAdjacentHTML('beforeend', `
                            <div class = "blocking-dialog"></div>
                        `)

                        e.target.remove()
                    })
                }

                // Открытие чата заново

                if (e.target.classList.contains('dialog-end-btn')) {
                    e.preventDefault();
                    
                    this.startDialog().then(() => {

                        this.getParent(e.target, 'monday-dialog').querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', `${this.chat_start_phrases.map(item => {
                            return Object.keys(item).map(key => {
                                return key === 'manager' ? this.managerSpeech(item[key]) : this.clientSpeech(item[key]);
                            }).join('');
                        }).join('')}`)

                        e.target.parentElement.remove()
                    })
                }

                // Смайлы, появление выбора
                if (e.target.classList.contains('dialog-smiles')) {
                    // Удаляем существующую панель, если есть
                    const existingSmiles = document.querySelector('.smiles');
                    if (existingSmiles) {
                        existingSmiles.remove();
                    }
                    
                    let smiles = `
                        <div class="smiles">
                            <i class="smile">😀</i>
                            <i class="smile">🤣</i>
                            <i class="smile">😍</i>
                            <i class="smile">😭</i>
                            <i class="smile">😡</i>
                            <i class="smile">🤡</i>
                        </div>
                    `;
                    e.target.insertAdjacentHTML('beforeend', smiles);
                }

                // Смайлы, выбор
                if (e.target.classList.contains('smile')) {
                    const inputElement = document.querySelector('.input-text');
                    if (inputElement) {
                        inputElement.value += e.target.innerText;
                        inputElement.focus();
                        e.target.parentElement.remove();
                    }
                }
            });

            // Обработка отправки формы по Enter
            const form = document.querySelector('.dialog-form');
            if (form) {
                form.addEventListener('submit', e => {
                    e.preventDefault();
                    
                    const inputElement = form.querySelector('.input-text');
                    if (inputElement) {
                        this.handleMessageSubmit(inputElement);
                    }
                });
            }

            // Дополнительная обработка нажатия Enter в самом поле ввода (на всякий случай)
            const inputElement = document.querySelector('.input-text');
            if (inputElement) {
                inputElement.addEventListener('keypress', e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const form = e.target.closest('.dialog-form');
                        if (form) {
                            form.dispatchEvent(new Event('submit', { cancelable: true }));
                        }
                    }
                });
            }
        },

        // Метод для инициализации user_id
        async initUserId() {
            // Проверяем куки
            let userId = this.getCookie('user_id');
            
            if (userId) {
                // Если нашли в куки - используем
                this.user_id = userId;
                console.log('Загружен user_id из куки:', userId);
                return userId;
            }

            // Если нет - генерируем новый
            try {
                userId = await this.getFingerPrint();
                this.user_id = userId;
                // Сохраняем в куки на 3 дня
                this.setCookie('user_id', userId, 3);
                console.log('Сгенерирован новый user_id:', userId);
                return userId;
            } catch (error) {
                console.error('Ошибка генерации fingerprint:', error);
                // В случае ошибки генерируем простой ID
                userId = 'guest_' + Math.random().toString(36).substr(2, 9);
                this.user_id = userId;
                this.setCookie('user_id', userId, 3);
                return userId;
            }

        },

        async sendMessage(message, dialog_id, isAdmin = false) {

            if (!document.querySelector('.finish-dialog')) {
                document.querySelector('.dialog-top__down').insertAdjacentHTML('beforeend', `<div class="finish-dialog">Завершить диалог</div>`)
            }

            try {
                // Используем сохраненный user_id
                const fingerprint = this.user_id;
                
                // Определяем direction: 1 - от клиента, 2 - от менеджера
                const direction = isAdmin ? 2 : 1;
                
                const response = await fetch('/send_message.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fingerprint,
                        message,
                        dialog_id,
                        direction,
                        admin: isAdmin ? 1 : 0
                    })
                });

                const data = await response.json();
                return data;

            } catch (error) {
                console.error('Send error:', error);
                return { success: false, error: error.message };
            }
        },

        async getFingerPrint() {
            const components = [
                navigator.userAgent,
                navigator.language,
                screen.colorDepth,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                navigator.hardwareConcurrency || 'unknown',
                screen.pixelDepth || screen.colorDepth,
                navigator.platform || 'unknown'
            ];
            
            const text = components.join('|||');
            return await this.sha256(text);
        },

        async sha256(str) {
            try {
                const buffer = new TextEncoder().encode(str);
                const hash = await crypto.subtle.digest('SHA-256', buffer);
                return Array.from(new Uint8Array(hash))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
            } catch (error) {
                console.error('SHA-256 error:', error);
                // Fallback на простой хеш
                return this.simpleHash(str);
            }
        },

        // Простой хеш для fallback
        simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(16).padStart(8, '0') +
                   Math.abs(hash * 2).toString(16).padStart(8, '0');
        },

        startLongPolling() {
            let lastMessageId = 0,
                dialog_id = this.dialog_id

            console.log('go')

            const poll = () => {
                if (!this.pollingActive) return;
                
                fetch('/poll_messages.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: this.user_id,
                        last_id: lastMessageId,
                        dialog_id
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.messages && data.messages.length > 0) {
                            console.log(`Новые сообщения по dialog_id ${dialog_id}:`, data.messages);

                            data.messages.forEach(item => {
                                // Проверяем, что сообщение от админа (direction = 2)
                                if (item.direction == 2) {
                                    document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.clientSpeech(item.message));
                                }
                            });

                            // Скроллим вниз после добавления всех сообщений
                            document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;

                            lastMessageId = data.messages[data.messages.length - 1].id;
                        }
                        if (this.pollingActive) poll();
                    })
                    .catch(error => {
                        console.error('Polling error:', error);
                        if (this.pollingActive) setTimeout(poll, 5000);
                    });
            };

            poll();

            window.addEventListener('beforeunload', () => {
                this.pollingActive = false;
            });
        },

        renderChat() {
            return `<div class="monday-dialog">
                <div class="options-select">
                    <div class="message-bubble">
                        <ul class="options-list">
                            <li class="options-list-item">
                                <a class="options-list-link">Позвать менеджера</a>
                            </li>
                            <li class="options-list-item">
                                <a class="options-list-link">Сменить имя</a>
                            </li>
                            <li class="options-list-item">
                                <a class="options-list-link">Написать в мессенджер</a>
                            </li>
                            <li class="options-list-item">
                                <a class="options-list-link">Написать на email</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="dialog-top">
                    <div class="dialog-top__up">
                        <div class="manager-icon" style="background-image: url('./assets/images/femalemanager.jpg')"></div>
                        <div class="manager-info">
                            <div class="manager-job">Менеджер</div>
                            <div class="manager-name">${this.managers_name}</div>
                        </div>
                    </div>
                    <div class="dialog-top__down">
                        <div class="online-status on">Мы онлайн</div>
                    </div>
                    <svg viewBox="0 0 1440 40" preserveAspectRatio="none">
                        <path d="M0,20 C200,45 400,-5 600,20 C800,40 1000,10 1440,20 L1440,40 L0,40 Z" fill="#fff"/>
                    </svg>
                </div>
                <div class="dialog-middle">
                    <div class="dialog-middle-w">
                        ${this.chat_start_phrases.map(item => {
                            return Object.keys(item).map(key => {
                                return key === 'manager' ? this.managerSpeech(item[key]) : this.clientSpeech(item[key]);
                            }).join('');
                        }).join('')}
                    </div>
                </div>
                <div class="dialog-bottom">
                    <form action="" class="dialog-form">
                        <div class="enter-text">
                            <input type="text" name="input-text" class="input-text" placeholder="Введите текст..." autofocus>
                            <button class="message-send" type="button"></button>
                        </div>
                        <div class="enter-dop">
                            <div class="dialog-robot"></div>
                            <div class="dialog-smiles"></div>
                            <div class="dialog-file"></div>
                        </div>
                    </form>
                </div>
            </div>`;
        },

        managerSpeech(phrase) {
            return `<div class="d-speech d-question">
                <div class="d-speech-img" style="background-image: url('./assets/images/${this.managers_photo}');"></div>
                <div class="d-speech-text">${phrase}</div>
            </div>`;
        },

        clientSpeech(phrase) {
            return `<div class="d-speech d-answer">
                <div class="d-speech-img" style="background-image: url('./assets/images/${this.client_photo}');"></div>
                <div class="d-speech-text">${phrase}</div>
            </div>`;
        },

        authorisedAnswer(name) {
            return this.managerSpeech(`Очень приятно ${name}! Сейчас я изучу ваш вопрос и позову менеджера. Он ответит на него!`);
        },

        setCookie(name, value, days) {
            const seconds = days * 24 * 60 * 60;
            document.cookie = `${name}=${value}; path=/; max-age=${seconds}`;
        },

        getCookie(name) {
            const value = document.cookie
                .split('; ')
                .find(row => row.startsWith(name + '='))
                ?.split('=')[1];
            
            return value || null;
        },

        deleteCookie(name) {
            // Удаляем cookie с текущего пути
            document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
            // Пробуем удалить с других возможных путей
            const pathParts = window.location.pathname.split('/');
            let currentPath = '';
            
            for (let i = 0; i < pathParts.length; i++) {
                currentPath += pathParts[i] + '/';
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=' + currentPath + ';';
            }
        },

        getParent(element, className) {
            // Если элемент не существует, возвращаем null
            if (element == null) return null;
            
            var parent = element.parentElement;
            
            while (parent != null) {
                // Проверяем наличие класса
                if (parent.className && (' ' + parent.className + ' ').indexOf(' ' + className + ' ') > -1) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            
            return null;
        },

        getRandomNumber(min = 1, max = 7) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        async init() {
            try {

                // Проверка существования диалога
                
                this.dialog_id = this.getCookie('dialog_id') || 0
                this.dialog_in_proccess = this.getCookie('dialog_in_proccess') || 0

                // Инициализируем user_id

                await this.initUserId()

                // Проверяем наличие или продолжение диалога
                console.log(this.dialog_id, this.dialog_in_proccess)
                this.dialog_id && this.dialog_in_proccess ? await this.restoreDialog() : await this.startDialog()
                
                if (!document.getElementById('app')) {
                    console.error('Элемент #app не найден');
                    return false;
                }

                // Рендерим чат
                document.querySelector('#app').innerHTML = this.renderChat();
                
                // Вешаем события
                this.attachEvents();


                // Скроллим вниз после добавления всех сообщений
                document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;

                // Добавляем кнопку, если надо
                if (this.dialog_in_proccess && !document.querySelector('.finish-dialog')) {
                    document.querySelector('.dialog-top__down').insertAdjacentHTML('beforeend', `<div class="finish-dialog">Завершить диалог</div>`)
                }

            } catch (error) {
                console.error('Ошибка инициализации чата:', error);
            }
        }
    };

    // Запускаем инициализацию
    Monday_talks_chat.init();

})();
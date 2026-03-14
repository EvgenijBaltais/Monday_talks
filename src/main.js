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
        lastMessageId: 0,
        pollingActive: false,
        pollingTimer: null,
        preloadImages: [
            "/assets/images/end_chat/1.png",
            "/assets/images/end_chat/2.png",
            "/assets/images/end_chat/3.png",
            "/assets/images/end_chat/4.png",
            "/assets/images/end_chat/5.png",
            "/assets/images/end_chat/6.png",
            "/assets/images/end_chat/7.png"
        ],
        preloadImagesIndex: Math.floor(Math.random() * 7),

        chat_start_phrases: [
            { manager: 'Добро пожаловать!' },
            { manager: 'Чем могу помочь?' }
        ],

        // Единый метод для отправки сообщения
        async handleMessageSubmit(inputElement) {
            const messageText = inputElement.value.trim();
            
            if (messageText === '') return false;
            
            // Очищаем поле ввода
            inputElement.value = '';

            if (!this.dialog_id) {console.log(1)
                await this.startDialog ()
            }

            this.sendMessage(messageText, this.dialog_id)
                .then(data => {
                    if (data && data.success) {
                        console.log('Сообщение отправлено:', messageText);
                    } else {
                        console.error('Ошибка отправки:', data?.error || 'Неизвестная ошибка');
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
                
                // Начинаем отслеживать
                this.startLongPolling()

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

                if (data.messages.length) {
                    let obj = {}
                    data.messages.forEach(item => {
                        obj[item.direction === 1 ? 'client' : 'manager'] = item.text
                        this.chat_start_phrases.push(obj)
                        obj = {}
                    })

                    this.lastMessageId = data.messages[data.messages.length - 1].id
                }

            } catch (error) {
                console.error('Start Dialog error:', error);
            }

            if (document.querySelectorAll('.blocking-dialog').length) {
                document.querySelectorAll('.blocking-dialog').forEach(item => item.remove())
            }
        },

        async endDialog () {

            this.stopLongPolling();
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

                // Нажатие по кнопке вызова чата

                if (e.target.closest('.dialog-chat-icon')) {
                    
                    if (document.querySelector('.monday-dialog').classList.contains('visible')) {
                        document.querySelector('.monday-dialog').classList.remove('visible')
                        e.target.closest('.dialog-chat-icon').classList.remove('show')
                        return false
                    }

                    document.querySelector('.monday-dialog').classList.add('visible')
                    e.target.closest('.dialog-chat-icon').classList.add('show')
                }

                // Закрытие сеанса чата

                if (e.target.classList.contains('finish-dialog')) {
                    e.preventDefault();
                    
                    this.endDialog (this.dialog_id).then(data => {

                        this.getParent(e.target, 'monday-dialog').querySelectorAll('.d-speech').forEach(item => item.remove())

                        this.chat_start_phrases = this.chat_start_phrases.slice(0, 2);

                        this.getParent(e.target, 'monday-dialog').querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', `
                            <div class = "dialog-end-w">
                                <img src = "${this.preloadImages[this.preloadImagesIndex]}" class = "dialog-end-pic">
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

                        this.startLongPolling();
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
                return userId;
            }

            // Если нет - генерируем новый
            try {
                userId = await this.getFingerPrint();
                this.user_id = userId;
                // Сохраняем в куки на 3 дня
                this.setCookie('user_id', userId, 3);
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

        stopLongPolling() {
            this.pollingActive = false;
            if (this.pollingTimer) {
                clearTimeout(this.pollingTimer);
                this.pollingTimer = null;
            }
        },
        
        // Улучшенный startLongPolling
        startLongPolling() {
            // 1. ОСТАНАВЛИВАЕМ предыдущий polling
            this.stopLongPolling();

            console.log('startLongPolling')
            
            // 2. Устанавливаем новый флаг
            this.pollingActive = true;
            
            // 3. Получаем актуальные значения
            const dialog_id = this.dialog_id;
            let lastMessageId = parseInt(this.getCookie('last_message_id')) || 0;

            // 4. Создаем рекурсивную функцию с проверкой актуальности
            const poll = () => {
                // Проверяем, не остановлен ли polling и актуален ли dialog_id
                if (!this.pollingActive || this.dialog_id !== dialog_id) {
                    return;
                }
                
                fetch('/poll_messages.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: this.user_id,
                        last_id: lastMessageId,
                        dialog_id: dialog_id // используем захваченное значение
                    })
                })
                .then(response => response.json())
                .then(data => {
                    // Проверяем, что polling все еще активен и dialog_id не изменился
                    if (!this.pollingActive || this.dialog_id !== dialog_id) {
                        return;
                    }
                    
                    if (data.messages && data.messages.length > 0) {
                        // Обновляем UI
                        data.messages.forEach(item => {
                            document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', 
                                item.direction == 1 ? this.clientSpeech(item.message) : this.managerSpeech(item.message)
                            );
                        });

                        // Скроллим вниз после добавления всех сообщений
                        document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;

                        // Обновляем lastMessageId
                        lastMessageId = data.messages[data.messages.length - 1].id;
                        this.setCookie('last_message_id', lastMessageId, 3);
                    }
                    
                    // Планируем следующий запрос, если polling активен
                    if (this.pollingActive && this.dialog_id === dialog_id) {
                        this.pollingTimer = setTimeout(poll, 1000);
                    }
                })
                .catch(error => {
                    console.error('Polling error:', error);
                    if (this.pollingActive && this.dialog_id === dialog_id) {
                        this.pollingTimer = setTimeout(poll, 5000);
                    }
                });
            };
            
            // Запускаем polling
            poll();
        },

        renderChat() {
            return `
                <div class = "dialog-chat-icon">
                    <div class = "icon icon-1"></div>
                    <div class = "icon icon-2"></div>
                    <div class = "icon icon-3"></div>
                </div>    
            <div class="monday-dialog">
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

        preloadImage (arr, index) {
            let img = new Image();
            img.src = arr[index];
        },

        async init() {
            try {

                // Проверка существования диалога
                
                this.dialog_id = this.getCookie('dialog_id') || 0
                this.dialog_in_proccess = this.getCookie('dialog_in_proccess') || 0

                // Инициализируем user_id

                await this.initUserId()

                // Проверяем наличие или продолжение диалога
                this.dialog_id && this.dialog_in_proccess ? await this.restoreDialog() : ''//await this.startDialog()

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

                
                // Прелоад картинки в конце чата
                this.preloadImage (this.preloadImages, this.preloadImagesIndex)

            } catch (error) {
                console.error('Ошибка инициализации чата:', error);
            }
        }
    };

    // Запускаем инициализацию
    Monday_talks_chat.init();

})();
import './assets/css/style.css'

;(function () {

    let Monday_talks_chat = {

        is_admin: true,
        managers_name: 'Вилора',
        clients_name: 'Клиент',
        managers_photo: 'femalemanager.jpg',
        client_photo: 'client.jpg',
        text: '',
        step: 0,
        pollingActive: false,
        user_id: 0,
        current_dialog_id: 0,
        current_fingerprint: '',
        messageCache: Object.create(null),
        pollingTimer: null,
        
        // Состояние текущего диалога
        current_dialog_state: [],

        preloadImages: [
            "../src/assets/images/end_chat/1.png",
            "../src/assets/images/end_chat/2.png",
            "../src/assets/images/end_chat/3.png",
            "../src/assets/images/end_chat/4.png",
            "../src/assets/images/end_chat/5.png",
            "../src/assets/images/end_chat/6.png",
            "../src/assets/images/end_chat/7.png"
        ],
        preloadImagesIndex: Math.floor(Math.random() * 7),

        // Загрузка истории конкретного диалога
        async loadDialogHistory(dialogId, fingerprint) {
            try {
                const response = await fetch('/get_dialog_history.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ dialog_id: dialogId, fingerprint })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    console.error('Ошибка загрузки истории:', data.error);
                    return [];
                }
                
                return data.messages || [];
                
            } catch (error) {
                console.error('Ошибка при загрузке истории:', error);
                return [];
            }
        },

        // Очистка текущего чата
        clearCurrentChat() {
            // Останавливаем polling
            this.stopLongPolling();
            
            // Очищаем состояние
            this.current_dialog_id = 0;
            this.current_fingerprint = '';
            this.current_dialog_state = [];
            this.lastMessageId = 0;
            
            // Очищаем DOM чата
            const chatContainer = document.querySelector('.monday-dialog .dialog-middle-w');
            if (chatContainer) {
                chatContainer.innerHTML = '';
            }
            
            // Убираем кнопку завершения диалога
            const finishBtn = document.querySelector('.finish-dialog');
            if (finishBtn) {
                finishBtn.remove();
            }
        },

        // Открытие диалога
        async openDialog(dialogId, fingerprint) {
            // Очищаем предыдущий чат
            this.clearCurrentChat();
            
            // Устанавливаем новый диалог
            this.current_dialog_id = dialogId;
            this.current_fingerprint = fingerprint;
            
            // Загружаем историю сообщений
            const messages = await this.loadDialogHistory(dialogId, fingerprint);
            
            // Формируем состояние диалога
            this.current_dialog_state = messages.map(msg => ({
                id: msg.id,
                message: msg.text,
                role: msg.direction === 1 ? 'client' : 'manager'
            }));
            
            // Рендерим сообщения
            this.renderCurrentDialogMessages();
            
            // Запускаем polling для этого диалога
            this.startLongPolling();
        },

        // Рендеринг сообщений текущего диалога
        renderCurrentDialogMessages() {
            const container = document.querySelector('.monday-dialog .dialog-middle-w');
            if (!container) return;
            
            container.innerHTML = this.current_dialog_state.map(msg => {
                return msg.role === 'manager' ? 
                    this.managerSpeech(msg.message) : 
                    this.clientSpeech(msg.message);
            }).join('');
            
            // Скролл вниз
            const scrollContainer = document.querySelector('.dialog-middle');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        },

        // Отправка сообщения
        async handleMessageSubmit(inputElement) {
            const messageText = inputElement.value.toString().trim();
            
            if (messageText === '' || !this.current_dialog_id) return false;
            
            inputElement.value = '';

            // Отправляем сообщение
            const result = await this.sendMessage(messageText, this.current_dialog_id, true);
            
            if (result && result.success) {
                // Добавляем сообщение в локальное состояние
                this.current_dialog_state.push({
                    id: 'new_' + Date.now(),
                    role: 'manager',
                    message: messageText
                });
                
                // Добавляем в DOM
                document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.managerSpeech(messageText));
                
                // Скролл вниз
                document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;
            }
            
            return true;
        },

        async sendMessage(message, dialog_id, is_admin) {
            try {
                const fingerprint = this.current_fingerprint;
                const direction = is_admin ? 2 : 1;
                
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
                        admin: is_admin ? 1 : 0
                    })
                });

                const data = await response.json();
                return data;

            } catch (error) {
                console.error('Send error:', error);
                return { success: false, error: error.message };
            }
        },

        // Polling для получения новых сообщений
        startLongPolling() {
            this.stopLongPolling();
            
            if (!this.current_dialog_id || !this.current_fingerprint) return;
            
            this.pollingActive = true;
            this.pollingDialogId = this.current_dialog_id;
            
            this.longPoll();
        },

        stopLongPolling() {
            this.pollingActive = false;
            if (this.pollingTimer) {
                clearTimeout(this.pollingTimer);
                this.pollingTimer = null;
            }
        },

        longPoll() {
            if (!this.pollingActive || this.current_dialog_id !== this.pollingDialogId) return;
            
            const xhr = new XMLHttpRequest();
            const self = this;
            const dialogId = this.pollingDialogId;
            const lastId = this.lastMessageId || 0;
            
            xhr.open('POST', '/poll_messages.php', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.timeout = 30000;
            
            xhr.onload = function() {
                if (!self.pollingActive || self.current_dialog_id !== dialogId) return;
                
                if (xhr.status === 200) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        
                        if (data.error) {
                            setTimeout(() => self.longPoll(), 5000);
                            return;
                        }
                        
                        if (data.messages && data.messages.length) {
                            self.processNewMessages(data.messages);
                        }
                        
                        self.longPoll();
                        
                    } catch (e) {
                        setTimeout(() => self.longPoll(), 1000);
                    }
                } else {
                    setTimeout(() => self.longPoll(), 5000);
                }
            };
            
            xhr.onerror = xhr.ontimeout = function() {
                if (self.pollingActive && self.current_dialog_id === dialogId) {
                    self.longPoll();
                }
            };
            
            xhr.send(JSON.stringify({
                user_id: this.user_id,
                dialog_id: dialogId,
                last_id: lastId
            }));
        },

        processNewMessages(messages) {
            if (!messages || !messages.length) return;
            
            const container = document.querySelector('.dialog-middle-w');
            const scrollContainer = document.querySelector('.dialog-middle');
            
            // Проверяем, что это сообщения для текущего диалога
            messages = messages.filter(msg => msg.dialog_id == this.current_dialog_id);
            
            if (!messages.length) return;
            
            // Собираем существующие ID
            const existingIds = new Set(
                this.current_dialog_state
                    .filter(msg => msg.id && msg.id !== 'new')
                    .map(msg => msg.id)
            );
            
            let lastId = this.lastMessageId || 0;
            let shouldScroll = false;
            
            // Обрабатываем новые сообщения
            messages.forEach(msg => {
                if (existingIds.has(msg.id)) return;
                
                if (msg.id > lastId) lastId = msg.id;
                
                // Добавляем в состояние
                this.current_dialog_state.push({
                    id: msg.id,
                    role: msg.direction === 2 ? 'manager' : 'client',
                    message: msg.message
                });
                
                // Проверяем, нужно ли рендерить (сообщения от клиента)
                if (msg.direction === 1) { // сообщение от клиента
                    if (container) {
                        container.insertAdjacentHTML('beforeend', this.clientSpeech(msg.message));
                        shouldScroll = true;
                    }
                }
            });
            
            // Обновляем lastMessageId
            if (lastId > (this.lastMessageId || 0)) {
                this.lastMessageId = lastId;
            }
            
            // Скролл вниз если были новые сообщения от клиента
            if (shouldScroll && scrollContainer) {
                requestAnimationFrame(() => {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight;
                });
            }
        },

        // Методы для работы с DOM
        attachEvents() {
            // Обработка кликов по элементам с data-dialog-id
            document.addEventListener('click', (e) => {
                const dialogItem = e.target.closest('[data-dialog-id]');
                if (dialogItem) {
                    e.preventDefault();
                    const dialogId = dialogItem.dataset.dialogId;
                    const fingerprint = dialogItem.dataset.fingerprint;
                    
                    if (dialogId && fingerprint) {
                        this.openDialog(dialogId, fingerprint);
                    } else if (dialogId) {
                        // Если fingerprint не указан, можно запросить его отдельно
                        console.warn('Fingerprint не указан для диалога', dialogId);
                    }
                }
            });

            // Отправка сообщения
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('message-send')) {
                    e.preventDefault();

                    const enterTextParent = e.target.closest('.enter-text');
                    const inputElement = enterTextParent ? enterTextParent.querySelector('.input-text') : null;

                    if (inputElement) {
                        this.handleMessageSubmit(inputElement);
                    }
                }
            });

            // Обработка формы
            const form = document.querySelector('.dialog-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const inputElement = form.querySelector('.input-text');
                    if (inputElement) {
                        this.handleMessageSubmit(inputElement);
                    }
                });
            }

            // Enter в поле ввода
            const inputElement = document.querySelector('.input-text');
            if (inputElement) {
                inputElement.addEventListener('keypress', (e) => {
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

        // Шаблоны сообщений
        managerSpeech(phrase) {
            return `<div class="d-speech d-question">
                <div class="d-speech-img" style="background-image: url('../src/assets/images/${this.managers_photo}');"></div>
                <div class="d-speech-text">${phrase}</div>
            </div>`;
        },

        clientSpeech(phrase) {
            return `<div class="d-speech d-answer">
                <div class="d-speech-img" style="background-image: url('../src/assets/images/${this.client_photo}');"></div>
                <div class="d-speech-text">${phrase}</div>
            </div>`;
        },

        // Рендеринг основного интерфейса
        async renderChat() {
            return `
            <div class="monday-dialog isadmin">
                <div class="dialog-top">
                    <div class="dialog-top__up">
                        <div class="manager-icon" style="background-image: url('../src/assets/images/${this.managers_photo}')"></div>
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
                    <div class="dialog-middle-w"></div>
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
                        </div>
                    </form>
                </div>
            </div>`;
        },

        // Инициализация
        async init() {
            try {
                if (!document.getElementById('app')) {
                    console.error('Элемент #app не найден');
                    return false;
                }

                // Рендерим чат
                document.querySelector('#app').innerHTML = await this.renderChat();
                
                // Вешаем события
                this.attachEvents();

                // Прелоад картинок
                this.preloadImage(this.preloadImages, this.preloadImagesIndex);

            } catch (error) {
                console.error('Ошибка инициализации чата:', error);
            }
        },

        preloadImage(arr, index) {
            let img = new Image();
            img.src = arr[index];
        }
    };

    // Запускаем инициализацию
    Monday_talks_chat.init();
})();
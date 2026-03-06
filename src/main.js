import '../assets/css/style.css'

;(function () {

    let Monday_talks_chat = {

        managers_name: 'Вилора',
        clients_name: 'Клиент',
        managers_photo: 'femalemanager.jpg',
        client_photo: 'femalemanager.jpg',
        text: '',
        step: 0,
        lastMessageId: 0,
        pollingActive: true,
        name_get_status: 'Готово',
        user_id: 0,
        chat_identifier: 0,

        chat_start_phrases: [
            { manager: 'Привет! Добро пожаловать!' },
            { manager: 'Чем могу помочь?' }
        ],

        attachEvents() {

            document.addEventListener('click', e => {

                // Отмена всего лишнего по клику вне
                if (!e.target.classList.contains('dialog-smiles') && !e.target.classList.contains('smile') && !e.target.classList.contains('smiles')) {
                    if (document.querySelector('.smiles')) {
                        document.querySelector('.smiles').remove()
                    }
                }

                // Вставка текста
                if (e.target.classList.contains('message-send')) {

                    this.text = e.target.parentElement.querySelector('.input-text').value

                    if (this.text != '') {

                        document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.clientSpeech(this.text))

                        document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;
                        e.target.parentElement.querySelector('.input-text').value = ''

                        // Отправляем сообщение
                        this.sendMessage(this.text).then(data => {
                            if (data && data.success) {
                                console.log('Сообщение отправлено: ' + this.text)
                            }
                        })
                    }
                }

                // Смайлы, появление выбора
                if (e.target.classList.contains('dialog-smiles')) {

                    let smiles = `
                        <div class="smiles">
                            <i class="smile">😀</i>
                            <i class="smile">🤣</i>
                            <i class="smile">😍</i>
                            <i class="smile">😭</i>
                            <i class="smile">😡</i>
                            <i class="smile">🤡</i>
                        </div>
                    `
                    e.target.insertAdjacentHTML('beforeend', smiles)
                }

                // Смайлы, выбор
                if (e.target.classList.contains('smile')) {

                    this.text = document.querySelector('.input-text').value + e.target.innerText
                    document.querySelector('.input-text').value = this.text

                    e.target.parentElement.remove()
                }
            })

            // Отправка сообщения по enter
            document.querySelector('.dialog-form').addEventListener('submit', e => {

                e.preventDefault();

                this.text = e.target.querySelector('.input-text').value

                if (this.text != '') {

                    document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.clientSpeech(this.text))

                    document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;
                    e.target.querySelector('.input-text').value = ''
                }
            })
        },

        async register(name, email) {
            try {
                const response = await fetch('/register_user.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email })
                })

                const data = await response.json()
                return data
            } catch (error) {
                console.error('Registration error:', error)
            }
        },

        // Метод для инициализации user_id
        async initUserId() {
            // Проверяем куки
            let userId = this.getCookie('user_id')
            
            if (userId) {
                // Если нашли в куки - используем
                this.user_id = userId
                console.log('Загружен user_id из куки:', userId)
                return userId
            } else {
                // Если нет - генерируем новый
                try {
                    userId = await this.getFingerPrint()
                    this.user_id = userId
                    // Сохраняем в куки на 365 дней
                    this.setCookie('user_id', userId, 365)
                    console.log('Сгенерирован новый user_id:', userId)
                    return userId
                } catch (error) {
                    console.error('Ошибка генерации fingerprint:', error)
                    // В случае ошибки генерируем простой ID
                    userId = 'guest_' + Math.random().toString(36).substr(2, 9)
                    this.user_id = userId
                    this.setCookie('user_id', userId, 365)
                    return userId
                }
            }
        },

        async sendMessage(message, isAdmin = false) {
            try {
                // Используем сохраненный user_id
                const fingerprint = this.user_id
                
                // Определяем direction: 1 - от клиента, 2 - от менеджера
                const direction = isAdmin ? 2 : 1
                
                const response = await fetch('/send_message.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fingerprint: fingerprint,
                        message: message,
                        direction: direction,
                        admin: isAdmin ? 1 : 0
                    })
                })

                const data = await response.json()
                return data
            } catch (error) {
                console.error('Send error:', error)
                return { success: false, error: error.message }
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
            ]
            
            const text = components.join('|||')
            return await this.sha256(text)
        },

        async sha256(str) {
            try {
                const buffer = new TextEncoder().encode(str)
                const hash = await crypto.subtle.digest('SHA-256', buffer)
                return Array.from(new Uint8Array(hash))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('')
            } catch (error) {
                console.error('SHA-256 error:', error)
                // Fallback на простой хеш
                return this.simpleHash(str)
            }
        },

        // Простой хеш для fallback
        simpleHash(str) {
            let hash = 0
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i)
                hash = ((hash << 5) - hash) + char
                hash = hash & hash
            }
            return Math.abs(hash).toString(16).padStart(8, '0') +
                   Math.abs(hash * 2).toString(16).padStart(8, '0')
        },

        startLongPolling() {
            let lastMessageId = 0

            const poll = () => {
                if (!this.pollingActive) return
                
                fetch(`/poll_messages.php?user_id=${this.user_id}&last_id=${lastMessageId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.messages && data.messages.length > 0) {
                            console.log('Новые сообщения:', data.messages)

                            data.messages.forEach(item => {
                                // Проверяем, что сообщение от админа (direction = 2)
                                if (item.direction == 2) {
                                    document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.clientSpeech(item.message))
                                    document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight
                                }
                            })

                            lastMessageId = data.messages[data.messages.length - 1].id
                        }
                        if (this.pollingActive) poll()
                    })
                    .catch(error => {
                        console.error('Polling error:', error)
                        if (this.pollingActive) setTimeout(poll, 5000)
                    })
            }

            poll()
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
                                return key === 'manager' ? this.managerSpeech(item[key]) : this.clientSpeech(item[key])
                            }).join('')
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
            </div>`
        },

        managerSpeech(phrase) {
            return `<div class="d-speech d-question">
                <div class="d-speech-img" style="background-image: url('./assets/images/${this.managers_photo}');"></div>
                <div class="d-speech-text">${phrase}</div>
            </div>`
        },

        clientSpeech(phrase) {
            return `<div class="d-speech d-answer">
                <div class="d-speech-img" style="background-image: url('./assets/images/${this.client_photo}');"></div>
                <div class="d-speech-text">${phrase}</div>
            </div>`
        },

        authorisedAnswer(name) {
            return this.managerSpeech(`Очень приятно ${name}! Сейчас я изучу ваш вопрос и позову менеджера. Он ответит на него!`)
        },

        setCookie(name, value, days) {
            const seconds = days * 24 * 60 * 60
            document.cookie = `${name}=${value}; path=/; max-age=${seconds}`
        },

        getCookie(name) {
            const value = document.cookie
                .split('; ')
                .find(row => row.startsWith(name + '='))
                ?.split('=')[1]
            
            return value || null
        },

        async init() {
            try {
                // Инициализируем user_id
                await this.initUserId()
                
                console.log('Чат инициализирован с user_id:', this.user_id)

                if (!document.getElementById('app')) {
                    console.error('Элемент #app не найден')
                    return false
                }

                // Рендерим чат
                document.querySelector('#app').innerHTML = this.renderChat()
                
                // Вешаем события
                this.attachEvents()
                
                // Запускаем long polling
                this.startLongPolling()
                
            } catch (error) {
                console.error('Ошибка инициализации чата:', error)
            }
        }
    }

    // Запускаем инициализацию
    Monday_talks_chat.init()

})()
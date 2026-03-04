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

          // Отмена всего лишнего по клику вне, конец

          // Вставка текста
          if (e.target.classList.contains('message-send')) {

            this.text = e.target.parentElement.querySelector('.input-text').value

            if (this.text != '') {

              document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.clientSpeech(this.text))

              if (!this.step) {
                this.step += 1
                document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.managerSpeech(this.getClientNameHtml()))
              }

              document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;
              e.target.parentElement.querySelector('.input-text').value = ''

              // Если авторизован, то запись в базу
              console.log(this.user_id)
              if (!this.user_id) return false

                this.sendMessage(this.text).then(data => {

                  if (data.success) {
                    console.log('сообщение записано ' + this.text)
                  }
                })

            }
          }

          // Вставка текста, конец


          // Смайлы, появление выбора

          if (e.target.classList.contains('dialog-smiles')) {

            let smiles = `
            <div class = "smiles">
              <i class = "smile">😀</i>
              <i class = "smile">🤣</i>
              <i class = "smile">😍</i>
              <i class = "smile">😭</i>
              <i class = "smile">😡</i>
              <i class = "smile">🤡</i>
            </div>
                  `
            e.target.insertAdjacentHTML('beforeend', smiles)
          }

          // Смайлы, появление выбора, конец

          // Смайлы, выбор

          if (e.target.classList.contains('smile')) {

            this.text = document.querySelector('.input-text').value + e.target.innerText
            document.querySelector('.input-text').value = this.text

            e.target.parentElement.remove()
          }
          // Смайлы, выбор, конец


          // Получение имени

          if (e.target.classList.contains('clients_name_btn')) {

            if (e.target.parentElement.querySelector('.clients_name').value !== '') {

              this.clients_name = e.target.parentElement.querySelector('.clients_name').value

              this.register(this.clients_name, 'test@mail.ru').then(data => {

                console.log(data);

                if (!data.success) {
                  e.target.innerText = 'Ошибка!'
                  return false
                }

                this.clients_name = data.name
                this.user_id = data.user_id
                this.chat_identifier = data.chat_identifier

                // Запись в куки
                if (!this.getCookie('chat_identifier')) {
                  this.setCookie('chat_identifier', data.chat_identifier, 3)
                }

                document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.authorisedAnswer(data.name))
                e.target.parentElement.querySelector('.clients_name').readOnly = true

                document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;

                // Начать отслеживать сообщения

                this.startLongPolling(this.user_id)

              })
                .catch((error) => {
                  console.error('Ошибка регистрации:', error);
                });

            }
          }

          // Получение имени, конец

        })


        // Отправка сообщения по enter

        document.querySelector('.dialog-form').addEventListener('submit', e => {

          e.preventDefault();

          this.text = e.target.querySelector('.input-text').value

          if (this.text != '') {

            document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.clientSpeech(this.text))

            if (!this.step) {
              this.step += 1
              document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.managerSpeech(this.getClientNameHtml()))
            }

            document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;
            e.target.parentElement.querySelector('.input-text').value = ''
          }
        });

        // Отправка сообщения по enter, конец


        // Запись в БД имени по enter

        /*document.querySelector('.get_user_name').addEventListener('submit', e => {

          e.preventDefault();

          this.text = e.target.querySelector('.input-text').value

          if (this.text != '') {

            document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.authorisedAnswer (name))

            document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;
            e.target.parentElement.querySelector('.clients_name').readOnly = true;
          }
        });*/

        // Запись в БД имени по enter, конец

      },

      async register(name, email) {
        try {
          const response = await fetch('/register_user.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email })
          });

          const data = await response.json();

          if (data.success) return data;

        } catch (error) {
          console.error('Registration error:', error);
        }
      },

      async sendMessage(message) {
        try {
          const response = await fetch('/send_message.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: this.user_id,
              message: message
            })
          });

          const data = await response.json();
          return data
        } catch (error) {
          console.error('Send error:', error);
        }
      },

      startLongPolling(user_id) {

        let lastMessageId = 0;

          // Функция, которая выполняет один цикл polling'а
          const poll = () => {
            fetch(`/poll_messages.php?user_id=${user_id}&last_id=${lastMessageId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.messages && data.messages.length > 0) {
                        // Показываем новые сообщения
                        console.log(data.messages);

                        data.messages.forEach(item => {
                            if (item.direction === 'admin_to_user') {

                              document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', this.clientSpeech(item.message))
                              document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;
                            }
                        })

                        // Обновляем last_id
                        lastMessageId = data.messages[data.messages.length - 1].id;
                    }
                    // Сразу же запускаем следующий poll
                    poll();
                })
                .catch(error => {
                    console.error('Polling error:', error);
                    // Если ошибка, пробуем переподключиться через 5 секунд
                    setTimeout(poll, 5000);
                });
          }
              
          // Запускаем первый poll
          poll();
      },

      async loadHistory() {
        try {
          const response = await fetch(`/get_history.php?user_id=${this.user_id}`);
          const messages = await response.json();
          messages.forEach(msg => {
            this.displayMessage(msg);
            this.lastMessageId = Math.max(this.lastMessageId, msg.id);
          });
        } catch (error) {
          console.error('History error:', error);
        }
      },

      displayMessage(message) {
        // Отображение сообщения в UI
        const chatContainer = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.direction}`;
        messageElement.innerHTML = `
            <div class="sender">${message.sender_name || 'User'}</div>
            <div class="content">${message.message}</div>
            <div class="time">${new Date(message.created_at).toLocaleTimeString()}</div>
              `;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      },


      renderChat() {

        return `<div class = "monday-dialog">
              <div class = "options-select">
                <div class = "message-bubble">
                  <ul class = "options-list">
                    <li class = "options-list-item">
                      <a class = "options-list-link">Позвать менеджера</a>
                    </li>
                    <li class = "options-list-item">
                      <a class = "options-list-link">Сменить имя</a>
                    </li>
                    <li class = "options-list-item">
                      <a class = "options-list-link">Написать в мессенджер</a>
                    </li>
                    <li class = "options-list-item">
                      <a class = "options-list-link">Написать на email</a>
                    </li>
                  </ul>
                </div>
              </div>
          <div class = "dialog-top">
            <div class = "dialog-top__up">
              <div class = "manager-icon" style = "background-image: url('./assets/images/femalemanager.jpg')"></div>
              <div class = "manager-info">
                <div class = "manager-job">Менеджер</div>
                <div class = "manager-name">${this.managers_name}</div>
              </div>
            </div>
            <div class = "dialog-top__down">
                <div class = "online-status on">Мы онлайн</div>
            </div>
            <svg viewBox="0 0 1440 40" preserveAspectRatio="none">
              <path d="M0,20 C200,45 400,-5 600,20 C800,40 1000,10 1440,20 L1440,40 L0,40 Z" fill="#fff"/>
            </svg>
          </div>
          <div class="dialog-middle">
            <div class="dialog-middle-w">
              ${this.chat_start_phrases.map(item => {
          return Object.keys(item).map(key => {
            return `${key === 'manager' ? this.managerSpeech(item[key], this.managers_photo) : this.clientSpeech(item[key], this.clients_photo)}`;
          }).join('');
        }).join('')}
            </div>
          </div>

          <div class = "dialog-bottom">
            <form action="" class = "dialog-form">
              <div class = "enter-text">
                  <input type="text" name = "input-text" class = "input-text" placeholder="Введите текст..." autofocus>
                  <button class = "message-send" type = "button"></button>
              </div>
              <div class = "enter-dop">
                <div class = "dialog-robot"></div>
                <div class = "dialog-smiles"></div>
                <div class = "dialog-file"></div>
              </div>
            </form>
          </div>
              </div>`
      },

      getClientNameHtml() {
        return `
          <form class = "get_user_name">
            <label>
              <span class = "clients_name_span">Как к вам можно обращаться?</span>
              <input name = "clients_name" class = "clients_name" type = "text">
              <button class = "clients_name_btn" type = "button">${this.name_get_status}</button>
            </label>
          </form>
          `
      },

      managerSpeech(phrase) {
        return `<div class="d-speech d-question">
                      <div class="d-speech-img" style="background-image: url('./assets/images/${this.managers_photo}');"></div>
                      <div class="d-speech-text">
                        ${phrase}
                      </div>
              </div>`
      },

      clientSpeech(phrase) {
        return `<div class="d-speech d-answer">
                      <div class="d-speech-img" style="background-image: url('./assets/images/${this.client_photo}');"></div>
                      <div class="d-speech-text">
                        ${phrase}
                      </div>
              </div>`
      },

      authorisedAnswer(name) {
        return this.managerSpeech(`Очень приятно ${name}! Сейчас я изучу ваш вопрос и позову менеджера. Он ответит на него!`)
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

      init() {

        if (!document.getElementById('app')) return false

        document.querySelector('#app').innerHTML = this.renderChat()
        this.attachEvents()
      },
    }




    Monday_talks_chat.init()


  })();

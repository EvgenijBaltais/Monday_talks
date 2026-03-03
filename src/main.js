import '../assets/css/style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

import { Header } from './components/Header.js'

;(function () {

let Monday_talks_chat = {

  name: 'Manager',
  text: '',
  chat_history: [
    {manager: 'Привет! Добро пожаловать!'},
    {manager: 'Обращайся за помощью!'},
    {manager: 'Воспользуйся скидкой!'}
  ],
  addText (text) {
    document.querySelector('.dialog-middle-w').insertAdjacentHTML('beforeend', `<div class = "d-speech d-answer">
                  <div class = "d-speech-img" style = "background-image: url('./assets/images/femalemanager.jpg');"></div>
                  <div class = "d-speech-text">${text}</div>
              </div>`)
  },

  addSmile () {

  },

  makeChoise () {
    
  },

  changeName () {

  },

renderChat () {

  //this.chat_history
      /*
              <div class = "d-speech d-question">
                  <div class = "d-speech-img" style = "background-image: url('./assets/images/femalemanager.jpg');"></div>
                  <div class = "d-speech-text">
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore fugiat tempora illo laboriosam ducimus, iste corrupti, vitae voluptatum dolore reprehenderit consequatur nemo suscipit nam sequi officiis repellendus vero rerum cupiditate.
                  </div>
              </div>
              <div class = "d-speech d-answer">
                  <div class = "d-speech-img" style = "background-image: url('./assets/images/femalemanager.jpg');"></div>
                  <div class = "d-speech-text">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore fugiat tempora il</div>
              </div>
*/


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
                <div class = "manager-name">Вилора</div>
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
              ${this.chat_history.map(item => {
                  return Object.keys(item).map(key => {
                      return `<div class="d-speech ${key === 'manager' ? 'd-question' : 'd-answer'}">
                          <div class="d-speech-img" style="background-image: url('./assets/images/femalemanager.jpg');"></div>
                          <div class="d-speech-text">
                            ${item[key]}
                          </div>
                      </div>`;
                  }).join('');
              }).join('')}
            </div>
          </div>
          
          <div class = "dialog-bottom">
            <form action="" class = "dialog-form">
              <div class = "enter-text">
                  <input type="text" name = "input-text" class = "input-text" placeholder="Введите текст...">
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
            this.addText (this.text)
            document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;
            e.target.parentElement.querySelector('.input-text').value = ''

            chat_history.push({client: this.text})
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
        
    })



    // Отмена отправки формы по enter

    document.querySelector('.dialog-form').addEventListener('submit', e => {

      e.preventDefault();

      this.text = e.target.querySelector('.input-text').value

      if (this.text != '') {
        this.addText (this.text)
        document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;
        e.target.parentElement.querySelector('.input-text').value = ''
      }
    });

  },

  init() {

    if (!document.getElementById('app')) return false
    
    document.querySelector('#app').innerHTML = this.renderChat()
    this.attachEvents()
  },
}

Monday_talks_chat.init()


})();
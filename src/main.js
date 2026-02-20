import '../assets/css/style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

import { Header } from './components/Header.js'

;(function () {

let Monday_talks_chat = {

  name: 'Manager',
  text: '',

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
          <div class = "dialog-middle">
            <div class = "dialog-middle-w">
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
            </div>
          </div>
          
          <div class = "dialog-bottom">
            <form action="">
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

      // Вставка текста
        if (e.target == document.querySelector('.message-send')) {

          this.text = e.target.parentElement.querySelector('.input-text').value

          this.text == '' ? '' : this.addText (this.text)

          document.querySelector('.dialog-middle').scrollTop = document.querySelector('.dialog-middle-w').scrollHeight;
          e.target.parentElement.querySelector('.input-text').value = ''
        }

        // Вставка текста
    })
  },

  init() {

    if (!document.getElementById('app')) return false
    
    document.querySelector('#app').innerHTML = this.renderChat()
    this.attachEvents()
  },
}

Monday_talks_chat.init()


})();
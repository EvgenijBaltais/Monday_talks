export function RenderChat () {

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
			return `${key === 'manager' ? this.managerSpeech (item[key], this.managers_photo) : this.clientSpeech (item[key], this.clients_photo)}`;
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
}
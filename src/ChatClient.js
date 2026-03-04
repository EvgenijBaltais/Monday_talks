// chat.js
export class ChatClient {
    constructor() {
        this.userId = null;
        this.lastMessageId = 0;
        this.pollingActive = true;
        this.init();
    }

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
            if (data.success) {
                this.userId = data.user_id;
                this.startPolling();
                this.loadHistory();
            }
        } catch (error) {
            console.error('Registration error:', error);
        }
    }

    async sendMessage(message) {
        try {
            const response = await fetch('/send_message.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    message: message
                })
            });
            
            const data = await response.json();
            if (data.success) {
                this.displayMessage(data.message);
            }
        } catch (error) {
            console.error('Send error:', error);
        }
    }

    startPolling() {
        const poll = async () => {
            while (this.pollingActive) {
                try {
                    const response = await fetch(
                        `/poll_messages.php?user_id=${this.userId}&last_id=${this.lastMessageId}`
                    );
                    
                    const data = await response.json();
                    
                    if (data.messages && data.messages.length > 0) {
                        data.messages.forEach(msg => {
                            this.displayMessage(msg);
                            this.lastMessageId = Math.max(this.lastMessageId, msg.id);
                        });
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                    // Пауза перед повторной попыткой
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        };
        
        poll();
    }

    async loadHistory() {
        try {
            const response = await fetch(`/get_history.php?user_id=${this.userId}`);
            const messages = await response.json();
            messages.forEach(msg => {
                this.displayMessage(msg);
                this.lastMessageId = Math.max(this.lastMessageId, msg.id);
            });
        } catch (error) {
            console.error('History error:', error);
        }
    }

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
    }
}
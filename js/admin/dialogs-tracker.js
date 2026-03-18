// js/dialogs-tracker.js
class DialogsTracker {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || '/api/dialogs.php';
        this.pollingInterval = options.pollingInterval || 3000;
        this.onUpdate = options.onUpdate || null;
        
        this.openedDialogs = [];
        this.closedDialogs = [];
        this.isPolling = false;
        this.pollingTimer = null;
    }
    
    start() {
        if (this.isPolling) return;
        this.isPolling = true;
        this.poll();
    }
    
    stop() {
        this.isPolling = false;
        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }
    }
    
    async poll() {
        if (!this.isPolling) return;
        
        try {
            await this.fetchDialogs();
        } catch (error) {
            console.error('Polling error:', error);
        }
        
        if (this.isPolling) {
            this.pollingTimer = setTimeout(() => this.poll(), this.pollingInterval);
        }
    }
    
    async fetchDialogs() {
        const response = await fetch(this.apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        this.openedDialogs = data.opened_dialogs || [];
        this.closedDialogs = data.closed_dialogs || [];
        
        if (this.onUpdate) {
            this.onUpdate({
                openedDialogs: this.openedDialogs,
                closedDialogs: this.closedDialogs
            });
        }
        
        return data;
    }
}

// Для использования в браузере
if (typeof window !== 'undefined') {
    window.DialogsTracker = DialogsTracker;
}

// Для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DialogsTracker;
}








// js/main.js
const tracker = new DialogsTracker({
    apiUrl: '/api/dialogs.php',
    pollingInterval: 3000,
    onUpdate: (data) => {
        console.log('Opened dialogs:', data.openedDialogs);
        console.log('Closed dialogs:', data.closedDialogs);
        
        // Здесь вы можете обновлять ваш интерфейс
        // Например:
        // updateOpenedList(data.openedDialogs);
        // updateClosedList(data.closedDialogs);
    }
});

// Запуск трекера
tracker.start();

// При необходимости остановить:
// tracker.stop();
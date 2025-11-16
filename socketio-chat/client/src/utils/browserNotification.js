
function showBrowserNotification(message) {
    if (Notification.permission === 'granted' && !document.hasFocus()) {
        const notification = new Notification(
            `New message in ${message.roomId}`, // Adjust to include room name if possible
            {
                body: `${message.senderUsername}: ${message.content}`,
               
            }
        );
        
        // Focus the tab when notification is clicked
        notification.onclick = function() {
            window.focus();
            this.close();
        };
    }
}

export default showBrowserNotification;
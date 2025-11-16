
const notificationSound = new Audio('/notification.wav');
const playNotification = () => {
    notificationSound.cloneNode(true).play().catch((e) => {
        console.error("Notification sound play error:", e);
    });
}

export default playNotification;
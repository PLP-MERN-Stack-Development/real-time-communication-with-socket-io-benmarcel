import io from 'socket.io-client';
const SOCKET_URL = 'http://localhost:5000';
const createSocketConnection = (token) => {
  // In a real app, you'd use socket.io-client here
  return io(SOCKET_URL, { auth: { token } });
  
//   return {
//     on: (event, handler) => console.log('Listening to:', event),
//     emit: (event, data, callback) => {
//       console.log('Emitting:', event, data);
//       if (callback) callback({ success: true });
//     },
//     disconnect: () => console.log('Disconnected'),
//   };
};

export default createSocketConnection;  
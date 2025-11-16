import {useState} from 'react'
// import api from "../../api/config"

const CreateRoom = ({showCreateRoom, handleCreateRoom}) => {
  const [roomName, setRoomName] = useState('')
  

  const onSubmit = async (e) => {
    try {
      e.preventDefault();
      await handleCreateRoom(roomName, []);
      setRoomName('');
    } catch (error) {
      console.error("Error creating room:", error);
    }
  }

  return (
    <div style={{ display: showCreateRoom ? 'block' : 'none' }} className=' w-full h-full bg-grey-600 bg-opacity-10 flex items-center justify-center z-50'>
    <form onSubmit={onSubmit} className='bg-white p-6 rounded shadow-md flex flex-col gap-4 self-center relative'>
        <h2 className='text-xl font-bold'>Create New Room</h2>
        <label>Room Name:</label>
      <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        className='border border-gray-300 p-2 rounded'
      />
        <button type="submit" className='bg-blue-500 text-white p-2 rounded'>Create Room</button>
    </form>
    </div>
  )
}

export default CreateRoom   

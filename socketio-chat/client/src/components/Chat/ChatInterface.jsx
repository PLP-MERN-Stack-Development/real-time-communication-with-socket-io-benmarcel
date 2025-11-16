import { useState, useRef, useEffect } from "react";
import useAuthContext from "../../context/useAuthContext";
import createSocketConnection from "../../utils/socket";
import api from "../../api/config"; // Assumed to handle headers/tokens
import SideBar from "../shared/SideBar";
import Message from "./Message";
import { X, Users, Plus, Send, MessageSquare } from "lucide-react";
import CreateRoom from "./CreateRoom";
import showBrowserNotification from "../../utils/browserNotification";
import playNotification from "../../utils/playNotification";
// Chat Interface Component
const ChatInterface = () => {
  const { user, token, logout } = useAuthContext();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]); // List of online user IDs
  const [typingUsers, setTypingUsers] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // Create a new ref for the active room
  const activeRoomRef = useRef(activeRoom);

  // Effect to keep the ref up-to-date
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Change the function signature to accept the ref
  const setupSocketListeners = (activeRoomRef) => {
    const socket = socketRef.current;

    // --- Message and Room Core Events ---

    socket.on("room-joined", (data) => {
      // Data contains the message history from the server
      setMessages(data.messages);
    });

    socket.on("new-room-message", (message) => {
      //Use the ref to check the current active room state
      if (
        !activeRoomRef.current ||
        message.roomId !== activeRoomRef.current._id
      ) {
        socket.emit("mark-message-read", {
          messageId: message._id,
          roomId: message.roomId,
          isPrivate: false,
        });
      } else {
        // Show browser notification for messages in other rooms
        showBrowserNotification(message);
        playNotification();
      }
      // Additional check to update badge count for inactive rooms
      if (
        !activeRoomRef.current ||
        message.roomId !== activeRoomRef.current._id
      ) {
        // Increment badge for inactive room
        setRooms((prevRooms) =>
          prevRooms.map((r) =>
            r._id === message.roomId
              ? { ...r, messageCount: (r.messageCount || 0) + 1 }
              : r
          )
        );
      }
      setMessages((prev) => [...prev, message]);
    });

    socket.on("message-deleted", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId
            ? { ...m, deletedAt: true, content: "[Message deleted]" }
            : m
        )
      );
    });

    // --- Typing Indicator Events ---

    socket.on("user-typing", (data) => {
      // Use the ref for the current room ID check
      if (activeRoomRef.current?._id === data.roomId) {
        setTypingUsers((prev) => [...new Set([...prev, data.username])]);
      }
    });

    socket.on("user-stop-typing", (data) => {
      // Use the ref for the current room ID check
      if (activeRoomRef.current?._id === data.roomId) {
        setTypingUsers((prev) => prev.filter((u) => u !== data.username));
      }
    });

    // --- Presence Events ---

    socket.on("user-online", (data) => {
      setOnlineUsers((prev) => [...new Set([...prev, data.userId])]);
    });

    socket.on("user-offline", (data) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    // --- Room Change Handlers ---

    socket.on("user-joined-room", (data) => {
      // Use the ref for the current room ID check
      if (activeRoomRef.current?._id === data.roomId) {
        // Use functional state update for setActiveRoom
        setActiveRoom((prev) => {
          // Check if prev (the activeRoom object) is null or undefined before proceeding
          if (!prev) return prev;

          // Get existing member IDs, handling both object format and string format
          const existingMemberIds = (prev.members || []).map((m) => {
            // Check if 'm' is an object with an '_id', otherwise assume it's the ID string itself
            return typeof m === "object" && m !== null ? m._id : m;
          });

          // Create a unique set of IDs, including the new user ID
          const newMembersSet = new Set([...existingMemberIds, data.userId]);

          return {
            ...prev,
            // Return an array of unique string IDs
            members: Array.from(newMembersSet),
          };
        });

        // Add a system message indicating the user has joined
        const systemMessage = {
          _id: Date.now() + "_join", // Unique ID
          content: `${data.username} has joined the room.`,
          isSystem: true, // Flag for styling
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      }
    });

    socket.on("user-left-room", (data) => {
      // Use the ref for the current room ID check
      if (activeRoomRef.current?._id === data.roomId) {
        // Remove user from active room's member list
        // Use functional state update for setActiveRoom
        setActiveRoom((prev) => {
          // Check if prev (the activeRoom object) is null or undefined before proceeding
          if (!prev) return prev;

          // Get existing member IDs, handling both object format and string format
          const existingMemberIds = (prev.members || []).map((m) => {
            // Check if 'm' is an object with an '_id', otherwise assume it's the ID string itself
            return typeof m === "object" && m !== null ? m._id : m;
          });

          const updatedMembers = existingMemberIds.filter(
            (memberId) => memberId.toString() !== data.userId.toString()
          );

          return {
            ...prev,
            // Return an array of unique string IDs
            members: Array.from(updatedMembers),
          };
        });
        // Add a system message indicating the user has left
        const systemMessage = {
          _id: Date.now() + "_left", // Unique ID
          content: `${data.username} has left the room.`,
          isSystem: true, // Flag for styling
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      }
    });

    // --- Reaction and Read Receipt Handlers ---

    socket.on("reaction-added", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId
            ? {
                ...m,
                reactions: [
                  ...(m.reactions || []),
                  {
                    userId: data.userId,
                    username: data.username,
                    emoji: data.emoji,
                  },
                ],
              }
            : m
        )
      );
    });

    socket.on("room-count-updated", (data) => {
      setRooms((prevRooms) =>
        prevRooms.map((r) =>
          r._id === data.roomId ? { ...r, messageCount: data.newCount } : r
        )
      );
    });

    socket.on("message-read", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId
            ? {
                ...m,
                readBy: [
                  ...new Set([
                    ...(m.readBy || []).map((id) => id.toString()),
                    data.userId,
                  ]),
                ],
                read: data.allRead || m.read,
              }
            : m
        )
      );
    });
  };

  // --- Data Fetching and Room Management ---

  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms");
      if (response.status === 200 && response.data) {
        const roomsData = response.data.rooms;
        setRooms(roomsData); // Update full list first

        // Find and join global room only if no room is currently active
        if (!activeRoom) {
          const globalRoom = roomsData.find((room) => room.isGlobal);
          if (globalRoom) {
            joinRoom(globalRoom);
          }
        }
        return response.data.rooms;
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const response = await api.get("/users/online");
      if (response.status === 200 && response.data) {
        setOnlineUsers(response.data.onlineUsers || []);
      }
    } catch (error) {
      console.error("Failed to fetch online users:", error);
    }
  };

  const joinRoom = (room) => {
    // Leave previous room if one was active
    if (activeRoom) {
      socketRef.current.emit("leave-room", { roomId: activeRoom._id });
    }

    // Set new active room and clear typing indicators
    setActiveRoom(room);
    setMessages([]);
    setTypingUsers([]);

    // Join the new room
    socketRef.current.emit("join-room", { roomId: room._id });
  };

  const sendMessage = () => {
    if (messageInput.trim() && activeRoom) {
      // Manually trigger stop-typing before sending message
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        socketRef.current.emit("stop-typing", { roomId: activeRoom._id });
        typingTimeoutRef.current = null;
      }

      socketRef.current.emit(
        "send-message",
        {
          content: messageInput,
          roomId: activeRoom._id,
          isPrivate: false,
        },
        (response) => {
          console.log("Message sent successfully");
          console.log("Server response:", response);
          if (response.success) {
            setMessageInput("");
          }
        }
      );
    }
  };
  // handle create room
  const handleCreateRoom = async (roomName, memberIds) => {
    try {
      const response = await api.post("/rooms", {
        name: roomName,
        members: memberIds,
      });
      console.log("Room created successfully:", response.data);
      // Optionally, you can update the UI or state to reflect the new room
      setRooms((prevRooms) => [...prevRooms, response.data.room]);
      // close the create room modal
      setShowCreateRoom(false);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleTyping = () => {
    if (activeRoom) {
      socketRef.current.emit("typing", { roomId: activeRoom._id });

      // Clear the previous timeout if the user is still typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set a new timeout to send 'stop-typing' after 1 second
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("stop-typing", { roomId: activeRoom._id });
        typingTimeoutRef.current = null; // Clear ref after sending event
      }, 1000);
    }
  };

  const deleteMessage = (messageId) => {
    if (activeRoom) {
      // Server will handle auth check and broadcast the 'message-deleted' event
      socketRef.current.emit("delete-message", {
        messageId,
        roomId: activeRoom._id,
        isPrivate: false,
      });
    }
  };

  const reactToMessage = (messageId, emoji) => {
    if (activeRoom) {
      // Server will handle toggling the reaction and broadcast 'reaction-added'
      socketRef.current.emit("add-reaction", {
        messageId,
        emoji,
        roomId: activeRoom._id,
        isPrivate: false,
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  //  request notification permission on mount
  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };
  // --- Effects ---

  useEffect(() => {
    if (!token) return;

    socketRef.current = createSocketConnection(token);

    // The setup function must be called *after* socketRef.current is set
    setupSocketListeners(activeRoomRef);

    // Call this once on load:
    requestNotificationPermission();
    // Mark as mounted
    let mounted = true;

    const loadInitialData = async () => {
      try {
        const rooms = await fetchRooms();
        const onlineUsers = await fetchOnlineUsers();

        if (!mounted) return; // <-- use the flag to avoid updating state after unmount

        if (rooms) {
          setRooms(rooms);
        }

        if (onlineUsers) {
          setOnlineUsers(onlineUsers);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  useEffect(() => {
    scrollToBottom();
    // Mark all unread messages as read when the message list updates
    if (activeRoom && messages.length > 0) {
      messages.forEach((message) => {
        // Check if user has not read the message and it's not their own
        const userRead = message.readBy && message.readBy.includes(user?.id);
        if (!userRead && message.senderId !== user?.id) {
          socketRef.current.emit("mark-message-read", {
            messageId: message._id,
            roomId: activeRoom._id,
            isPrivate: false,
          });
        }
      });
    }
  }, [messages, activeRoom, user?.id]); // Dependency on activeRoom/user ensures re-check when room switches

  // --- Render ---

  // Derived state for typing indicator check
  const isUserTyping = typingUsers.length > 0;

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <SideBar user={user} logout={logout} />
        {/* Room List Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Rooms
          </h2>
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="text-blue-500 hover:text-blue-600"
          >
            {showCreateRoom ? (
              <X className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
        {/* create room modal */}
        <CreateRoom
          showCreateRoom={showCreateRoom}
          handleCreateRoom={handleCreateRoom}
        />
        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => {
            if (!room || !room._id) {
              return null; // Skip rendering this invalid item
            }

            return (
              <button
                key={room._id}
                onClick={() => joinRoom(room)}
                className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                  activeRoom?._id === room._id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{room.name}</h3>
                    <p className="text-sm text-gray-500">
                      {room.members?.length || 0} members
                    </p>
                  </div>
                  {/* Ensure messageCount is the actual UNREAD count */}
                  {room.messageCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {room.messageCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <h2 className="font-semibold text-gray-800 text-lg">
                {activeRoom.name}
              </h2>
              <p className="text-sm text-gray-500">
                {activeRoom.members?.length || 0} members
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map((message) => {
                const senderId = message.sender?._id || message.sender;

                // Safely get the current user's ID.
                const currentUserId = user?.id || user?._id;

                return (
                  <Message
                    key={message._id}
                    message={message}
                    isOwnMessage={
                      senderId &&
                      currentUserId &&
                      senderId.toString() === currentUserId.toString()
                    }
                    onDelete={deleteMessage}
                    onReact={reactToMessage}
                  />
                );
              })}
              {/* Use derived state (typingUsers.length) */}
              {isUserTyping && (
                <div className="text-sm text-gray-500 italic">
                  {typingUsers.join(", ")}{" "}
                  {typingUsers.length === 1 ? "is" : "are"} typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">Select a room to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;

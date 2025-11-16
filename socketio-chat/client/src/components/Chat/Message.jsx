import { useState } from "react";
import { CheckCheck, Check, Smile, Trash2 } from "lucide-react";

const Message = ({ message, isOwnMessage, onDelete, onReact }) => {
  const [showReactions, setShowReactions] = useState(false);
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '👏'];

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <div className="text-xs text-gray-500 mb-1">{message.senderUsername}</div>
        )}
        <div
          className={`relative px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          <p className="wrap-break">{message.content}</p>
          
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {message.reactions.map((reaction, idx) => (
                <span key={idx} className="text-sm bg-white bg-opacity-20 px-1 rounded">
                  {reaction.emoji}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs opacity-75">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            
            {isOwnMessage && message.readBy && (
              <span className="ml-2">
                {message.readBy.length > 1 ? (
                  <CheckCheck className="w-3 h-3" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>

          <div className="absolute -bottom-6 right-0 flex gap-1">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="text-gray-600 hover:text-gray-800 p-1"
            >
              <Smile className="w-4 h-4" />
            </button>
            {isOwnMessage && (
              <button
                onClick={() => onDelete(message._id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {showReactions && (
            <div className="absolute -bottom-10 right-0 bg-white shadow-lg rounded-lg p-2 flex gap-1 z-10">
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(message._id, emoji);
                    setShowReactions(false);
                  }}
                  className="hover:bg-gray-100 p-1 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
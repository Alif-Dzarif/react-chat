import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import Swal from 'sweetalert2'

const socket = io.connect("http://`192.168.1.16:3000")

export default function App() {
  const [message, setMessage] = useState("")
  const [messageReceived, setMessageReceived] = useState([])
  const [room, setRoom] = useState("")
  const [sender, setSender] = useState(localStorage.username)
  const [username, setUsername] = useState("")

  const joinRoom = () => {
    socket.emit("join_room", room)
  }

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.length > 0) {
      setMessageReceived([...messageReceived, { message: message, sender: localStorage?.username }])
      socket.emit("send_message", { message, room, sender: localStorage.username })
      document.getElementById("message").value = ""
      setMessage("")
    }
  }

  useEffect(() => {
    const messageListener = (data) => {
      setMessageReceived((prevMessages) => [...prevMessages, data]);
    };

    socket.on("recent_message", (data) => {
      if (data.length > 0) {
        setMessageReceived(data)
      } else {
        setMessageReceived([])
      }
    });
    socket.on("received_message", messageListener);

    return () => {
      socket.off("received_message", messageListener);
      socket.off("recent_message");
    };
  }, [socket]);

  useEffect(() => {
    if (!localStorage.username) {
      Swal.fire({
        title: "Your Username",
        input: "text",
        inputAttributes: {
          autocapitalize: "off"
        },
        confirmButtonText: "start chat",
      }).then((result) => {
        setUsername(result.value)
      })
    }
  }, []);

  useEffect(() => {
    const chatBody = document.getElementById("chat-body")
    chatBody.scrollTop = chatBody.scrollHeight + 40
  }, [messageReceived])

  useEffect(() => {
    localStorage.username = username
  }, [username])


  return (
    <div className='max-w-8/12 p-10'>
      <div className='flex justify-end'>
        <span className='bg-green-300 py-2 px-6 rounded-s-2xl'>{username}</span>
      </div>
      <div className='p-10 flex flex-col justify-center items-center gap-5 border my-5'>
        <div className='h-96 w-full overflow-y-scroll chat-body' id='chat-body'>
          <div className='mb-10 h-auto px-4'>
            {messageReceived.map((data, idx) => {
              const prevMessage = messageReceived[idx - 1];
              const isDifferentSender = !prevMessage || prevMessage.sender !== data.sender;
              const isCurrentUser = data.sender === username;

              return (
                <div key={idx} className={`my-5 ${isCurrentUser ? "text-right" : "text-left"}`}>
                  {isDifferentSender && !isCurrentUser && <div className='mb-2 text-sm text-gray-400'>from {data?.sender}</div>}
                  <span className={`w-auto h-auto text-white py-2 px-3 ${isCurrentUser ? "bg-green-500" : "bg-blue-500"} rounded-md`}>{data.message}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className='flex gap-3 w-full'>
          <input name='message' onChange={(e) => {
            setRoom(e.target.value);
          }} className='border p-2 focus:outline-none w-full' type="text" placeholder='Join Room...' />
          <button onClick={joinRoom} className='p-2 bg-blue-400 text-white active:bg-blue-500 min-w-32'>Join Room</button>
        </div>
        <div className='flex gap-3 w-full'>
          <input
            name='message'
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            className='border p-2 focus:outline-none w-full'
            type="text"
            placeholder='Message...'
            id='message'
          />
          <button onClick={sendMessage} className='p-2 bg-green-400 text-white active:bg-green-500 min-w-32'>Send Message</button>
        </div>
      </div>
    </div>
  )
}

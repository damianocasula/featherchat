// Imports
const path = require('path')
const express = require('express')
const app = express()

// Attributes and constants
const port = 3552
let onlineUsers = {}

// Express setup
app.use(express.static(path.join(__dirname, '/public')))
const server = app.listen(port, () => console.log(`INFO: Server online on port ${port}.`))

// Home route
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/chat.html')))

// Socket.io setup
const io = require('socket.io')(server)

// Socket.io logic
io.on('connection', socket => {
  console.log('INFO: A user connected to the chat.')

  // A user logs into the chat
  socket.on('ACCESS', username => {
    // Accept only alphanumeric characters a-z, A-Z, 0-9
    const regex = /[^\w]|_/g

    // Checks username
    if (username.length <= 0 || regex.test(username)) {
      // Username empty or containing non-alphanumeric characters
      io.emit('INVALID_USERNAME')
    } else if (Object.values(onlineUsers).indexOf(username) > -1) {
      // Username already used among online users
      io.emit('USERNAME_IN_USE')
    } else {
      // Successful access
      onlineUsers[socket.id] = username
      io.emit('SUCCESSFUL_ACCESS')

      // Updating the list of online users
      io.emit('UPDATE_ONLINE_USERS', onlineUsers)
    }
  })

  // Relay message received by a user to all users
  socket.on('SEND_MESSAGE', msg => io.emit('NEW_MESSAGE', { username: onlineUsers[socket.id], msg }))

  // 'user is writing' logic
  socket.on('WRITING', username => socket.broadcast.emit('WRITING', username))

  // User logs out
  socket.on('disconnect', () => {
    delete onlineUsers[socket.id]

    // Updating the list of online users
    io.emit('UPDATE_ONLINE_USERS', onlineUsers)

    console.log('INFO: A user has logged out of the chat.')
  })
})

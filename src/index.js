// // process.loadEnvFile();
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from 'socket.io';
import BadWordsFilter from 'bad-words';
import { generateLocationMessage, generateMessage } from './utils/messages.js';
import { addUser, removeUser, getUser, getUsersInRoom } from './utils/users.js';
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

//! Won't work
// app.get('/', (req, res) => {
//    res.sendFile(join(__dirname, '../public/index.html'));
// });
// app.get('/', express.static(join(__dirname, `../public`)));

app.use(express.static(join(__dirname, `../public`)));

io.on('connection', (socket) => {
   console.log('A user connected');

   //* Broadcast: Everytime a new user joins the chat room
   // socket.broadcast.emit('newConnection', 'New User joined chat room!');

   //* Send message ONLY to the newly joined user
   // socket.emit('message', generateMessage("Welcome User!"));

   socket.on('sendMessage', (data, callback) => {
      const filter = new BadWordsFilter();

      if (filter.isProfane(data)) {
         return callback({
            err: 'Foul Language'
         })
      }

      const { err, user: userRoom } = getUser(socket.id);
      if (err) {
         return callback({ err });
      }

      const { room, username } = userRoom;

      console.log(`Message from client: ${data}`);
      io.to(room).emit('message', generateMessage(username, data));

      callback({
         status: 'ok'
      })
   })

   socket.on('sendLocation', (location, callback) => {
      if (!location) {
         return callback({
            err: `No location received`
         })
      }

      const { err, user: userRoom } = getUser(socket.id);
      if (err) {
         return callback({ err });
      }

      const { room, username } = userRoom;

      const { lat, long } = JSON.parse(location);
      const url = `https://google.com/maps?q=${lat || null},${long || null}`;

      console.log(`Location received from client`);

      //* Should go to the current user as well
      // socket.broadcast.to(room).emit('clientLocation', generateLocationMessage(url));
      io.to(room).emit('clientLocation', generateLocationMessage(username, url));

      callback({
         status: 'ok'
      })
   });

   socket.on('join', (options, callback) => {

      const { err, user } = addUser({
         id: socket.id,
         username: options.username || '',
         room: options.room || ''
      });

      if (err) {
         return callback({ err });
      }

      const { username, room } = user;

      socket.join(room);
      console.log(`username: ${username} joined room ${room}`);

      //* Send message ONLY to the newly joined user
      socket.emit('message', generateMessage('system-bot', "Welcome User!"));

      //* Emits event to everybody in a SPECIFIC ROOM - except that new user
      socket.broadcast.to(room).emit('message', generateMessage('system-bot', `username: ${username} joined`));

      // Send updated list to client side
      io.to(room).emit('roomData', {
         room,
         users: getUsersInRoom(room)
      });

      callback({
         status: 'ok'
      });
   });

   socket.on('disconnect', () => {
      const { err, user } = removeUser(socket.id);

      if (err) {
         return console.error(err);
      }

      const { username, room } = user;

      //Everytime a user leaves the chat room
      io.to(room).emit('message', generateMessage('system-bot', `username: ${username} left the room`));
      console.log('user disconnected');

      // io.emit('dropConnection', 'A User left chat room!');
      // io.emit('message', generateMessage('A User left chat room!'));

      // Send updated list to client side
      io.to(room).emit('roomData', {
         room,
         users: getUsersInRoom(room)
      });
   });
});

server.listen(process.env.PORT, () => {
   console.log('server running at http://localhost:3000');
});



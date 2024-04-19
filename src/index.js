// // process.loadEnvFile();
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from 'socket.io';
import BadWordsFilter from 'bad-words';
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
   socket.broadcast.emit('newConnection', 'New User joined chat room!');

   //* Send message ONLY to the newly joined user
   socket.emit('message', "Welcome User!");

   socket.on('sendMessage', (data, callback) => {
      const filter = new BadWordsFilter();

      if (filter.isProfane(data)) {
         return callback({
            err: 'Foul Language'
         })
      }

      console.log(`Message from client: ${data}`);
      io.emit('messageReceived', data);
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

      const { lat, long } = JSON.parse(location);
      // const url = `https://google.com/maps?q=${lat ? Number(lat).toFixed(5) : null},${long ? Number(long).toFixed(5) : null}`

      const url = `https://google.com/maps?q=${lat || null},${long || null}`
      console.log(`Location received from client`);
      socket.broadcast.emit('clientLocation', url);
      callback({
         status: 'ok'
      })
   })

   socket.on('disconnect', () => {
      console.log('user disconnected');
      //Everytime a user leaves the chat room
      io.emit('dropConnection', 'A User left chat room!');
   });
});

server.listen(process.env.PORT, () => {
   console.log('server running at http://localhost:3000');
});



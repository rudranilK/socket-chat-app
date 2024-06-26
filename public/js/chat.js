const socket = io();

//* Elements
const $messageForm = document.getElementById("message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.getElementById('send-location');
const $messages = document.querySelector('#messages');

//* Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//* Options
const { username, room } = extractQS(location.search);
// const { username, room } = qs.parse(location.search, { ignoreQueryPrefix: true })

//* Incoming Messages
socket.on("message", (data) => {
   console.info("Server sent : ", data);

   const { username, text: message, createdAt } = data;

   //Render the message on html every time server sends it
   const html = Mustache.render(messageTemplate, {
      username,
      message,
      createdAt: moment(createdAt).format('h:mm a')
   });
   $messages.insertAdjacentHTML('beforeend', html);
});

//* Incoming Geo-location messages
socket.on('clientLocation', (data) => {
   console.info(`New client joined from: ${data.url}`);

   const { username, url, createdAt } = data;

   //Render the message on html every time server sends it
   const html = Mustache.render(locationTemplate, {
      username,
      url,
      createdAt: moment(createdAt).format('h:mm a')
   });
   $messages.insertAdjacentHTML('beforeend', html);

   //* `https://google.com/maps?q=${lat},${long}`
});

//* Incoming updated room list
socket.on('roomData', (data) => {
   const { room, users } = data;

   const html = Mustache.render(sidebarTemplate, {
      room,
      users
   });
   document.querySelector('#sidebar').innerHTML = html;
})

//* When a new user joins
socket.emit('join', { username, room }, ({ err, status }) => {
   if (err) {
      alert(err);
      location.href = '/';    // Re-route to index.html
      console.error(err);
   } else {
      console.info(`status, ${status}`)
   }
});

// Add event listener to the send button
$messageForm.addEventListener("submit", (event) => {
   event.preventDefault(); // Prevent form submission

   //Disable button click
   $messageFormButton.setAttribute('disabled', 'disabled');

   //* Get the input value
   // const inputMessage = document.getElementById("message").value;
   const inputElement = event.target.elements['message'];

   // Do something with the input value, such as sending it elsewhere
   if (inputElement.value) {
      socket.emit('sendMessage', inputElement.value, ({ err, status }) => {   //* Acknowledgement

         //Enable button click
         $messageFormButton.removeAttribute('disabled');
         // Clear the input field after processing
         $messageFormInput.value = '';
         $messageFormInput.focus();

         if (err) {
            if (err.contains('Foul')) alert(err);
            console.error(err);
         } else {
            console.info(`status, ${status}`)
         }
      });
   }
});

//* Geo-location
$locationButton.addEventListener("click", () => {

   if (!navigator.geolocation) {
      return alert('Geolocation is not supported by your browser');
   }

   //Disable button click
   $locationButton.setAttribute('disabled', 'disabled');

   //Async function - using callbacks
   navigator.geolocation.getCurrentPosition((position) => {
      const { coords } = position;
      if (coords) {
         socket.emit('sendLocation', JSON.stringify({
            lat: coords.latitude || null,
            long: coords.longitude || null,
         }), ({ err, status }) => {   //* Acknowledgement

            //Enable button click
            $locationButton.removeAttribute('disabled');

            if (err) {
               console.error(err);
            } else {
               console.info(`Location shared! status: ${status}`)
            }
         })
      }
   })
});

//* Utility function
function extractQS(queryString) {
   const regex = /[?&](username|room)=([^&]+)/g;

   let match;
   const params = {};

   // Loop through each match found in the query string
   while ((match = regex.exec(queryString))) {
      // Extract the parameter name and value
      const paramName = decodeURIComponent(match[1]);
      const paramValue = decodeURIComponent(match[2]);

      // Store the parameter in the params object
      params[paramName] = paramValue;
   }

   // Extract the username and room from the params object
   const username = params.username;
   const room = params.room;

   return { username, room };
}

//* Handeling different events differently

//! Handling the below events within 'message' event listner itself
// socket.on('messageReceived', (message) => {  //*When server sends a new message
//    console.info("Server sent : ", message)
// });

// socket.on('newConnection', (message) => {  //*When a new client joins
//    console.info("Server sent : ", message)
// });

// socket.on('dropConnection', (message) => {   //*When one client disconnects
//    console.info("Server sent : ", message)
// });
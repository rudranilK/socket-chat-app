const socket = io();

socket.on("message", (message) => {
   // alert(`Server Responded with : ${message}`);
   console.info(message);
});

// Add event listener to the send button
// document.getElementById("sendButton").addEventListener("click", function (event) {
//    event.preventDefault(); // Prevent form submission

//    // Get the input value
//    const inputMessage = document.getElementById("input-message").value;

//    // Do something with the input value, such as sending it elsewhere
//    socket.emit('sendMessage', inputMessage);

//    // Clear the input field after processing
//    document.getElementById("input-message").value = "";
// });

document.getElementById("form").addEventListener("submit", (event) => {
   event.preventDefault(); // Prevent form submission

   //* Get the input value
   // const inputMessage = document.getElementById("input-message").value;
   const inputElement = event.target.elements['input-message'];

   // Do something with the input value, such as sending it elsewhere
   if (inputElement.value) {
      socket.emit('sendMessage', inputElement.value, ({ err, status }) => {   //* Acknowledgement
         if (err) {
            console.error(err);
         } else {
            console.info(`status, ${status}`)
         }
      });
      // Clear the input field after processing
      inputElement.value = '';
   }
});

//* Handeling different events differently

socket.on('messageReceived', (message) => {  //*When server sends a new message
   console.info("Server sent : ", message)
});

socket.on('newConnection', (message) => {  //*When a new client joins
   console.info("Server sent : ", message)
});

socket.on('dropConnection', (message) => {   //*When one client disconnects
   console.info("Server sent : ", message)
});

//* Geo-location

document.getElementById('send-location').addEventListener("click", () => {

   if (!navigator.geolocation) {
      return alert('Geolocation is not supported by your browser');
   }

   //Async function - using callbacks
   navigator.geolocation.getCurrentPosition((position) => {
      const { coords } = position;
      if (coords) {
         socket.emit('sendLocation', JSON.stringify({
            lat: coords.latitude || null,
            long: coords.longitude || null,
         }), ({ err, status }) => {   //* Acknowledgement
            if (err) {
               console.error(err);
            } else {
               console.info(`Location shared! status: ${status}`)
            }
         })
      }
   })
});

socket.on('clientLocation', (url) => {
   console.info(`New client joined from: ${url}`);

   //* `https://google.com/maps?q=${lat},${long}`
});

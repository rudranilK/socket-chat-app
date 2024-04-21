const userRooms = [];

//* Will use these later
// const rooms = [];
// const users = []
// const roomUserMapping = [];

export const addUser = ({ id, username, room }) => {
   //Sanitize
   username = username.trim();
   room = room.trim();

   //Validate
   if (!username || !room) {
      return {
         err: 'Username and Room are required'
      }
   }

   const existingUser = userRooms.find(user => user.room.toLowerCase() === room.toLowerCase() && user.username.toLowerCase() === username.toLowerCase()
   );

   if (existingUser) {
      return {
         err: 'Username is in use'
      }
   }

   const user = {
      id,
      username,
      room
   }
   userRooms.push(user);

   return { user };
}

export const removeUser = (id) => {
   const removeIdx = userRooms.findIndex(user => user.id === id);
   if (removeIdx < 0) {
      return {
         err: 'Username is not present'
      }
   }

   const removedUser = userRooms[removeIdx];
   userRooms.splice(removeIdx, 1);

   return { user: removedUser };
}

export const getUser = (id) => {
   const user = userRooms.find(el => el.id === id);
   if (!user) {
      return {
         err: 'Username is not present'
      }
   }
   return { user };
}

export const getUsersInRoom = (roomname) => {
   const userRoomRels = userRooms.filter(el => el.room.toLowerCase() === roomname.toLowerCase()).map(el => {
      const { id, username } = el;
      return { id, username };
   });
   return userRoomRels;
}
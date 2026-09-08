import { useEffect, useState } from 'react';
import { createPath, matchPath, useLocation } from 'react-router-dom';

export function useSectionNavigation() {
  const location = useLocation();
  const href = createPath(location);
  const isRoomsList = Boolean(matchPath('/rooms', location.pathname));
  const isRooms = isRoomsList || Boolean(matchPath('/rooms/:roomId', location.pathname));
  const isBookings = Boolean(matchPath('/bookings', location.pathname));
  const [visited, setVisited] = useState({
    rooms: '/rooms',
    roomsList: '/rooms',
    bookings: '/bookings',
  });

  useEffect(() => {
    if (!isRooms && !isBookings) return;
    setVisited((previous) => ({
      rooms: isRooms ? href : previous.rooms,
      roomsList: isRoomsList ? href : previous.roomsList,
      bookings: isBookings ? href : previous.bookings,
    }));
  }, [href, isRooms, isRoomsList, isBookings]);

  return {
    roomsHref: isRooms ? href : visited.rooms,
    roomsListHref: isRoomsList ? href : visited.roomsList,
    bookingsHref: isBookings ? href : visited.bookings,
  };
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    // Queue update listeners
    newSocket.on('appointment-booked', (appointment) => {
      toast.success(`New appointment booked: ${appointment.token}`);
    });

    newSocket.on('appointment-updated', (appointment) => {
      toast.success(`Appointment ${appointment.token} updated`);
    });

    newSocket.on('patient-called', (data) => {
      toast.success(`${data.patientName} called to ${data.room}`);
    });

    newSocket.on('queue-reordered', () => {
      toast.success('Queue has been updated');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const joinQueue = () => {
    if (socket) {
      socket.emit('join-queue');
    }
  };

  const joinAdmin = () => {
    if (socket) {
      socket.emit('join-admin');
    }
  };

  const value = {
    socket,
    connected,
    joinQueue,
    joinAdmin
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
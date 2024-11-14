import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { BrowserRouter as Router, Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import GroupManagement from './pages/GroupManagement';
import GroupChatPage from './pages/GroupChatPage';
import Landing from './pages/Landing';



const App = () => {
  const isLoggedIn = () => {
    return localStorage.getItem('userToken') !== null;
  };

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('userToken');
    if (!token) return null;

    try {
      const base64Url = token.split('.')[1]; // Get the payload part of the token
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isLoggedIn() ? <Navigate to="/groups" /> : <Login />} />
        <Route path="/register" element={isLoggedIn() ? <Navigate to="/groups" /> : <Register />} />
        <Route path="/groups" element={isLoggedIn() ? <GroupManagement userId={getUserIdFromToken()} /> : <Navigate to="/landing" />} />
        <Route path="/landing" element={isLoggedIn() ? <GroupManagement userId={getUserIdFromToken()} /> : <Landing />} />


        <Route path="/" element={<Navigate to="/landing" />} />
        <Route path="/group-chat/:groupId" element={<GroupChatPage />} />
      </Routes>
    </BrowserRouter>
  );
};



export default App;

import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import Login from './pages/auth/Login.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import './index.css';
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><Routes><Route path="/login" element={<Login/>}/><Route path="/forgot-password" element={<ForgotPassword/>}/><Route path="*" element={<Navigate to="/login" replace/>}/></Routes></BrowserRouter></React.StrictMode>);

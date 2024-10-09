import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types'; 
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode'; // Correct import

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the token is stored in localStorage
    const token = localStorage.getItem("token");
    
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setRole(decodedToken.role); // Set role from token
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("token"); // Clear invalid token
      }
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

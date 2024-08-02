// Auth.js
"use client";

import React, { useState } from "react";
import { auth } from "@/firebase"; // Update this path according to your project structure
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  Box,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  Stack,
  Paper,
} from "@mui/material";
import { styled } from "@mui/system";

// Styled Components
const StyledPaper = styled(Paper)({
  padding: "32px",
  maxWidth: "400px",
  width: "100%",
  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#ffffff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "16px",
});

const StyledTextField = styled(TextField)({
  width: "100%",
});

const StyledButton = styled(Button)({
  width: "100%",
  padding: "10px",
  backgroundColor: "#6200ea",
  color: "white",
  "&:hover": {
    backgroundColor: "#4500b5",
  },
});

const Auth = ({ onUserChange }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      onUserChange(userCredential.user);
      setSnackbarMessage("Registration successful!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error registering:", error);
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      onUserChange(userCredential.user);
      setSnackbarMessage("Login successful!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error logging in:", error);
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      onUserChange(null);
      setSnackbarMessage("Logout successful!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error logging out:", error);
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <StyledPaper>
      {user ? (
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h6">Welcome, {user.email}</Typography>
          <StyledButton onClick={handleLogout}>Logout</StyledButton>
        </Box>
      ) : (
        <Stack spacing={2}>
          <Typography variant="h4" color="#6200ea">
            Welcome Back
          </Typography>
          <StyledTextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <StyledTextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <StyledButton variant="contained" onClick={handleLogin}>
            Login
          </StyledButton>
          <StyledButton variant="outlined" onClick={handleRegister}>
            Register
          </StyledButton>
        </Stack>
      )}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </StyledPaper>
  );
};

export default Auth;

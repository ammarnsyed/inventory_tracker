// page.js
"use client";
import { useState, useEffect, useRef } from "react";
import { firestore, auth, storage } from "@/firebase";
import {
  collection,
  query, 
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert,
  Modal,
  List,
  ListItem,
  ListItemText,
  Divider,
  Container,
} from "@mui/material";
import { styled } from "@mui/system";
import { motion } from "framer-motion";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { Camera } from "react-camera-pro";
import Auth from "./Auth";

const StyledBox = styled(Box)({
  width: "100vw",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  gap: "16px",
  backgroundColor: "#f0f0f0",
  padding: "20px",
  boxSizing: "border-box",
});

const StyledModalBox = styled(motion.div)({
  width: "90%",
  maxWidth: 400,
  backgroundColor: "white",
  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)",
  padding: "24px",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  outline: "none",
});

const StyledCard = styled(Card)({
  borderRadius: "8px",
  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
  transition: "transform 0.2s",
  "&:hover": {
    transform: "translateY(-4px)",
  },
});

const StyledButton = styled(Button)({
  backgroundColor: "#6200ea",
  color: "white",
  "&:hover": {
    backgroundColor: "#4500b5",
  },
});

const StyledSearchField = styled(TextField)({
  width: "100%",
  maxWidth: "400px",
  marginBottom: "16px",
});

const ScrollableContainer = styled(Container)({
  overflowY: "auto",
  flex: 1,
  width: "100%",
  maxWidth: "800px",
  padding: "16px",
  backgroundColor: "white",
  borderRadius: "8px",
  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)",
});

const openRouterAPIKey = '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';
const openRouterModelURL = 'https://openrouter.ai/api/v1/chat/completions';

const Home = () => {
  const [inventory, setInventory] = useState([]);
  const [localInventory, setLocalInventory] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openScanModal, setOpenScanModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemCount, setItemCount] = useState(1);
  const [editName, setEditName] = useState("");
  const [editCount, setEditCount] = useState(1);
  const [deleteCount, setDeleteCount] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [user, setUser] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [searchQuery, setSearchQuery] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [recipes, setRecipes] = useState([]);

  const cameraRef = useRef(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        updateInventory(currentUser.uid);
      }
    });
  }, []);

  const updateInventory = async (userId) => {
    const snapshot = query(collection(firestore, `users/${userId}/inventory`));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
    setLocalInventory(inventoryList); // Update local inventory as well
    handleGetRecipes(inventoryList);
  };

  const addItem = async (item, count) => {
    if (!user || !item) return;
    const normalizedItem = item.toLowerCase();
    const docRef = doc(
      collection(firestore, `users/${user.uid}/inventory`),
      normalizedItem
    );
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + count });
    } else {
      await setDoc(docRef, { quantity: count });
    }
    await updateInventory(user.uid);
  };

  const removeItem = async (item, count) => {
    if (!user || !item || !item.name) return;
    const normalizedItem = item.name.toLowerCase();
    const docRef = doc(
      collection(firestore, `users/${user.uid}/inventory`),
      normalizedItem
    );
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity <= count) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - count });
      }
    }
    await updateInventory(user.uid);
  };

  const editItem = async (originalName, newName, newCount) => {
    if (!user || !originalName) return;
    if (originalName !== newName) {
      await removeItem({ name: originalName }, Infinity);
      await addItem(newName, newCount);
    } else {
      const docRef = doc(
        collection(firestore, `users/${user.uid}/inventory`),
        originalName
      );
      await setDoc(docRef, { quantity: newCount });
    }
    await updateInventory(user.uid);
  };

  const getRecipeRecommendations = async (inventoryItems) => {
    const prompt = `Given the following ingredients: ${inventoryItems.join(', ')}. Suggest some healthy recipes.`;

    try {
      const response = await fetch(openRouterModelURL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterAPIKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            { role: "user", content: prompt }
          ],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        return data.choices[0].message.content.trim().split('\n');
      } else {
        console.error('Error getting recipe recommendations:', data);
        throw new Error(data.error.message || 'Failed to get recipe recommendations');
      }
    } catch (error) {
      console.error('Error getting recipe recommendations:', error);
      throw error;
    }
  };

  const handleGetRecipes = async (inventoryList) => {
    const inventoryItems = inventoryList.map(item => item.name);
    try {
      const recipes = await getRecipeRecommendations(inventoryItems);
      setRecipes(recipes.map(recipe => ({ title: recipe })));
    } catch (error) {
      console.error('Error getting recipes:', error);
      setSnackbarMessage('Failed to get recipe recommendations');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleOpenAddModal = () => setOpenAddModal(true);
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleAddItem = () => {
    if (itemName.trim() && itemCount > 0) {
      addItem(itemName.trim(), parseInt(itemCount, 10));
      setItemName("");
      setItemCount(1);
      handleCloseAddModal();
      setSnackbarMessage("Item added successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    }
  };

  const handleOpenDeleteModal = (item) => {
    setSelectedItem(item);
    setDeleteCount(1);
    setOpenDeleteModal(true);
  };

  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const handleDeleteItem = () => {
    if (selectedItem && deleteCount > 0) {
      removeItem(selectedItem, parseInt(deleteCount, 10));
      handleCloseDeleteModal();
      setSnackbarMessage("Item removed successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    }
  };

  const handleOpenEditModal = (item) => {
    setSelectedItem(item);
    setEditName(item.name);
    setEditCount(item.quantity);
    setOpenEditModal(true);
  };
  const handleCloseEditModal = () => setOpenEditModal(false);
  const handleEditItem = () => {
    if (selectedItem && editName.trim() && editCount > 0) {
      editItem(selectedItem.name, editName.trim(), parseInt(editCount, 10));
      handleCloseEditModal();
      setSnackbarMessage("Item edited successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    }
  };

  const handleOpenScanModal = () => setOpenScanModal(true);
  const handleCloseScanModal = () => setOpenScanModal(false);
  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const imageSrc = cameraRef.current.takePhoto();
        setCapturedImage(imageSrc);
        console.log("Captured Image:", imageSrc);

        const storageRef = ref(storage, `images/${Date.now()}.jpg`);
        await uploadString(storageRef, imageSrc, "data_url");
        const downloadURL = await getDownloadURL(storageRef);

        console.log("Image uploaded to Firebase Storage:", downloadURL);
        setSnackbarMessage("Image uploaded successfully!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      } catch (error) {
        console.error("Error capturing or uploading image:", error);
        setSnackbarMessage("Error capturing or uploading image. Please try again.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    } else {
      console.error("No camera device accessible.");
      setSnackbarMessage("No camera device accessible. Please connect your camera or try a different browser.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setSnackbarMessage("Sign out successful!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error signing out:", error);
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const handleFetchNewRecipes = () => {
    handleGetRecipes(inventory);
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery)
  );

  return (
    <StyledBox>
      {!user ? (
        <Box
          width="100vw"
          height="100vh"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          bgcolor="#6200ea"
          p={4}
        >
          <Typography variant="h2" color="white" mb={2} textAlign="center">
            Welcome to Your Pantry Manager
          </Typography>
          <Typography variant="h6" color="white" mb={4} textAlign="center">
            Manage your pantry with ease and style!
          </Typography>
          <Auth onUserChange={(user) => user && updateInventory(user.uid)} />
        </Box>
      ) : (
        <>
          <Box display="flex" flexDirection="column" alignItems="center" width="100%">
            <Typography variant="h2" gutterBottom>
              Pantry Tracker
            </Typography>
            <StyledSearchField
              variant="outlined"
              label="Search Inventory"
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
            <Box display="flex" justifyContent="center" gap={2} mb={2}>
              <StyledButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddModal}
              >
                Add New Item
              </StyledButton>
              <StyledButton
                variant="contained"
                startIcon={<CameraAltIcon />}
                onClick={handleOpenScanModal}
              >
                Scan Items
              </StyledButton>
              <Button
                variant="contained"
                sx={{ bgcolor: "#BC1456", color: "white" }}
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </Box>
          </Box>
          
          <ScrollableContainer>
            <Typography variant="h4" mt={4}>Inventory Items</Typography>
            <Grid container spacing={3} marginTop={3}>
              {filteredInventory.map((item, index) => (
                <Grid item key={index} xs={12}>
                  <StyledCard>
                    <CardContent>
                      <Typography variant="h5">{item.name}</Typography>
                      <Typography variant="body2">
                        Count: {item.quantity}
                      </Typography>
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenEditModal(item)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={() => handleOpenDeleteModal(item)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
            <Typography variant="h4" mt={4}>Suggested Recipes</Typography>
            <StyledButton
              variant="contained"
              onClick={handleFetchNewRecipes}
              sx={{ mb: 2 }}
            >
              Fetch New Recipes
            </StyledButton>
            <List>
              {recipes.map((recipe, index) => (
                <div key={index}>
                  <ListItem>
                    <ListItemText primary={recipe.title} />
                  </ListItem>
                  <Divider />
                </div>
              ))}
            </List>
          </ScrollableContainer>
        </>
      )}
      <Modal
        open={openScanModal}
        onClose={handleCloseScanModal}
        aria-labelledby="scan-item-modal"
        aria-describedby="scan-item-camera"
        BackdropProps={{
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
          <StyledModalBox
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h6" component="h2" id="scan-item-modal">
              Scan Item
            </Typography>
            <Camera
              ref={cameraRef}
              facingMode="environment"
              aspectRatio={16 / 9}
            />
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={handleCloseScanModal}>Cancel</Button>
              <StyledButton onClick={handleCapture}>Capture</StyledButton>
            </Box>
          </StyledModalBox>
        </Box>
      </Modal>

      <Modal
        open={openAddModal}
        onClose={handleCloseAddModal}
        aria-labelledby="add-item-modal"
        aria-describedby="add-item-form"
        BackdropProps={{
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
          <StyledModalBox
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h6" component="h2" id="add-item-modal" sx={{ mb: 2 }}>
              Add Item
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              label="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              variant="outlined"
              label="Item Count"
              type="number"
              value={itemCount}
              onChange={(e) => setItemCount(e.target.value)}
              margin="normal"
            />
            <Box display="flex" justifyContent="center" gap={1} mt={2}>
              <Button onClick={handleCloseAddModal}>Cancel</Button>
              <StyledButton onClick={handleAddItem}>Add</StyledButton>
            </Box>
          </StyledModalBox>
        </Box>
      </Modal>

      <Modal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        aria-labelledby="delete-item-modal"
        aria-describedby="delete-item-form"
        BackdropProps={{
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
          <StyledModalBox
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h6" component="h2" id="delete-item-modal">
              Remove Item
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              label="Count to Remove"
              type="number"
              value={deleteCount}
              onChange={(e) => setDeleteCount(e.target.value)}
              margin="normal"
            />
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={handleCloseDeleteModal}>Cancel</Button>
              <StyledButton onClick={handleDeleteItem}>Remove</StyledButton>
            </Box>
          </StyledModalBox>
        </Box>
      </Modal>

      <Modal
        open={openEditModal}
        onClose={handleCloseEditModal}
        aria-labelledby="edit-item-modal"
        aria-describedby="edit-item-form"
        BackdropProps={{
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
          <StyledModalBox
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h6" component="h2" id="edit-item-modal">
              Edit Item
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              label="New Item Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              variant="outlined"
              label="New Item Count"
              type="number"
              value={editCount}
              onChange={(e) => setEditCount(e.target.value)}
              margin="normal"
            />
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={handleCloseEditModal}>Cancel</Button>
              <StyledButton onClick={handleEditItem}>Save</StyledButton>
            </Box>
          </StyledModalBox>
        </Box>
      </Modal>

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
    </StyledBox>
  );
};

export default Home;

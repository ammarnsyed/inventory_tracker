"use client";
import { useState, useEffect } from "react";
import { firestore } from "@/firebase";
import { Box, Typography, Grid, TextField, Button, Card, CardContent, IconButton } from "@mui/material";
import { collection, query, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { styled } from "@mui/system";
import Modal from '@mui/material/Modal';
import { motion } from "framer-motion";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

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
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  backgroundColor: "white",
  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)",
  padding: "24px",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
});

const StyledCard = styled(Card)({
  borderRadius: "8px",
  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
  transition: "transform 0.2s",
  '&:hover': {
    transform: "translateY(-4px)",
  },
});

const StyledButton = styled(Button)({
  backgroundColor: "#6200ea",
  color: "white",
  '&:hover': {
    backgroundColor: "#4500b5",
  },
});

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCount, setItemCount] = useState(1);
  const [deleteCount, setDeleteCount] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const removeItem = async (item, count) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity <= count) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - count });
      }
    }
    await updateInventory();
  };

  const addItem = async (item, count) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + count });
    } else {
      await setDoc(docRef, { quantity: count });
    }
    await updateInventory();
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpenAddModal = () => setOpenAddModal(true);
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleAddItem = () => {
    if (itemName.trim() && itemCount > 0) {
      addItem(itemName.trim(), parseInt(itemCount, 10));
      setItemName('');
      setItemCount(1);
      handleCloseAddModal();
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
    }
  };

  return (
    <StyledBox>
      <Typography variant="h2" gutterBottom>
        Inventory Tracker
      </Typography>
      <StyledButton
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpenAddModal}
      >
        Add New Item
      </StyledButton>
      <Modal
        open={openAddModal}
        onClose={handleCloseAddModal}
        aria-labelledby="add-item-modal"
        aria-describedby="add-item-form"
        BackdropProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <StyledModalBox
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Typography variant="h6" component="h2" id="add-item-modal">
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
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button onClick={handleCloseAddModal}>Cancel</Button>
            <StyledButton onClick={handleAddItem}>Add</StyledButton>
          </Box>
        </StyledModalBox>
      </Modal>
      <Modal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        aria-labelledby="delete-item-modal"
        aria-describedby="delete-item-form"
        BackdropProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
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
      </Modal>
      <Grid container spacing={3} marginTop={3}>
        {inventory.map((item, index) => (
          <Grid item key={index} xs={12} md={4}>
            <StyledCard>
              <CardContent>
                <Typography variant="h5">{item.name}</Typography>
                <Typography variant="body2">Count: {item.quantity}</Typography>
                <Box display="flex" justifyContent="flex-end">
                  <IconButton color="secondary" onClick={() => handleOpenDeleteModal(item.name)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </StyledBox>
  );
}

'use client'
import { useState, useEffect, useRef } from 'react';
import { firestore } from '@/firebase';
import { Box, Modal, Stack, Typography, TextField, Button, Container, AppBar, Toolbar, Grid, Paper } from '@mui/material';
import { collection, query, getDocs, doc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import Groq from "groq-sdk";

async function getGroqChatCompletion(prompt) {
  const groq = new Groq({apiKey: `${process.env.GROQ_API_KEY}`, dangerouslyAllowBrowser: true});
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-8b-8192",
    });
    return response.choices[0]?.message?.content || "No suggestions available.";
  } catch (error) {
    console.error("Error fetching recipe suggestions:", error);
    return "Unable to fetch recipe suggestions at this time.";
  }
}

async function getRecipeSuggestions(inventoryItems) {
  const prompt = `Given the following ingredients: ${inventoryItems.join(', ')}, suggest 3 recipes that can be made. For each recipe, provide the name and a brief description.`;
  return await getGroqChatCompletion(prompt);
}

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipeSuggestions, setRecipeSuggestions] = useState("");

  const updateRecipeSuggestions = async () => {
    const inventoryItems = inventory.map(item => item.name);
    const suggestions = await getRecipeSuggestions(inventoryItems);
    setRecipeSuggestions(suggestions);
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }

    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }

    await updateInventory();
  };

  useEffect(() => {
    updateInventory();
  }, []);

  useEffect(() => {
    if (inventory.length > 0) {
      updateRecipeSuggestions();
    }
  }, [inventory]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'white',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: "#a795de" }}>
        <Toolbar>
          <Typography variant="h4" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Inventory Management
          </Typography>
          <Button color="inherit" onClick={handleOpen}>Add New Item</Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <TextField
          id="search-input"
          label="Search Items"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3, bgcolor: 'white' }}
        />
        
        <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
          <Stack spacing={2} sx={{ maxHeight: '60vh', overflow: 'auto', p: 2 }}>
            {filteredInventory.map(({ name, quantity }) => (
              <Box
                key={name}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: '#f0f0f0',
                  p: 2,
                  borderRadius: 1,
                }}
              >
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Quantity: {quantity}
                </Typography>
                <Button variant="contained" onClick={() => addItem(name)} sx={{ mr: 1 }}>
                  Add
                </Button>
                <Button variant="outlined" onClick={() => removeItem(name)}>
                  Remove
                </Button>
              </Box>
            ))}
          </Stack>
        </Box>
      </Container>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Existing inventory list code */}
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 2, bgcolor: 'white' }}>
              <Typography variant="h5" sx={{ mb: 2 }}>Recipe Suggestions</Typography>
              {/* Commented out as not working */}
              {/* <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{recipeSuggestions}</Typography> */}
              <Typography variant="body1">Recipe suggestions are currently unavailable.</Typography>
              <Button variant="contained" onClick={() => alert('Recipe suggestions are currently unavailable.')} sx={{ mt: 2 }}>
                Refresh Suggestions
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            Add New Item
          </Typography>
          <TextField
            id="outlined-basic"
            label="Item Name"
            variant="outlined"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              addItem(itemName);
              setItemName('');
              handleClose();
            }}
          >
            Add Item
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}

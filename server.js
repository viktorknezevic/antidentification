const express = require('express');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const app = express();
const cors = require('cors');

// Use CORS middleware
app.use(cors());

// Ensure the uploads directory exists and is accessible
const uploadDir = path.join(__dirname, 'public', 'uploads');

const corsOptions = {
  origin: 'http://127.0.0.1:5500' // Update this to match your frontend's origin
};

app.use(cors(corsOptions));

// Configure multer to use the correct path and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueCode = uuidv4();
    cb(null, `${uniqueCode}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Middleware to serve static files (including uploads)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for admin login
app.use(session({
  secret: 'skibidi', // Change this to a secure key
  resave: false,
  saveUninitialized: true
}));

const requests = [];

// Handle file upload
// Handle file upload
app.post('/upload', upload.single('antImage'), (req, res) => {
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).send('No file uploaded.');
  }

  try {
    const uniqueCode = req.file.filename.split('-')[0];
    
    const newRequest = {
      uniqueCode: uniqueCode,
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      status: 'Pending review',
      outcome: ''
    };

    requests.push(newRequest);
    console.log('Image uploaded successfully');
    res.send('Image uploaded successfully');
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).send('Error handling file upload');
  }
});


// Endpoint to fetch recent uploads
app.get('/requests', (req, res) => {
  res.json(requests);
});

// Endpoint for admin to fetch images
app.get('/admin/images', (req, res) => {
  if (req.session.isAdmin) {
    res.json(requests);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Admin login handling
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'skibidirizzler') {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.status(401).send('Unauthorized');
  }
});

// Serve admin page
app.get('/admin', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.redirect('/login.html');
  }
});

// Handle status updates
app.post('/identify', (req, res) => {
  const { uniqueCode, status, outcome } = req.body;
  const request = requests.find(r => r.uniqueCode === uniqueCode);
  if (request) {
    request.status = status;
    request.outcome = outcome;
    res.send('Request updated successfully');
  } else {
    res.status(404).send('Request not found');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

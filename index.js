const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3002;

// MongoDB connection
mongoose.connect(
  'mongodb+srv://SuenoFarms:bestliners@cluster0.imrxbn0.mongodb.net/myDatabase?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define schema and model for the aggregated batches
const aggregatedBatchSchema = new mongoose.Schema({
  batchNumber: String,
  totalTrayCount: Number,
  currentRow: String,
  rootingProgress: String,
  photos: Array,
  logs: Array,
  status: String,
});

const AggregatedBatch = mongoose
  .connection
  .useDb('myDatabase')
  .model('AggregatedBatch', aggregatedBatchSchema, 'aggregatedBatches');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Routes
// Home route to fetch and display all active batches
app.get('/', async (req, res) => {
  try {
    const batches = await AggregatedBatch.find({ status: 'active' }, 'batchNumber')
      .sort({ batchNumber: 1 });

    res.render('index', { batches });
  } catch (err) {
    console.error('Error fetching batches:', err);
    res.status(500).send('Error loading batches');
  }
});

// Route to display batch-specific details
app.get('/batch', async (req, res) => {
  const { batchNumber } = req.query;

  try {
    const batch = await AggregatedBatch.findOne({ batchNumber });
    if (!batch) {
      return res.status(404).send('Batch not found');
    }

    res.render('batch', { batch });
  } catch (err) {
    console.error('Error fetching batch details:', err);
    res.status(500).send('Error loading batch details');
  }
});

// Start Server
app.listen(port, () => console.log(`Batch Selector App running at http://localhost:${port}`));

const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // Directory where images will be saved
  },
  filename: (req, file, cb) => {
    const plantName = req.body.plantName; // Ensure plantName is sent in the form
    const daysOld = req.body.daysOld; // Ensure daysOld is sent in the form
    cb(null, `${plantName}_${daysOld}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Plant Photos schema
const plantPhotoSchema = new mongoose.Schema({
  batchNumber: String,
  plantName: String,
  daysOld: Number,
  filePath: String,
  timestamp: { type: Date, default: Date.now },
});

const PlantPhoto = mongoose
  .connection
  .useDb('myDatabase')
  .model('PlantPhoto', plantPhotoSchema, 'PlantPhotos');

// Route to handle image upload
app.post('/batch/:batchNumber/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const { plantName, daysOld } = req.body;

    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    // Save photo metadata to the database
    const newPhoto = new PlantPhoto({
      batchNumber: decodeURIComponent(batchNumber),
      plantName,
      daysOld: parseInt(daysOld, 10),
      filePath: req.file.path,
    });

    await newPhoto.save();

    console.log(`Photo uploaded: ${req.file.path}`);
    res.redirect(`/batch/${encodeURIComponent(batchNumber)}`);
  } catch (err) {
    console.error('Error uploading photo:', err);
    res.status(500).send('Error uploading photo');
  }
});

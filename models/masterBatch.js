const mongoose = require('mongoose');

const masterBatchSchema = new mongoose.Schema({
  batchNumber: { type: String, required: true },
  totalTrayCount: { type: Number, required: true },
  currentRow: { type: String, required: true },
  rootingProgress: { type: String, required: true },
  photos: [String],
  logs: [
    {
      type: String,
      details: String,
      count: Number,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  status: { type: String, default: 'active' },
});

module.exports = mongoose.model('MasterBatch', masterBatchSchema, 'masterBatches');

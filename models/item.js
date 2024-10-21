const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['sub junior', 'junior', 'senior','general'], required: true },
  type: { type: String, enum: ['gold', 'silver', 'bronze'], required: true }, // Add type field
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contestant' }], // Array of contestants
});

module.exports = mongoose.model('Item', ItemSchema);

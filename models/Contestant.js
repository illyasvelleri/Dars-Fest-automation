const mongoose = require('mongoose');

const contestantSchema = new mongoose.Schema({
    contestantNumber: { type: String, unique: true }, // Contestant number is still unique
    name: { type: String, required: true },
    groupName: { type: String, required: true },
});

const Contestant = mongoose.model('Contestant', contestantSchema);

module.exports = Contestant;
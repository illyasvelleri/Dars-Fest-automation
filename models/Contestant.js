const mongoose = require('mongoose');

const contestantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    groupName: { type: String, required: true },
    tokenNumber: { type: Number, required: true },
    contestantNumber: { type: String, unique: true }, // Contestant number is still unique
    scores: [
        {
            itemId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Item', // Reference to Item model
            },
            score: {
                type: Number,
                min: 0,
                max: 100,
            },
        },
    ],
    badge: {
        type: String,
        enum: ['first', 'second', 'third'], // Restrict to certain badge values
        default: null, // Default to null if no badge assigned
    },
});

const Contestant = mongoose.model('Contestant', contestantSchema);

module.exports = Contestant;

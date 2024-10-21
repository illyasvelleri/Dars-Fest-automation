const Contestant = require('../models/Contestant');
const Item = require('../models/item');
const Jury = require('../models/Jury');
const Result = require('../models/GroupedScores');
const mongoose = require('mongoose');


exports.adminDashboard = async (req, res) => {
    try {
        const juries = await Jury.find();  // Fetch all juries
        res.render('admin/dashboard', { juries });
    } catch (error) {
        console.error('Error fetching juries:', error);
        res.status(500).send('Error fetching juries');
    }
}
exports.renderAddItemsPage = (req, res) => {
    res.render('admin/add-items');
};
exports.renderContestants = (req, res) => {
    res.render('admin/contestants');
};




// Function to generate token number (starting with ADF)
const generateContestantNumber = () => {
    return 'ADF' + Math.floor(1000 + Math.random() * 9000);
};


// Upload contestant details

exports.uploadContestant = async (req, res) => {
    try {
        const { name, groupName, tokenNumber } = req.body;
        const contestantNumber = generateContestantNumber();
        console.log('Generated Contestant Number:', contestantNumber);

        // Creating new contestant with the provided details and the generated contestant number
        const newContestant = new Contestant({
            name,
            groupName,
            tokenNumber,
            contestantNumber, // Saving generated contestant number
        });

        await newContestant.save();
        res.redirect('/admin/contestants');
        console.log('Uploaded Details Successfully');
    } catch (error) {
        // Log the actual error message for debugging purposes
        console.error('Error uploading contestant details:', error.message);
        res.status(500).send(`Error uploading contestant details: ${error.message}`);
    }
};

// Fetch all contestants for admin view

exports.getContestants = async (req, res) => {
    try {
        const contestantsFromDb = await Contestant.find();
        // Convert each contestant document to a plain object
        const contestants = contestantsFromDb.map(contestant => contestant.toObject());

        res.render('admin/contestants', { contestants: contestants });
    } catch (error) {
        res.status(500).send("Error fetching contestants.");
    }
};

// Save the new item to the database
exports.createItem = async (req, res) => {
    try {
        const { name, category, type } = req.body;
        const newItem = new Item({ name, category, type });
        await newItem.save();
        res.json({ success: true });
    } catch (error) {
        console.log('Error Adding Item:', error);
        res.json({ success: false });
    }
};

// Fetch and display items
exports.getItems = async (req, res) => {
    try {
        const itemsFromDb = await Item.find();
        const items = itemsFromDb.map(items => items.toObject());

        // Log the items to check their structure
        console.log('Items:', items);

        // Fetch juries from the database
        const juriesFromDb = await Jury.find();
        const juries = juriesFromDb.map(jury => jury.toObject());


        res.render('admin/items', { items, juries });
    } catch (error) {
        res.status(500).send('Error fetching items');
    }
};

// Fetch item details by ID
exports.getItemDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await Item.findById(id).populate('participants').lean(); // Adjust as necessary for your data structure
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching item details' });
    }
};

//assign Jury To Item
exports.assignJuryToItem = async (req, res) => {
    const { itemId, juryId } = req.body;
    try {
        // Find the item and update with the selected jury
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found.' });
        }

        // Find the jury by ID
        const jury = await Jury.findById(juryId);
        if (!jury) {
            return res.status(404).json({ success: false, message: 'Jury not found.' });
        }

        // Check if the jury already has an assigned item
        if (jury.assignedItems.length > 0) {
            // If there's an existing item, remove it from the jury
            const existingItemId = jury.assignedItems[0]; // Get the existing item ID
            jury.assignedItems = []; // Clear the assigned items
            await jury.save(); // Save the updated jury

            // Optionally, if you want to clear the jury field in the item
            await Item.findByIdAndUpdate(existingItemId, { jury: null }); // Clear jury reference in the existing item
        }

        // Assign the new item to the jury
        item.jury = juryId; // Adjust as per your data structure
        await item.save();

        // Add the new item ID to the jury's assigned items
        jury.assignedItems.push(itemId);
        await jury.save();

        // Send success response
        return res.json({ success: true });
    } catch (error) {
        console.error('Error assigning jury:', error);
        // Ensure no previous response is sent before this
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Error assigning jury.' });
        }
    }
};

// View item page with populated participants and scores for each item
// View item page with populated participants and scores for each item
// exports.viewItemPage = async (req, res) => {
//     const itemId = req.params.id;

//     try {
//         // Find the item by ID and populate participants
//         const item = await Item.findById(itemId).populate({
//             path: 'participants',
//             select: 'name contestantNumber scores badge'
//         }).lean(); // Use lean() to get a plain JavaScript object

//         if (!item) {
//             return res.status(404).send('Item not found');
//         }

//         // Restructure participants to directly include scores for the current item
//         const participantsWithScores = item.participants.map(participant => {
//             const scoreEntry = participant.scores.find(score => score.itemId.toString() === itemId.toString());
//             return {
//                 ...participant,
//                 score: scoreEntry ? scoreEntry.score : null // Add the score if found, else set to null
//             };
//         });

//         // Pass participantsWithScores along with the item
//         res.render('admin/manageItem', { item, participants: participantsWithScores });

//     } catch (error) {
//         console.error('Error fetching item details:', error);
//         res.status(500).send('Error fetching item details');
//     }
// };



// View item page with populated participants
exports.viewItemPage = async (req, res) => {
    const itemId = req.params.id;

    try {
        // Find the item by ID and populate participants
        const item = await Item.findById(itemId).populate('participants');
        if (!item) {
            return res.status(404).send('Item not found');
        }

        // Convert Mongoose document to plain JavaScript object
        const itemObj = item.toObject();

        // Fetch scores for each participant
        const participantScores = await Promise.all(itemObj.participants.map(async (participant) => {
            const contestant = await Contestant.findById(participant._id).select('scores');
            return {
                id: contestant._id,
                name: contestant.name,
                scores: contestant.scores.filter(score => score.itemId.toString() === itemId.toString()),
            };
        }));

        console.log('Item ID:', itemObj._id);
        console.log('Participants:', itemObj.participants); // Log participants to see what data is being fetched

        // Render the view with the plain JavaScript object
        res.render('admin/manageItem', { item: itemObj, itemId: itemObj._id.toString(), participantScores });

    } catch (error) {
        console.log('Error fetching item:', error);
        res.status(500).send('Error fetching item details');
    }
};



// exports.viewItemPage = async (req, res) => {
//     const itemId = req.params.id;

//     try {
//         // Find the item by ID and populate participants
//         const item = await Item.findById(itemId).populate('participants');
//         if (!item) {
//             return res.status(404).send('Item not found');
//         }
//         console.log('Item ID: ',item._id); 
//         console.log('Participants:', item.participants); // Log participants to see what data is being fetched

//         res.render('admin/manageItem', { item, itemId: item._id.toString() });

//     } catch (error) {
//         console.log('Error fetching item:', error);
//         res.status(500).send('Error fetching item details');
//     }

// };

// Search contestants by name, groupName, tokenNumber, or contestantNumber
exports.searchContestants = async (req, res) => {
    const query = req.query.q;

    try {
        console.log('Search Query:', query);  // Log query for debugging

        // Check if the query exists
        if (!query) {
            return res.status(400).json({ error: 'No query provided' });
        }

        // Check if the query is numeric (for tokenNumber and contestantNumber)
        const isNumericQuery = !isNaN(query);

        // Create search criteria
        let searchCriteria;
        if (isNumericQuery) {
            // Search for tokenNumber or contestantNumber if the query is numeric
            searchCriteria = {
                $or: [
                    { tokenNumber: parseInt(query, 10) },  // Ensure tokenNumber is treated as a number
                    { contestantNumber: parseInt(query, 10) } // Ensure contestantNumber is treated as a number
                ]
            };
        } else {
            // Otherwise, search for name or groupName
            searchCriteria = {
                $or: [
                    { name: { $regex: query, $options: 'i' } }, // Case-insensitive match for name
                    { groupName: { $regex: query, $options: 'i' } } // Case-insensitive match for groupName
                ]
            };
        }

        console.log('Search Criteria:', searchCriteria); // Log the search criteria

        // Perform the search
        const contestants = await Contestant.find(searchCriteria);
        console.log('Contestants found:', contestants);  // Log the results

        res.json(contestants);
    } catch (error) {
        console.error('Error searching contestants:', error);  // Log the actual error
        res.status(500).json({ error: 'Error searching contestants' });
    }
};


exports.addContestantToItem = async (req, res) => {
    const { itemId, contestantId } = req.body;
    
    try {

        // Check if both itemId and contestantId are valid ObjectId strings
        if (!mongoose.Types.ObjectId.isValid(itemId) || !mongoose.Types.ObjectId.isValid(contestantId)) {
            return res.status(400).send('Invalid item or contestant ID');
        }

        
        const item = await Item.findById(itemId);
        const contestant = await Contestant.findById(contestantId);

        if (!item || !contestant) {
            return res.status(404).json({ success: false, message: 'Item or contestant not found' });
        }

        if (item.participants.includes(contestantId)) {
            return res.status(400).json({ success: false, message: 'Contestant already added' });
        }

        // Add contestant and save the item
        item.participants.push(contestantId);
        await item.save();

        // Send a success response
        return res.json({ success: true, message: 'Contestant added successfully' });
    } catch (error) {
        console.error('Error adding contestant to item:', error);
        return res.status(500).json({ success: false, message: 'Error adding contestant to item' });
    }
};



exports.renderJuryCreation = (req, res) => {
    res.render('admin/create-jury');
};


// Create Jury

exports.createJury = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the username already exists
        const existingJury = await Jury.findOne({ username });
        if (existingJury) {
            return res.status(400).send('Username already taken');
        }

        // Create the new jury
        const newJury = new Jury({ username, password });
        await newJury.save();

        const juries = await Jury.find();

        // Convert each Jury document to a plain object
        const juriesPlain = juries.map(jury => jury.toObject());
        res.render('admin/view-juries', { juries: juriesPlain });

    } catch (error) {
        console.error('Error creating jury:', error);
        res.status(500).send('Error creating jury');
    }
};

exports.viewAllJuries = async (req, res) => {
    try {
        const juries = await Jury.find();

        // Convert each Jury document to a plain object
        const juriesPlain = juries.map(jury => jury.toObject());
        res.render('admin/view-juries', { juries: juriesPlain });
    } catch (error) {
        console.error('Error fetching juries:', error);
        res.status(500).send('Error fetching juries');
    }
};

// exports.saveScores = async (req, res) => {
//     try {
//         const { scores } = req.body;

//         if (!scores || !Array.isArray(scores)) {
//             return res.status(400).json({ success: false, message: 'Invalid data format' });
//         }

//         for (const entry of scores) {
//             const { contestantId, itemId, score } = entry;

//             // Ensure all required fields are present
//             if (!contestantId || !itemId || score === undefined || score === null) {
//                 console.warn('Missing fields in entry:', entry); // Log missing fields
//                 continue; // Skip invalid entries
//             }

//             // Parse the score from string to integer
//             const parsedScore = parseInt(score, 10);
//             if (isNaN(parsedScore)) {
//                 console.warn('Score parsing failed:', score); // Log parsing failures
//                 continue; // Skip if score parsing fails
//             }

//             // Proceed with finding the contestant
//             const contestant = await Contestant.findById(contestantId);
//             if (!contestant) {
//                 console.error(`Contestant not found: ${contestantId}`);
//                 continue; // Skip if contestant not found
//             }

//             // Check if any other contestant has the same score for the same item
//             const hasSameScoreInOtherContestants = await Contestant.findOne({
//                 scores: { $elemMatch: { itemId: itemId, score: parsedScore } },
//                 _id: { $ne: contestantId } // Exclude the current contestant
//             });

//             if (hasSameScoreInOtherContestants) {
//                 return res.status(400).json({ success: false, message: `Score of ${parsedScore} for item ${itemId} is already taken by another contestant.` });
//             }

//            // Check for existing score entry for the item
//            const existingScore = contestant.scores.find(s => s.itemId.toString() === itemId.toString());

//            // Update the score using findByIdAndUpdate to avoid version errors
//            const update = existingScore
//                ? { "scores.$.score": parsedScore } // Update existing score
//                : { $push: { scores: { itemId, score: parsedScore } } }; // Add new score

//            try {
//                await Contestant.findOneAndUpdate(
//                    { _id: contestantId, "scores.itemId": existingScore ? itemId : { $exists: false } }, 
//                    update, 
//                    { new: true }
//                );
//                console.log(`Scores updated for contestant: ${contestantId}`);
//            } catch (saveError) {
//                console.error('Error updating contestant:', saveError);
//                return res.status(500).json({ success: false, message: 'Failed to update scores', error: saveError.message });
//            }
//        }


//         // After updating the scores, handle the badge assignment
//         const itemIds = [...new Set(scores.map(score => score.itemId))]; // Get unique item IDs

//         for (const itemId of itemIds) {
//             // Fetch all contestants for this item who have a score greater than 0
//             const contestantsForItem = await Contestant.find({
//                 "scores": { $elemMatch: { itemId, score: { $gt: 0 } } }
//             });

//             // Sort the contestants by score in descending order
//             contestantsForItem.sort((a, b) => {
//                 const scoreA = a.scores.find(s => s.itemId.toString() === itemId.toString()).score;
//                 const scoreB = b.scores.find(s => s.itemId.toString() === itemId.toString()).score;
//                 return scoreB - scoreA;
//             });

//             // Assign badges to top three contestants
//             for (let i = 0; i < contestantsForItem.length; i++) {
//                 const badge = i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : null;

//                 if (badge) {
//                     await Contestant.findByIdAndUpdate(contestantsForItem[i]._id, { badge });
//                     console.log(`Assigned '${badge}' badge to: ${contestantsForItem[i].name}`);
//                 } else {
//                     // Clear badge for any contestant beyond the top 3
//                     await Contestant.findByIdAndUpdate(contestantsForItem[i]._id, { badge: null });
//                     console.log(`Reset badge for: ${contestantsForItem[i].name}`);
//                 }
//             }
//         }


//         res.status(200).json({ success: true, message: 'Scores updated successfully badges assigned' });
//     } catch (error) {
//         console.error('Error updating scores:', error);
//         res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
//     }
// };
// Route to handle saving custom points
exports.saveCustomPoints = async (req, res) => {
    try {
        const customPointsData = req.body.customPointsData;

        for (const entry of customPointsData) {
            const itemId = mongoose.Types.ObjectId(entry.itemId); // Cast to ObjectId
            const points = entry.points;

            // Save to the results collection
            await Result.findOneAndUpdate(
                { itemId: itemId },
                { points: points },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({ message: 'Custom points saved successfully' });
    } catch (error) {
        console.error('Error saving custom points:', error);
        res.status(500).json({ error: 'Error saving custom points' });
    }
};
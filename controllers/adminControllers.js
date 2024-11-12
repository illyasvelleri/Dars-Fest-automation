const Contestant = require('../models/Contestant');
const Item = require('../models/item');
const Jury = require('../models/Jury');
const GroupedScores = require('../models/GroupedScores');
const Results = require('../models/Results');
const PublicResults = require('../models/PublicResult');
const Points = require('../models/Points');
const mongoose = require('mongoose');


// exports.adminDashboard = async (req, res) => {
//     try {
//         const juries = await Jury.find(); 
        
//         res.render('admin/dashboard', { juries });
//     } catch (error) {
//         console.error('Error fetching juries:', error);
//         res.status(500).send('Error fetching juries');
//     }
// }

exports.adminDashboard = async (req, res) => {
    try {
        // Fetch all juries from the database
        const juries = await Jury.find();  // Fetch all juries

        // Fetch the results from the database
        const results = await Results.findOne({}, 'topPerformers groupPoints topPerformersByGroup').lean();

        // Check if results were found
        if (!results) {
            console.log("No results found.");
            return res.render('admin/dashboard', { 
                juries,
                topPerformers: {}, 
                groupPoints: {}, 
                topPerformersByGroup: [] 
            });
        }

        // If results exist, pass them directly to the view without using map()
        const { topPerformers, groupPoints, topPerformersByGroup } = results;

        // Render the admin dashboard with juries and results data
        res.render('admin/dashboard', { 
            juries,
            topPerformers: topPerformers || {},
            groupPoints: groupPoints || {},
            topPerformersByGroup: topPerformersByGroup || [] 
        });

    } catch (error) {
        console.error('Error fetching juries or results:', error);
        res.status(500).send('Error fetching data');
    }
};



exports.renderAddItemsPage = (req, res) => {
    res.render('admin/add-items');
};
exports.renderContestants = (req, res) => {
    res.render('admin/contestants');
};




// Upload contestant details

exports.uploadContestant = async (req, res) => {
    try {
        const { contestantNumber, name, groupName } = req.body;

        // Creating new contestant with the provided details and the generated contestant number
        const newContestant = new Contestant({
            contestantNumber,
            name,
            groupName,
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

exports.deleteContestant = async (req, res) => {
    const contestantId = req.params.id;
    try {
        // console.log('called');
        // const contestantId = req.params.id;

        // Delete the contestant by ID
        await Contestant.findByIdAndDelete(contestantId);

        console.log(`Contestant with ID ${contestantId} deleted successfully`);
        res.redirect('/admin/contestants');
    } catch (error) {
        console.error('Error deleting contestant:', error.message);
        res.status(500).send(`Error deleting contestant: ${error.message}`);
    }
}


// Save the new item to the database
// exports.createItem = async (req, res) => {
//     try {
//         const { name, category, type, stage} = req.body;
//         const newItem = new Item({ name, category, type, stage });
//         await newItem.save();
//         res.json({ success: true });
//     } catch (error) {
//         console.log('Error Adding Item:', error);
//         res.json({ success: false });
//     }
// };


// Save the new item to the database
exports.createItem = async (req, res) => {
    try {
        const { name, category, type, stage } = req.body;

        // Check if an item with the same name and category (case-insensitive) already exists
        const existingItem = await Item.findOne({
            name: name.toLowerCase(),
            category: category.toLowerCase()
        });

        if (existingItem) {
            // Item with the same name and category already exists
            return res.json({ success: false, message: 'Item with this name already exists in the selected category.' });
        }

        // Create and save the new item
        const newItem = new Item({
            name: name.toLowerCase(),
            category: category.toLowerCase(),
            type,
            stage
        });

        await newItem.save();
        res.json({ success: true, message: 'Item added successfully!' });
    } catch (error) {
        console.error('Error Adding Item:', error);
        res.json({ success: false, message: 'An error occurred while adding the item.' });
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


// Fetch and display filtered items along with juries
exports.getFilteredItems = async (req, res) => {
    try {
        // Extract filter criteria from query parameters
        const { category, type, stage } = req.query;

        // Create a filter object
        let filter = {};

        // Add filter conditions based on query parameters if provided
        if (category) filter.category = category;
        if (type) filter.type = type;
        if (stage) filter.stage = stage;

        // Fetch items from the database based on the filter
        const itemsFromDb = await Item.find(filter);
        const items = itemsFromDb.map(item => item.toObject());

        // Log the items to check their structure
        console.log('Filtered Items:', items);

        // Fetch juries from the database
        const juriesFromDb = await Jury.find();
        const juries = juriesFromDb.map(jury => jury.toObject());

        // Render items with filtered results and juries
        res.render('admin/items', { items, juries });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ success: false, message: 'Error fetching items' });
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


// View item page with populated participants
exports.viewItemPage = async (req, res) => {
    const itemId = req.params.id;

    try {
        // Find the item by ID and populate participants with their necessary details
        const item = await Item.findById(itemId)
            .populate({
                path: 'participants',
                select: 'name contestantNumber',  // Select necessary fields 
            }).lean(); // Convert to plain JavaScript object for easy manipulation

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Fetch grouped scores for this item from GroupedScores collection
        const groupedScore = await GroupedScores.findOne({ itemId }).lean();

        // If scores exist, map them to the participants
        const participantScores = item.participants.map(participant => {
            const scoreEntry = groupedScore
                ? groupedScore.scores.find(s => s.contestantId.toString() === participant._id.toString())
                : null;

            return {
                id: participant._id,
                name: participant.name,
                contestantNumber: participant.contestantNumber,
                score: scoreEntry ? scoreEntry.score : null, // If score exists, add it
                badge: scoreEntry ? scoreEntry.badge : null  // If badge exists, add it
            };
        });

        // Debugging output to check data
        console.log('Participant Scores:', participantScores);

        // Render the view and pass participant data along with scores and badges
        res.render('admin/manageItem', { item, itemId: item._id.toString(), participantScores });
    } catch (error) {
        console.error('Error fetching item and participants:', error);
        res.status(500).json({ success: false, message: 'Error fetching item details' });
    }
};


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

exports.deleteContestantFromItem = async (req, res) => {
    const { itemId, contestantId } = req.params;

    try {
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Check if contestant exists in the participants array
        const index = item.participants.indexOf(contestantId);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Contestant not found in this item' });
        }

        // Remove the contestant from participants array
        item.participants.splice(index, 1);
        await item.save();

        res.json({ success: true, message: 'Contestant removed successfully' });
    } catch (error) {
        console.error('Error deleting contestant from item:', error);
        res.status(500).json({ success: false, message: 'Error deleting contestant from item' });
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


exports.deleteJury = async (req, res) => {
    try {
        const juryId = req.params.id;

        // Delete the jury from the database by ID
        await Jury.findByIdAndDelete(juryId);

        // After deletion, fetch the updated list of juries
        const juries = await Jury.find();
        const juriesPlain = juries.map(jury => jury.toObject());

        // Render the view with updated list of juries
        res.render('admin/view-juries', { juries: juriesPlain });
    } catch (error) {
        console.error('Error deleting jury:', error);
        res.status(500).send('Error deleting jury');
    }
};


exports.deleteItem = async (req, res) => {
    const itemId = req.params.id;

    try {
        // Delete the item
        const item = await Item.findByIdAndDelete(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Delete the item from other collections by item ID directly
        await Promise.all([
            PublicResults.deleteOne({ itemId }),
            Points.deleteOne({ itemId }),
            GroupedScores.deleteOne({ itemId })
        ]);

        res.json({ success: true, message: 'Item and related data deleted successfully' });
    } catch (error) {
        console.error('Error deleting item and related data:', error);
        res.status(500).json({ success: false, message: 'Error deleting item and related data' });
    }
};

// // Route to handle saving custom points
// exports.saveCustomPoints = async (req, res) => {
//     try {
//         const customPointsData = req.body.customPointsData;

//         for (const entry of customPointsData) {
//             const itemId = mongoose.Types.ObjectId(entry.itemId); // Cast to ObjectId
//             const points = entry.points;

//             // Save to the results collection
//             await Result.findOneAndUpdate(
//                 { itemId: itemId },
//                 { points: points },
//                 { upsert: true, new: true }
//             );
//         }

//         res.status(200).json({ message: 'Custom points saved successfully' });
//     } catch (error) {
//         console.error('Error saving custom points:', error);
//         res.status(500).json({ error: 'Error saving custom points' });
//     }
// };

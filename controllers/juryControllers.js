const Contestant = require('../models/Contestant');
const Item = require('../models/item');
const Jury = require('../models/Jury');
const GroupedScores = require('../models/GroupedScores');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

exports.renderLoginPage = (req, res) => {
    res.render('jury/login');
};

// login jury
exports.loginJury = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the jury by username
        const jury = await Jury.findOne({ username });
        if (!jury) {
            return res.status(400).send('Invalid username or password');
        }

        // Validate the password
        const isMatch = await bcrypt.compare(password, jury.password);
        if (!isMatch) {
            return res.status(400).send('Invalid username or password');
        }

        // Set session or token (using session in this case)
        req.session.juryId = jury._id;
        req.session.juryUsername = jury.username;

        // Redirect to the jury panel
        res.redirect(`/jury/panel/${jury._id}`);
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Error logging in');
    }
};



// exports.renderJuryPanel = async (req, res) => {
//     try {
//         const juryId = req.params.id;

//         // Find the jury by ID and populate assigned items with participants
//         const jury = await Jury.findById(juryId).populate({
//             path: 'assignedItems',
//             populate: {
//                 path: 'participants', // Assuming participants field exists in the Item model
//                 select: 'name contestantNumber scores badge' // Select the fields you want
//             }
//         }).lean(); // Use lean() to get a plain JavaScript object

//         if (!jury) {
//             return res.status(404).send('Jury not found');
//         }

//         // Restructure participants to directly include scores for easier rendering
//         jury.assignedItems.forEach(item => {
//             item.participants.forEach(participant => {
//                 participant.score = participant.scores.find(score => score.itemId.toString() === item._id.toString())?.score || null;
//             });
//         });

//         // Render the jury panel and pass the jury's information
//         res.render('jury/panel', { jury });
//     } catch (error) {
//         console.error('Error rendering jury panel:', error);
//         res.status(500).send('Error rendering jury panel');
//     }
// };


// exports.renderJuryPanel = async (req, res) => {
//     try {
//         const juryId = req.params.id;

//         // Fetch the jury and populate assigned items with participants
//         const jury = await Jury.findById(juryId).populate({
//             path: 'assignedItems',
//             populate: {
//                 path: 'participants',
//                 select: 'name groupName contestantNumber scores badge' // Only fetch necessary fields
//             }
//         }).lean(); // Use lean() to return plain JavaScript objects

//         if (!jury) {
//             return res.status(404).send('Jury not found');
//         }
        

//         // Iterate through the jury's assigned items to structure the data
//         jury.assignedItems.forEach(item => {
//             item.participants.forEach(participant => {
//                 // Directly access item details from the item
//                 participant.itemName = item.name;         // Name of the item
//                 participant.itemCategory = item.category; // Category of the item
//                 participant.itemType = item.type;         // Type of the item

//                 console.log(`Participant: ${participant.name}, Item: ${participant.itemName}, Category: ${participant.itemCategory}, Type: ${participant.itemType}`);
//             });
//         });

//         // Render the jury panel view and pass the structured data
//         res.render('jury/panel', { jury });
//     } catch (error) {
//         console.error('Error rendering jury panel:', error);
//         res.status(500).send('Error rendering jury panel');
//     }
// };
exports.renderJuryPanel = async (req, res) => { 
    try {
        const juryId = req.params.id;

        // Fetch the jury and populate assigned items with participants
        const jury = await Jury.findById(juryId).populate({
            path: 'assignedItems',
            populate: {
                path: 'participants',
                select: 'name groupName contestantNumber' // Fetch necessary fields
            }
        }).lean(); // Use lean() to return plain JavaScript objects

        if (!jury) {
            return res.status(404).send('Jury not found');
        }
        
        // Fetch grouped scores for the jury's assigned items
        const itemIds = jury.assignedItems.map(item => item._id); // Extract item IDs
        const groupedScores = await GroupedScores.find({ itemId: { $in: itemIds } }).lean(); // Fetch scores for those items

        // Create a mapping of itemId to its scores for easy access
        const scoresMap = groupedScores.reduce((acc, score) => {
            acc[score.itemId] = score.scores; // Map itemId to scores
            return acc;
        }, {});

        // Iterate through the jury's assigned items to structure the data
        jury.assignedItems.forEach(item => {
            item.participants.forEach(participant => {
                // Directly access item details from the item
                participant.itemName = item.name;         // Name of the item
                participant.itemCategory = item.category; // Category of the item
                participant.itemType = item.type;         // Type of the item

                // Add scores and badges for the participant if they exist
                const participantScores = scoresMap[item._id];
                if (participantScores) {
                    const participantScore = participantScores.find(score => score.contestantId.equals(participant._id));
                    if (participantScore) {
                        participant.score = participantScore.score; // Add the score
                        participant.badge = participantScore.badge; // Add the badge
                    } else {
                        participant.score = 0; // Default score if not found
                        participant.badge = null; // No badge if not found
                    }
                } else {
                    participant.score = 0; // Default score if no scores exist
                    participant.badge = null; // No badge if no scores exist
                }

                console.log(`Participant: ${participant.name}, Item: ${participant.itemName}, Category: ${participant.itemCategory}, Type: ${participant.itemType}, Score: ${participant.score}, Badge: ${participant.badge}`);
            });
        });

        // Render the jury panel view and pass the structured data
        res.render('jury/panel', { jury });
    } catch (error) {
        console.error('Error rendering jury panel:', error);
        res.status(500).send('Error rendering jury panel');
    }
};



// exports.renderJuryPanel = async (req, res) => {
//     try {
//         const juryId = req.params.id;
//         // Find the jury by ID and populate assigned items with participants
//         const jury = await Jury.findById(juryId).populate({
//             path: 'assignedItems',
//             populate: {
//                 path: 'participants', // Assuming participants field exists in the Item model
//                 select: 'name contestantNumber score badge' // Select the fields you want
//             }
//         }).lean(); // Use lean() to get a plain JavaScript object

//         if (!jury) {
//             return res.status(404).send('Jury not found');
//         }

//         // res.json(jury); // Return the jury details

//         // Render the jury panel and pass the jury's information
//         res.render('jury/panel', { jury });
//     } catch (error) {
//         console.error('Error rendering jury panel:', error);
//         res.status(500).send('Error rendering jury panel');
//     }
// };

// Controller to handle saving scores

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

//             // Proceed with finding and updating the contestant
//             const contestant = await Contestant.findById(contestantId);
//             if (!contestant) {
//                 console.error(`Contestant not found: ${contestantId}`);
//                 continue; // Skip if contestant not found
//             }

//             // Check for existing score entry
//             const existingScoreIndex = contestant.scores.findIndex(s => s.itemId.toString() === itemId.toString());

//             // Update or push new score
//             if (existingScoreIndex >= 0) {
//                 contestant.scores[existingScoreIndex].score = parsedScore;
//             } else {
//                 contestant.scores.push({ itemId, score: parsedScore });
//             }

//             try {
//                 await contestant.save();
//                 console.log(`Scores updated for contestant: ${contestantId}`);
//             } catch (saveError) {
//                 console.error('Error saving contestant:', saveError);
//                 return res.status(500).json({ success: false, message: 'Failed to save scores', error: saveError.message });
//             }
//         }


//         res.status(200).json({ success: true, message: 'Scores updated successfully' });
//     } catch (error) {
//         console.error('Error updating scores:', error);
//         res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
//     }
// };



// Save Scores Function
// Save Scores Function
exports.saveScores = async (req, res) => {
    try {
        const { scores } = req.body;

        // Validate input data
        if (!scores || !Array.isArray(scores)) {
            return res.status(400).json({ success: false, message: 'Invalid data format' });
        }

        // Process each score entry
        for (const entry of scores) {
            const { contestantId, itemId, itemType, itemCategory, groupName, score, badge } = entry;

            // Ensure all required fields are present
            if (!contestantId || !itemId || !itemType || !itemCategory || !groupName || score === undefined || score === null) {
                console.warn('Missing fields in entry:', entry);
                continue; // Skip invalid entries
            }

            // Parse the score to an integer
            const parsedScore = parseInt(score, 10);
            if (isNaN(parsedScore)) {
                console.warn('Score parsing failed:', score);
                continue;
            }

            // Check if the grouped score for this item already exists
            let groupedScore = await GroupedScores.findOne({ itemId });

            if (!groupedScore) {
                // If not, create a new grouped score entry for this item
                groupedScore = new GroupedScores({
                    itemId,
                    itemType,
                    itemCategory,
                    scores: [] // Initialize an empty scores array
                });
            }

            // Find if this contestant already has a score for this item
            const existingScore = groupedScore.scores.find(s => s.contestantId.toString() === contestantId.toString());

            if (existingScore) {
                // If the contestant already has a score, update it
                existingScore.score = parsedScore;
                existingScore.group = groupName; // Update groupName if needed
                existingScore.badge = badge; // Update badge if provided
                existingScore.updatedAt = new Date(); // Track when the score was updated
                console.log(`Score updated for contestant: ${contestantId} for item: ${itemId}`);
            } else {
                // If no score exists for this contestant, add a new entry
                groupedScore.scores.push({
                    contestantId,
                    group: groupName, // Use groupName instead of group
                    score: parsedScore,
                    badge,
                    createdAt: new Date() // Track when the score was saved
                });
                console.log(`New score added for contestant: ${contestantId} for item: ${itemId}`);
            }

            // Save the grouped score document
            await groupedScore.save();
        }

        // After saving scores, handle badge assignment
        const itemIds = [...new Set(scores.map(score => score.itemId))]; // Get unique item IDs

        for (const itemId of itemIds) {
            // Fetch all contestants for this item who have a score greater than 0
            let groupedScore = await GroupedScores.findOne({ itemId }).populate('scores.contestantId');

            // If groupedScore does not exist, skip badge assignment
            if (!groupedScore || !groupedScore.scores) {
                console.warn(`No scores found for itemId: ${itemId}`);
                continue;
            }

            // Filter out contestants with zero or no score
            let validScores = groupedScore.scores.filter(scoreEntry => scoreEntry.score > 0);

            if (validScores.length === 0) {
                console.warn(`No valid scores to assign badges for itemId: ${itemId}`);
                continue; // No valid scores, skip badge assignment
            }

            // Sort the remaining contestants by score in descending order
            validScores.sort((a, b) => b.score - a.score); // Sort by score descending

            // Assign badges to top three contestants
            for (let i = 0; i < validScores.length; i++) {
                const badge = i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : null;

                validScores[i].badge = badge;

                if (badge) {
                    console.log(`Assigned '${badge}' badge to: ${validScores[i].contestantId.name}`);
                }
            }

            // Reset badges for contestants beyond the top 3, or those who had zero or no score
            for (let i = 3; i < validScores.length; i++) {
                validScores[i].badge = null;
                console.log(`Reset badge for: ${validScores[i].contestantId.name}`);
            }

            // Save the updated grouped scores with badges
            await groupedScore.save();
        }

        res.status(200).json({ success: true, message: 'Scores updated successfully, badges assigned' });
    } catch (error) {
        console.error('Error updating scores:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};



// Save Scores Function
// exports.saveScores = async (req, res) => {
//     try {
//         const { scores } = req.body;

//         // Validate input data
//         if (!scores || !Array.isArray(scores)) {
//             return res.status(400).json({ success: false, message: 'Invalid data format' });
//         }

//         // Process each score entry
//         for (const entry of scores) {
//             const { contestantId, itemId, itemType, itemCategory, score, badge } = entry;

//             // Ensure all required fields are present
//             if (!contestantId || !itemId || !itemType || !itemCategory || score === undefined || score === null) {
//                 console.warn('Missing fields in entry:', entry);
//                 continue; // Skip invalid entries
//             }

//             // Parse the score to an integer
//             const parsedScore = parseInt(score, 10);
//             if (isNaN(parsedScore)) {
//                 console.warn('Score parsing failed:', score);
//                 continue;
//             }

//             // Define the new score document
//             const scoreDocument = {
//                 contestantId,
//                 itemId,
//                 itemType,
//                 itemCategory,
//                 score: parsedScore,
//                 badge,
//                 createdAt: new Date() // Optional: Track when the score was saved
//             };

//             // Save the score in the Scores collection
//             await Scores.create(scoreDocument);
//             console.log(`Scores saved for contestant: ${contestantId} for item: ${itemId}`);
//         }

//         // After saving scores, handle badge assignment
//         const itemIds = [...new Set(scores.map(score => score.itemId))]; // Get unique item IDs

//         for (const itemId of itemIds) {
//             // Fetch all contestants for this item who have a score greater than 0
//             const contestantScores = await Scores.find({
//                 itemId,
//                 score: { $gt: 0 }
//             }).populate('contestantId'); // Assuming you want to populate contestant details

//             // Sort the contestants by score in descending order
//             contestantScores.sort((a, b) => b.score - a.score); // Sort by score descending

//             // Assign badges to top three contestants
//             for (let i = 0; i < contestantScores.length; i++) {
//                 const badge = i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : null;

//                 if (badge) {
//                     await Contestant.findByIdAndUpdate(contestantScores[i].contestantId, { badge });
//                     console.log(`Assigned '${badge}' badge to: ${contestantScores[i].contestantId.name}`);
//                 } else {
//                     // Clear badge for any contestant beyond the top 3
//                     await Contestant.findByIdAndUpdate(contestantScores[i].contestantId, { badge: null });
//                     console.log(`Reset badge for: ${contestantScores[i].contestantId.name}`);
//                 }
//             }
//         }

//         res.status(200).json({ success: true, message: 'Scores updated successfully, badges assigned' });
//     } catch (error) {
//         console.error('Error updating scores:', error);
//         res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
//     }
// };



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


// exports.saveScores = async (req, res) => {
//     try {
//         const { contestants } = req.body;

//         if (!contestants || !Array.isArray(contestants)) {
//             return res.status(400).json({ success: false, message: 'Invalid data format' });
//         }

//         // Loop through each contestant and update the score
//         for (const contestant of contestants) {
//             const { id, score } = contestant;

//             if (!id || score === undefined || score === null || isNaN(score)) {
//                 continue; // Skip if no ID or score is invalid
//             }

//             // Parse the score to an integer
//             const parsedScore = parseInt(score, 10);

//             if (isNaN(parsedScore)) {
//                 continue; // Skip if score parsing fails
//             }

//             // Find the contestant by ID and update the score
//             await Contestant.findByIdAndUpdate(id, { score: parsedScore });
//         }

//         // Retrieve all contestants and sort them by score in descending order
//         const allContestants = await Contestant.find().sort({ score: -1 });

//         // Assign badges for the top three contestants
//         if (allContestants.length > 0) {
//             await Contestant.findByIdAndUpdate(allContestants[0]._id, { badge: 'first' });
//             console.log(`Assigned 'first' badge to: ${allContestants[0].name}`);
//         }
//         if (allContestants.length > 1) {
//             await Contestant.findByIdAndUpdate(allContestants[1]._id, { badge: 'second' });
//             console.log(`Assigned 'second' badge to: ${allContestants[1].name}`);
//         }
//         if (allContestants.length > 2) {
//             await Contestant.findByIdAndUpdate(allContestants[2]._id, { badge: 'third' });
//             console.log(`Assigned 'third' badge to: ${allContestants[2].name}`);
//         }

//         // Reset badges for other contestants
//         for (let i = 3; i < allContestants.length; i++) {
//             await Contestant.findByIdAndUpdate(allContestants[i]._id, { badge: null });
//         }

//         res.status(200).json({ success: true, message: 'Scores and badges updated successfully' });
//     } catch (error) {
//         console.error('Error updating scores and badges:', error);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };





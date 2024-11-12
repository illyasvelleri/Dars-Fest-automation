const calculateGroupTotalPoints = async () => {
    try {
        // Fetch all Points documents
        const allPoints = await Points.find().populate('contestants.contestantId');

        // Create an object to store total points for each group
        const groupPoints = {};

        allPoints.forEach(pointsDoc => {
            pointsDoc.contestants.forEach(contestant => {
                const groupName = contestant.contestantId.groupName; // Assuming each contestant has a `groupName`
                
                if (!groupPoints[groupName]) {
                    groupPoints[groupName] = 0;  // Initialize group if not present
                }

                // Add contestant's points to the group's total
                groupPoints[groupName] += contestant.points;
            });
        });

        // Display or return the group points
        console.log('Total Points for Each Group:', groupPoints);
        return groupPoints;
    } catch (error) {
        console.error('Error calculating group total points:', error);
    }
};



// const findTopContestantsInEachCategory = async () => {
//     try {
//         // Fetch all Points documents
//         const allPoints = await Points.find().populate('contestants.contestantId');

//         // Create an object to store total points for each contestant
//         const contestantPoints = {};

//         allPoints.forEach(pointsDoc => {
//             pointsDoc.contestants.forEach(contestant => {
//                 const contestantId = contestant.contestantId._id.toString();
                
//                 // Initialize the contestant in the map if not already present
//                 if (!contestantPoints[contestantId]) {
//                     contestantPoints[contestantId] = {
//                         totalPoints: 0,
//                         contestant: contestant.contestantId,  // Store contestant details
//                         category: pointsDoc.category,          // Store contestant's category
//                     };
//                 }

//                 // Add points to the contestant's total
//                 contestantPoints[contestantId].totalPoints += contestant.points;
//             });
//         });

//         // Find the top performer in each category
//         const topPerformers = {
//             'sub junior': null,
//             'junior': null,
//             'senior': null,
//         };

//         Object.values(contestantPoints).forEach(entry => {
//             const category = entry.category;

//             // Check if the contestant belongs to a valid category
//             if (['sub junior', 'junior', 'senior'].includes(category)) {
//                 if (!topPerformers[category] || entry.totalPoints > topPerformers[category].totalPoints) {
//                     topPerformers[category] = entry;
//                 }
//             }
//         });

//         // Display or return the top performers
//         console.log('Top Contestants in Each Category:', topPerformers);
//         return topPerformers;
//     } catch (error) {
//         console.error('Error finding top contestants:', error);
//     }
// };

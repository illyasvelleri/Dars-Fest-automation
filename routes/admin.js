var express = require('express');
var router = express.Router();
var adminController = require('../controllers/adminControllers');
const { route } = require('./jury');

/* GET users listing. */
router.get('/', adminController.adminDashboard);
// router.get('/', function(req, res, next) {
//   res.render('admin/dashboard');
// });
router.post('/contestants/upload', adminController.uploadContestant);


router.post('admin/contestants',adminController.renderContestants);

router.get('/contestants', adminController.getContestants);

// Route to display the admin add-items page
router.get('/items/add', adminController.renderAddItemsPage);

// Route to add a new item
router.post('/items/add', adminController.createItem);

// Route to display all items
router.get('/items', adminController.getItems);

router.get('/items/:id', adminController.viewItemPage);

//searches for contestants
router.get('/contestants/search', adminController.searchContestants);

// Add contestant to item route
router.post('/items/add-contestant', adminController.addContestantToItem);

router.get('/create-jury', adminController.renderJuryCreation);

// Create a new jury
router.post('/create', adminController.createJury);

router.post('/view-juries', adminController.viewAllJuries);

router.get('/view-juries', adminController.viewAllJuries);

router.post('/assign-jury-to-item', adminController.assignJuryToItem);

router.post('/save-custom-points', adminController.saveCustomPoints);

module.exports = router;

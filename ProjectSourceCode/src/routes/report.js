const express = require('express');
const router = express.Router();
const db = require('../config/database');
const isAuthenticated = require('../middleware/auth');

const parking_services_lifespan = '8 hour'; //how long a "parking services" report should remain in the database before being deleted
const lot_full_lifespan = '1 hour'; //how long a "lot full" report should remain in the database before being deleted
const max_per_user = 3; //maximum reports that one user can have

async function cleanupReports() {
    console.log("cleaning database");

    //const deleted1 = await db.query('SELECT * FROM reports WHERE (time < (NOW()-INTERVAL $1)) AND report_type = \'Parking Services\'', [parking_services_lifespan]);
    await db.none('DELETE FROM reports WHERE (time < (NOW()-INTERVAL $1)) AND report_type = \'Parking Services\'', [parking_services_lifespan]);

    /* remove comments to enable logging of cleaned up reports
    console.log(`deleted:`);
    console.log(deleted1);
    console.log(deleted2);
    */
}

router.post('/create', isAuthenticated, async (req, res) => {
    

    try {

        await cleanupReports();

        const userId = req.session.user.id;

        const db_result = await db.query('SELECT COUNT(*) AS num_reports FROM reports WHERE user_id = $1;', [userId]);

        let success_message = 'Report submitted successfully'

        const num_reports = db_result[0].num_reports;

        //delete oldest report if user has exceeded limit
        if(num_reports >= max_per_user) {
            await db.none('DELETE FROM reports WHERE time = (SELECT MIN(time) FROM reports WHERE user_id = $1);', [userId]);
            success_message = 'Report submitted - oldest report removed'
        }


        const {ID, reportType, details } = req.body;

        await db.none('INSERT INTO reports (user_id, lot_num, report_type, details, time) VALUES ($1, $2, $3, $4, NOW())', [userId, ID, reportType, details]);
        res.status(200).json({ message: success_message });

    } catch (err) {
        console.error('Error submitting report:', err);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

router.get('/update', async (req, res) => {

    const lot_id = req.query.lotId;

    try {
    const reports = await db.query('SELECT * FROM reports WHERE lot_num = $1', [lot_id]);

    res.json({reports : reports});

    } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get current session' });
    }
})




module.exports = router;
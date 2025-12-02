const express = require('express');
const router = express.Router();
const db = require('../config/database');
const isAuthenticated = require('../middleware/auth');

const parking_services_lifespan = '8 hour'; //how long a "parking services" report should remain in the database before being deleted
const lot_full_lifespan = '1 hour'; //how long a "lot full" report should remain in the database before being deleted

router.post('/create', isAuthenticated, async (req, res) => {
    
    console.log("ding dong");

    try {

        await cleanupReports();

        const userId = req.session.user.id;

        const db_result = await db.query('SELECT COUNT(*) AS num_reports FROM reports WHERE user_id = $1;', [userId]);

        let success_message = 'Report submitted successfully'

        //console.log(test);

        //console.log(test[0].num_reports);

        const num_reports = db_result[0].num_reports;

        if(num_reports > 3) {
            console.log('lotta reports')
            await db.none('DELETE FROM reports WHERE time = (SELECT MIN(time) FROM reports WHERE user_id = $1);', [userId]);
            success_message = 'Report submitted - oldest report removed'
        } else {
            console.log('notta lotta reports')
        }



        const {ID, reportType, details } = req.body;

        await db.none('INSERT INTO reports (user_id, lot_num, report_type, details, time) VALUES ($1, $2, $3, $4, NOW())', [userId, ID, reportType, details]);

        res.status(200).json({ message: success_message });
    } catch (err) {
        console.error('Error submitting report:', err);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});


async function cleanupReports() {
    console.log("cleaning database");

    const db_result1 = await db.query('SELECT * FROM reports WHERE (time < (NOW()-INTERVAL $1)) AND report_type = \'Parking Services\'', [parking_services_lifespan])
    await db.none('DELETE FROM reports WHERE (time < (NOW()-INTERVAL $1)) AND report_type = \'Parking Services\'', [parking_services_lifespan])
    console.log(db_result1)

    const db_result2 = await db.query('SELECT * FROM reports WHERE (time < (NOW()-INTERVAL $1)) AND report_type = \'Parking Lot Full\'', [lot_full_lifespan])
    console.log(db_result2)
    await db.none('DELETE FROM reports WHERE (time < (NOW()-INTERVAL $1)) AND report_type = \'Parking Services\'', [parking_services_lifespan])
    
    
}

module.exports = router;
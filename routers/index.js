const query = require('../lib/query');
const { check, validationResult } = require('express-validator/check');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    let rows = await query.getSentenceByMagnitude(2);
    let count = await query.getVoteCount()

    res.render('sentence', {
        sentences: rows,
        token: req.csrfToken(),
        count: count
    });
});

router.post('/vote', [
        check('sentenceId').isInt(),
        check('sentenceIndex').isInt(),
        check('note').isInt({ min: -1, max: 1 })
    ], (req, res) => {
        const errors = validationResult(req);

        let row = query.getSentenceByMagnitude(1);
        res.send(row);

        if (errors.isEmpty()) {
            query.insertVote(req.body.sentenceId, req.body.sentenceIndex, req.body.note);
        }
});

module.exports = router;
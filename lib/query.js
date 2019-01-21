var Pool = require('pg-pool')
const config = require('../config/default');

const minMagnitude = 50;
const maxVoteCount = 5;
const activeSentenceCount = 500;
var activeSentences = new Array(activeSentenceCount);
var sentencesMagitude;

const pool = new Pool({
    user        : config.database.USERNAME,
    password    : config.database.PASSWORD,
    database    : config.database.DATABASE,
    host        : config.database.HOST,
    port        : 5432
});

function getAleatoryNumber(min, max){
    return Math.floor((Math.random()*max) + min)
};

function loadTable() {
    let selectJoin =    
                `
                (SELECT Sentence,sentences.Id as sentenceid, Count 
                    FROM sentences tablesample system_rows(10000) LEFT JOIN 
                        (SELECT SentenceID, count(*) AS Count FROM sentiment 
                        GROUP BY sentiment.SentenceID) 
                        AS sentence_per_vote
                    ON sentences.Id = sentence_per_vote.SentenceID 
                    WHERE Count IS NULL OR Count < ${maxVoteCount})
                `;

    return new Promise((resolve) => {
        pool.query(selectJoin, (err, result) => {
            if (err) reject(err);  
            else { 
                sentencesMagitude = result.rows;
                loadActiveSentences();
                resolve(null);
            }
        });
    });
}

function loadActiveSentences(){
    activeSentences = [];
    for(let i=0; i < activeSentenceCount; i++){
        let sentence = sentencesMagitude.pop();
        sentence.Index = i;
        sentence.Count = (sentence.Count == null) ? 0 : sentence.Count
        activeSentences[i] = sentence;
    }
}

function newActiveSentence(index){
    delete activeSentences[index]

    let sentence = sentencesMagitude.pop();
    sentence.Index = index;
    sentence.Count = (sentence.Count == null) ? 0 : sentence.Count
    activeSentences[index] = sentence;
}

function getSentenceByMagnitude(quant){
    let aleatoryRow = [];
    for(let i = 0; i < quant; i++){
        aleatoryIndex = getAleatoryNumber(0, activeSentences.length);
        aleatoryRow.push(activeSentences[aleatoryIndex]);
    }
    return aleatoryRow;
}


function getVoteCount(){
    let groupBy = 'SELECT sentiment, COUNT(*) AS count FROM sentiment GROUP BY sentiment'
    let count = { total: 0, negative: 0, neutral: 0, positive: 0 };

    return new Promise((resolve, reject) => {
        pool.query(groupBy, (err, result, fields) => {
            result.rows.forEach((value) => {
                switch(value.sentiment){
                    case 1:
                        count.positive = parseInt(value.count); 
                        break;
                    case 0:
                        count.neutral = parseInt(value.count);
                        break;
                    case -1:
                        count.negative = parseInt(value.count);
                        break;
                }
            });
            count.total = count.positive + count.negative + count.neutral;

            resolve(count);
        })
    })
}

function insertVote(id, index, note) {
    if( activeSentences[index].SentenceId == id && 
        activeSentences[index].Count++ >= maxVoteCount) {
        newActiveSentence(index);
    }

    let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let insertQuery = `INSERT INTO sentiment(sentenceid,sentiment,createdat) VALUES (${id}, ${note}, '${date}')`;
    
    pool.query(insertQuery, (err, result, fields) => {
        if (err) throw err;
    });
}

module.exports = {
    loadTable,
    getSentenceByMagnitude,
    getVoteCount,
    insertVote
}
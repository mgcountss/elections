import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import fetch from 'node-fetch';
const app = express();
app.use(cors());

let totalData;
let senateData = JSON.parse(fs.readFileSync('./senate.json'));
let houseData;
let governorData;
let closedRaces = [];
let events = [
    'All polls are open!'
];
total();
senate();
//house();
//governor();
setInterval(total, 10000);
setInterval(senate, 30000);
//setInterval(house, 30000);
//setInterval(governor, 30000);

async function total() {
    try {
        const response = await fetch('https://feeds-elections.foxnews.com/archive/politics/elections/2022/3/2022_Generals/Congress/balance_of_power/file.json');
        const json = await response.json();
        let senate = []
        senate[0] = json.senate.partyResults[0].count + json.senate.startValues.D
        senate[1] = 100 - ((json.senate.partyResults[0].count + json.senate.startValues.D) + (json.senate.partyResults[1].count + json.senate.startValues.R))
        senate[2] = json.senate.partyResults[1].count + json.senate.startValues.R
        let house = []
        house[0] = json.house.partyResults[0].count + json.house.startValues.D
        house[1] = 100 - ((json.house.partyResults[0].count + json.house.startValues.D) + (json.house.partyResults[1].count + json.house.startValues.R))
        house[2] = json.house.partyResults[1].count + json.house.startValues.R
        totalData = {
            senate: senate,
            house: house
        }
    } catch (error) {
        console.error('Error fetching total data:', error);
    }
}

async function senate() {
    try {
        const response = await fetch('https://feeds-elections.foxnews.com/archive/politics/elections/2020/3/2020_Generals/President/national_summary_results/file.json');
        let json = await response.json();
        let all = [];
        json = json.stateResults.sort((a, b) => (a.stateCode > b.stateCode) ? 1 : -1);
        for (let q = 0; q < json.length; q++) {
            json[q].results = json[q].results.sort((a, b) => b.votes.count - a.votes.count);
            all.push(json[q]);
        }
        for (let i = 0; i < all.length; i++) {
            for (let q = 0; q < all[i].results.length; q++) {
                if (all[i].results[q].isWinner == true && senateData[i].results[q].isWinner == false) {
                    events.push(all[i].stateCode + ": " + all[i].results[q].candidate.firstName + " " + all[i].results[q].candidate.lastName + " won the senate race.")
                }
            }
        }
        senateData = all;
        senateClose();
    } catch (error) {
        console.error('Error fetching senate data:', error);
    }
}

async function senateClose() {
    try {
        const response = await fetch('https://feeds-elections.foxnews.com/archive/politics/elections/2022/3/2022_Generals/liveUpdates/S/file.json');
        const json = await response.json();
        for (let q = 0; q < json.length; q++) {
            if (json[q].race_id == null) {
                for (let w = 0; w < json[q].states.length; w++) {
                    for (let i = 0; i < senateData.length; i++) {
                        if (senateData[i].stateCode == json[q].states[w]) {
                            senateData[i].close = json[q].poll_close;
                        }
                    }
                }
            }
        }
        for (let i = 0; i < senateData.length; i++) {
            if (new Date(senateData[i].close) < new Date()) {
                if (closedRaces.includes(senateData[i].stateCode + ": Senate race has closed.") == false) {
                    events.push(senateData[i].stateCode + ": Senate race polls has closed.")
                    closedRaces.push(senateData[i].stateCode + ": Senate polls race has closed.")
                }
            }
        }
    } catch (error) {
        console.error('Error fetching senate close data:', error);
    }
}

async function house() {
    try {
        const response = await fetch('https://feeds-elections.foxnews.com/archive/politics/elections/2022/3/2022_Generals/House/national_level_summary/file.json');
        let json = await response.json();
        let all = [];
        json = json.sort((a, b) => (a.stateCode > b.stateCode) ? 1 : -1);
        for (let q = 0; q < json.length; q++) {
            json[q].results = json[q].results.sort((a, b) => b.votes.count - a.votes.count);
            all.push(json[q]);
        }
        for (let i = 0; i < all.length; i++) {
            for (let q = 0; q < all[i].results.length; q++) {
                if (all[i].results[q].isWinner == true && houseData[i].results[q].isWinner == false) {
                    events.push(all[i].stateCode + ": " + all[i].results[q].candidate.firstName + " " + all[i].results[q].candidate.lastName + " won the house race.")
                }
            }
        }
        houseData = all;
        houseClose();
    } catch (error) {
        console.error('Error fetching house data:', error);
    }
}

async function houseClose() {
    try {
        const response = await fetch('https://feeds-elections.foxnews.com/archive/politics/elections/2022/3/2022_Generals/liveUpdates/H/file.json');
        const json = await response.json();
        for (let q = 0; q < json.length; q++) {
            if (json[q].race_id == null) {
                for (let w = 0; w < json[q].states.length; w++) {
                    for (let i = 0; i < houseData.length; i++) {
                        if (houseData[i].stateCode == json[q].states[w]) {
                            houseData[i].close = json[q].poll_close;
                        }
                    }
                }
            }
        }
        for (let i = 0; i < houseData.length; i++) {
            if (new Date(houseData[i].close) < new Date()) {
                if (closedRaces.includes(houseData[i].stateCode + ": House polls race has closed.") == false) {
                    events.push(houseData[i].stateCode + ": House polls race has closed.")
                    closedRaces.push(houseData[i].stateCode + ": House race polls has closed.")
                }
            }
        }
    } catch (error) {
        console.error('Error fetching house close data:', error);
    }
}

async function governor() {
    try {
        const response = await fetch('https://feeds-elections.foxnews.com/archive/politics/elections/2022/3/2022_Generals/Governor/national_level_summary/file.json?cb=1667749820726');
        let json = await response.json();
        let all = [];
        json = json.sort((a, b) => (a.stateCode > b.stateCode) ? 1 : -1);
        for (let q = 0; q < json.length; q++) {
            json[q].results = json[q].results.sort((a, b) => b.votes.count - a.votes.count);
            all.push(json[q]);
        }
        for (let i = 0; i < all.length; i++) {
            for (let q = 0; q < all[i].results.length; q++) {
                if (all[i].results[q].isWinner == true && governorData[i].results[q].isWinner == false) {
                    events.push(all[i].stateCode + ": " + all[i].results[q].candidate.firstName + " " + all[i].results[q].candidate.lastName + " one the governor race.")
                }
            }
        }
        governorData = all;
        governorClose();
    } catch (error) {
        console.error('Error fetching governor data:', error);
    }
}

async function governorClose() {
    try {
        const response = await fetch('https://feeds-elections.foxnews.com/archive/politics/elections/2022/3/2022_Generals/liveUpdates/G/file.json');
        const json = await response.json();
        for (let q = 0; q < json.length; q++) {
            if (json[q].race_id == null) {
                for (let w = 0; w < json[q].states.length; w++) {
                    for (let i = 0; i < governorData.length; i++) {
                        if (governorData[i].stateCode == "NM") {
                            governorData[i].close = "2022-11-09T01:00:00Z";
                        }
                        if (governorData[i].stateCode == json[q].states[w]) {
                            governorData[i].close = json[q].poll_close;
                        }
                    }
                }
            }
        }
        for (let i = 0; i < governorData.length; i++) {
            if (new Date(governorData[i].close) < new Date()) {
                if (closedRaces.includes(governorData[i].stateCode + ": Governor race polls has closed.") == false) {
                    events.push(governorData[i].stateCode + ": Governor race polls has closed.")
                    closedRaces.push(governorData[i].stateCode + ": Governor polls race has closed.")
                }
            }
        }
    } catch (error) {
        console.error('Error fetching governor close data:', error);
    }
}

app.get('/api/events', (req, res) => {
    res.send(events);
});

app.get('/api/senate', (req, res) => {
    res.send(senateData);
});

app.get('/api/house', (req, res) => {
    res.send(houseData);
});

app.get('/api/governors', (req, res) => {
    res.send(governorData);
});

app.get('/api/total', (req, res) => {
    res.send(totalData);
});

let left = []
app.get('/me', async (req, res) => {
    let states = ['AK', 'AZ', 'GA', 'NV', 'WI']
    for (let i = 0; i < states.length; i++) {
        let state = states[i]
        try {
            const response = await fetch('https://feeds-elections.foxnews.com/archive/politics/elections/2022/3/2022_Generals/Senate/' + state + '/state_level_results/file.json');
            let json = await response.json();
            json = json[0];
            json.candidateResults = json.candidateResults.sort((a, b) => b.votes.count - a.votes.count);
            json.state = state
            for (let q = 0; q < left.length; q++) {
                if (left[q].state == state) {
                    left.splice(q, 1)
                }
            }
            left.push(json)
        } catch (error) {
            console.error('Error fetching state data:', error);
        }
    }
    res.send(left)
})

//for any other requests, check if the file exists in /web
app.get('/*', (req, res) => {
    let path2 = req.path.toString();
    if (!req.path.toString().includes('.')) {
        path2 += '.html';
    }
    res.sendFile(path.join(path.resolve(), 'web', path2));
});

app.listen(3001)
const fs = require('fs');

const sheetId = '1cnFrrD71xnadqPeJigYMiWe2ErTgHR-HG4b8d_0sWLs'; // Replace with your spreadsheet ID
const sheetName = encodeURIComponent("2024")
const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`; // Replace with your sheet name

model_data = {}

var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

fetch(sheetURL)
.then(response => response.text())
.then(data => handleResponse(data))
.catch(error => console.error('Error:', error));

function handleResponse(data) {
    let sheetObjects = csvToObject(data);
    
    for (i in sheetObjects) {
        // console.log(sheetObjects[i])
        model_data[sheetObjects[i]['"State"']] = {
            "electoral_votes": parseInt(sheetObjects[i]['"Electoral Votes"']),
            "trump_win_percent": parseFloat(sheetObjects[i]['"Trump Win %"']),
            "harris_win_percent": parseFloat(sheetObjects[i]['"Harris Win %"']),
            "trump_vote_percent": parseFloat(sheetObjects[i]['"TRUMP Vote %"']),
            "harris_vote_percent": parseFloat(sheetObjects[i]['"HARRIS Vote %"']),
        }
        
        // console.log(model_data[i])
    }
    
    simulateElection(model_data)
}

function simulateElection(data) {
    const numberOfSimulations = 1000;

    let trumpElectoralVotes = 0;
    let harrisElectoralVotes = 0;
    
    let election_electoral_college_simulation_data = Array.from({length: numberOfSimulations}, () => ({}));

    for (let i = 0; i < numberOfSimulations; i++) {
        console.log("Beginning simulation " + i)
        trumpElectoralVotes = 0;
        harrisElectoralVotes = 0;

        for (const [state, info] of Object.entries(data)) {

            // console.log("VOTE " + info.trump_vote_percent)
            // console.log(info.harris_vote_percent)
            // console.log("WIN " + info.trump_win_percent)
            // console.log(info.harris_win_percent)

            let trumpWins = 0;
            let harrisWins = 0;
            
            // // Adjust the poll numbers within the margin of error
            // let adjustedA = info.trump_vote_percent + (standardNormal() / 2 * (marginOfError));
            // let adjustedB = info.harris_vote_percent + (standardNormal() / 2 * (marginOfError));
            
            // // Ensure that adjusted numbers stay between 0 and 1 (valid percentages)
            // adjustedA = Math.max(0, Math.min(1, adjustedA));
            // adjustedB = Math.max(0, Math.min(1, adjustedB));
            
            // // Normalize to ensure they sum to 1, adjusting for floating-point imprecision
            // let total = adjustedA + adjustedB;
            // adjustedA /= total;
            // adjustedB /= total;
            
            // let randomValue = Math.random();
            
            // // Check if any candidate has more than 50% of the vote
            // if (adjustedA > 0.5) {
            //     trumpWins++;
            //     trumpElectoralVotes += info.electoral_votes;
            // } else if (adjustedB > 0.5) {
            //     harrisWins++;
            //     harrisElectoralVotes += info.electoral_votes;
            // } else {
            //     // If no candidate has 50%, we use a random selection based on polling
            //     if (randomValue < adjustedA) {
            //         trumpWins++;
            //         trumpElectoralVotes += info.electoral_votes;
            //     } else if (randomValue < (adjustedA + adjustedB)) {
            //         harrisWins++;
            //         harrisElectoralVotes += info.electoral_votes;
            //     } else {
            //         // console.log("ERROR!!!!!!!!!!!!!!!!!!!!!!");
            //     }
            // }

            let randomValue = Math.random();

            if (randomValue < info.trump_win_percent / 100) {
                trumpWins++;
                trumpElectoralVotes += info.electoral_votes;
            } else {
                harrisWins++;
                harrisElectoralVotes += info.electoral_votes;
            }

            election_electoral_college_simulation_data[i][`Trump Wins ${state}`] = trumpWins;
            election_electoral_college_simulation_data[i][`Harris Wins ${state}`] = harrisWins;

            // console.log(`-------------------- ${state} --------------------`);
            // console.log("Trump: " + adjustedA + ", " + trumpElectoralVotes + ", " + info.electoral_votes);
            // console.log("Harris: " + adjustedB + ", " + harrisElectoralVotes);
        }
        
        // Store the results of this simulation
        election_electoral_college_simulation_data[i]["Trump Electoral Votes"] = trumpElectoralVotes;

        election_electoral_college_simulation_data[i]["Harris Electoral Votes"] = 538 - trumpElectoralVotes;

        if (election_electoral_college_simulation_data[i]["Trump Electoral Votes"] > election_electoral_college_simulation_data[i]["Harris Electoral Votes"]) {
            election_electoral_college_simulation_data[i]["Trump Wins EC?"] = 1
            election_electoral_college_simulation_data[i]["Tied EC?"] = 0
        } else if (election_electoral_college_simulation_data[i]["Trump Electoral Votes"] === election_electoral_college_simulation_data[i]["Harris Electoral Votes"]) {
            election_electoral_college_simulation_data[i]["Trump Wins EC?"] = 0
            election_electoral_college_simulation_data[i]["Tied EC?"] = 1
        } else {
            election_electoral_college_simulation_data[i]["Trump Wins EC?"] = 0
            election_electoral_college_simulation_data[i]["Tied EC?"] = 0
        }

        // if (i % batchSize === 0 && i > 0) {
        //     if (i <= batchSize) {
        //         writeBatchToFile(election_electoral_college_simulation_data, true);
        //     } else {
        //         writeBatchToFile(election_electoral_college_simulation_data, false);
        //     }
        // }
    }

    

    election_electoral_college_simulation_data.push(calculateAverage(election_electoral_college_simulation_data, numberOfSimulations))

    writeBatchToFile(election_electoral_college_simulation_data, true);
}

function standardNormal() {
    // Generate two uniform(0,1) random numbers
    let u = 1 - Math.random(); // Subtracting from 1 to avoid boundary at 0
    let v = Math.random();

    // Calculate the radius in the unit circle
    let r = Math.sqrt(-2.0 * Math.log(u));

    // Calculate the angle
    let theta = 2.0 * Math.PI * v;

    // Generate two standard normal variables
    let z1 = r * Math.cos(theta);
    // let z2 = r * Math.sin(theta);

    // Return one of them (z1), you can use z2 for the next call if needed
    return z1;
}

function writeBatchToFile(data, includeHeaders) {
    filePath = 'election_simulation_' + mm + '-' + dd + '-' + yyyy + '.csv';

    const csvString = objectToCSV(data, includeHeaders); // Pass exists as a parameter to decide if headers should be included
    
    fs.writeFile(filePath, csvString, (err) => {
        if (err) throw err;
        console.log('Batch written to file!');
    });
}

// Function to calculate average of values for each key across all objects
function calculateAverage(data, count) {
    if (data.length === 0) return {};

    // Initialize sums for each key
    let sums = {};

    // Iterate through each object in the list
    for (let obj of data) {
        for (let key in obj) {
            if (!sums[key]) sums[key] = 0;
            sums[key] += obj[key];
        }
    }

    // Calculate averages
    let averages = {};
    for (let key in sums) {
        averages[key] = sums[key] / count;
    }

    return averages;
}

function csvToObject(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');

    const result = {};

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',');
        const stateData = {};

        for (let j = 0; j < headers.length; j++) {
            const header = headers[j].trim();
            const value = currentLine[j].trim();

            isNumber = false

            tempValue = value

            tempValue = tempValue.replace(/"/g, '')
            tempValue = tempValue.replace(/\\/g, '')

            if (value.includes("%")) {
                tempValue = tempValue.replace("%", "")
                isNumber = true
            }

            if (value.includes(",")) {
                tempValue = tempValue.replace(",", "")
                isNumber = true
            }

            if (value.includes(".")) {
                tempValue = parseFloat(tempValue.replace(".", "")) / 100
                isNumber = true
            }

            stateData[header] = tempValue;
        }

        // Use the first column as the key for the state
        result[stateData[headers[0]]] = stateData;
    }

    return result;
}

function objectToCSV(array, includeHeaders) {
    console.log("Writing to csv...")

    // Get headers from the first object in the array
    const headers = Object.keys(array[0]);
    
    // Create CSV string without using JSON.stringify
    let csvRows = array.map(row => 
        headers.map(fieldName => {
            let value = row[fieldName];
            // Check if value needs quoting
            if (typeof value === 'string' && (value.includes(',') || value.includes('\r') || value.includes('\n') || value.includes('"'))) {
                // Escape quotes and wrap in quotes
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',')
    );

    // Add headers to the CSV only if includeHeaders is true
    if (includeHeaders) {
        console.log("HEADERS!!!!!")
        csvRows.unshift(headers.map(header => {
            // Check if headers need quoting
            if (header.includes(',') || header.includes('\r') || header.includes('\n') || header.includes('"')) {
                return `"${header.replace(/"/g, '""')}"`;
            }
            return header;
        }).join(','));
    }
    
    // Join all rows
    return csvRows.join('\r\n');
}
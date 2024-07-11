const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const JSZip = require('jszip');
const path = require('path');
const { exec } = require('child_process');
const xlsx = require('xlsx');

const app = express();
const port = 3000;

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/upload', upload.single('studentsFile'), async (req, res) => {
    const filePath = req.file.path;
    const roomsDir = path.join(__dirname, 'rooms');

    try {
        const workbook = xlsx.readFile(filePath);
        const sheets = workbook.SheetNames;

        const studentsPerRoom = 40;
        const selectedRooms = req.body.selectedRooms.split(',');
        shuffleArray(selectedRooms);  // Randomize the selected rooms just jumble it 

        const students = [];

        sheets.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

            // Assuming Si.no is in the first column, USN in the second column, and Name in the third column
            for (let i = 1; i < data.length; i++) {
                const student = {
                    'Si.no': data[i][0],
                    'USN': data[i][1],
                    'Name': data[i][2],
                    'Branch': sheetName // Use sheet name as branch
                };
                students.push(student);
            }
        });

        // Calculate the required number of rooms
        const totalStudents = students.length;
        const requiredRooms = Math.ceil(totalStudents / studentsPerRoom);

        // Check if the selected rooms match the required number of rooms
        if (selectedRooms.length !== requiredRooms) {
            res.status(400).json({ error: `Number of selected rooms must be ${requiredRooms} to accommodate ${totalStudents} students.` });
            return;
        }

        await fs.ensureDir(roomsDir);
        await fs.emptyDir(roomsDir);

        shuffleArray(students);

        // Generate branch pairs randomly and in a circular manner
        const branches = sheets;
        shuffleArray(branches);
        const branchPairs = generateCircularBranchPairs(branches);

        selectedRooms.forEach((room, index) => {
            const studentsInRoom = [];
            const branchCount = {};
            let sequenceNumber = 1; // Initialize sequence number

            let pair = branchPairs[index % branchPairs.length];
            const [branch1, branch2] = pair;

            for (let i = 0; i < students.length && studentsInRoom.length < studentsPerRoom; i++) {
                const student = students[i];
                const branch = student['Branch'];

                if ((branch === branch1 || branch === branch2) && (branchCount[branch1] || 0) + (branchCount[branch2] || 0) < studentsPerRoom) {
                    if (!branchCount[branch]) {
                        branchCount[branch] = 0;
                    }

                    if (branchCount[branch] < 20) {
                        branchCount[branch]++;
                        student['Numberrange'] = sequenceNumber++; // Add sequence number
                        studentsInRoom.push(student);
                        students.splice(i, 1);
                        i--;
                    }
                }
            }

            // If there are not enough students in the pair, relax the constraint 20 se kam bhi chalega
            if (studentsInRoom.length < studentsPerRoom) {
                for (let i = 0; i < students.length && studentsInRoom.length < studentsPerRoom; i++) {
                    const student = students[i];
                    student['Numberrange'] = sequenceNumber++;
                    studentsInRoom.push(student);
                    students.splice(i, 1);
                    i--;
                }
            }

            const roomContent = 'Numberrange,USN,Name,Branch\n' + studentsInRoom.map(e => Object.values(e).join(',')).join('\n');
            fs.writeFileSync(path.join(roomsDir, `${room}.csv`), roomContent);
        });

        exec('node convert.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                res.status(500).json({ error: 'Error generating PDFs' });
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            res.json({ message: 'Files generated and PDFs created successfully' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing file' });
    } finally {
        await fs.remove(filePath);
    }
});

app.get('/download', async (req, res) => {
    const zipFilePath = path.join(__dirname, 'pdfs.zip');
    res.download(zipFilePath, 'allocated_students.zip', (err) => {
        if (err) {
            console.error('Error sending zip file:', err);
            res.status(500).json({ error: 'Error sending zip file' });
        }
    });
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateCircularBranchPairs(branches) {
    const branchPairs = [];
    for (let i = 0; i < branches.length; i++) {
        for (let j = i + 1; j < branches.length; j++) {
            branchPairs.push([branches[i], branches[j]]);
        }
    }
    return branchPairs;
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

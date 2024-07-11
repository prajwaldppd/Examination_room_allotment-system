const fs = require('fs');
const csv = require('csv-parser');
const pdf = require('html-pdf');
const path = require('path');
const archiver = require('archiver');

const roomsDirectory = './rooms'; // Directory containing CSV files
const pdfsDirectory = './pdfs'; // Directory to save PDF files
const zipFilePath = './pdfs.zip'; // Path to store the zipped file

// Function to extract room number from CSV file name
function extractRoomNumberFromFileName(fileName) {
    const matches = fileName.match(/(\d+)/); // Extract digits from file name
    if (matches && matches.length > 0) {
        return matches[0]; // Return the first match (room number)
    }
    return null;
}

// Function to convert CSV file to PDF
function convertCsvToPdf(csvFilePath, callback) {
    const pdfContent = []; // Store CSV data as HTML for PDF generation
    let headers; // Store CSV headers

    // Extract base file name without extension
    const baseFileName = path.basename(csvFilePath, path.extname(csvFilePath));
    
    // Extract room number from CSV file name
    const roomNumber = extractRoomNumberFromFileName(baseFileName);

    // Read CSV file
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('headers', (headerList) => {
            headers = headerList;
        })
        .on('data', (data) => {
            const modifiedData = {
                'Si.No': pdfContent.length + 1, // Incremental serial number
                'USN': data.USN,
                'Name': data.Name,
                'Branch': data.Branch,
                'Booklet Number': '',
                'Signature': '' // Empty columns for booklet number and signature
            };
            pdfContent.push(modifiedData);
        })
        .on('end', () => {
            // Generate PDF from HTML content
            let htmlContent = `
            <html>
    <head>
        <style>
            table { 
                border-collapse: collapse; 
                width: 100%; 
            }
            th, td { 
                border: 1px solid black; 
                padding: 8px; 
                text-align: center;
            }
            .center { 
                text-align: center; 
            }
            .left {
                text-align: left;
            }
            .spacer { 
                margin-bottom: 20px; 
            } /* Add space between tables */
        </style>
    </head>
    <body>
        <img src="./bmsce.png" style="position: absolute; top: 0; left: 0; width: 100px; height: auto;">
        <p class="center">Room No: ${roomNumber}</p>
        <h3 class="center">B.M.S COLLEGE OF ENGINEERING, BANGALORE-21</h3>
        <h4 class="center">(Autonomous College under VTU)</h4>
        <h2 class="center">Attendance Sheet</h2>
        <div class="box">
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <table>
                <tr>
                    <td>Date:</td>
                    <td>${new Date().toLocaleDateString()}</td>
                    <td>Timings:</td>
                    <td>[Start Time] - [End Time]</td>
                    <td>Invigilator Assigned:</td>
                    <td>[Name]</td>
                </tr>
            </table>
            <table>
                <tr>
                    <th style="width: 5%">Si.No</th>
                    <th style="width: 20%">USN</th>
                    <th style="width: 25%">Name</th>
                    <th style="width: 25%">Branch</th>
                    <th style="width: 10%">Booklet Number</th>
                    <th style="width: 15%">Signature</th>
                </tr>
                ${pdfContent.map(row => `
                    <tr>
                        <td>${row['Si.No']}</td>
                        <td>${row['USN']}</td>
                        <td>${row['Name']}</td>
                        <td>${row['Branch']}</td>
                        <td>${row['Booklet Number']}</td>
                        <td>${row['Signature']}</td>
                    </tr>`).join('')}
            </table>
            <div class="spacer"></div>
            <table>
                <tr>
                    <th style="width: 25%">Name of the Invigilator</th>
                    <th style="width: 25%"></th>
                    <th style="width: 25%">Signature with date</th>
                    <th style="width: 25%"></th>
                </tr>
            </table>
            <div class="spacer"></div>
            <table>
                <tr>
                    <td class="left">Present</td>
                    <td class="center">Absent</td>
                    <td class="center">Signature of Invigilator</td>
                </tr>
            </table>
        </div>
    </body>
</html>
        `;

            // Options for PDF generation
            const options = { format: 'Letter' };

            // Construct PDF file path using base file name
            const pdfFileName = `${baseFileName}.pdf`;
            const pdfFilePath = `${pdfsDirectory}/${pdfFileName}`;

            // Generate PDF and save to file
            pdf.create(htmlContent, options).toFile(pdfFilePath, (err, response) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(`PDF saved to ${pdfFilePath}`);
                callback(); // Call the callback function once PDF is saved
            });
        });
}

// Function to zip PDF files
function zipPdfFiles() {
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log(`Zipped files successfully stored at ${zipFilePath}`);
    });

    archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
            console.warn(err);
        } else {
            throw err;
        }
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);
    archive.directory(pdfsDirectory, false);
    archive.finalize();
}

// Ensure the pdfs directory exists and is empty
fs.mkdirSync(pdfsDirectory, { recursive: true });
fs.readdir(pdfsDirectory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
        fs.unlink(path.join(pdfsDirectory, file), err => {
            if (err) throw err;
        });
    }
});

// Read all CSV files in the rooms directory and convert them to PDFs
fs.readdir(roomsDirectory, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }
    
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    const totalFilesToConvert = csvFiles.length;
    let filesConverted = 0;

    csvFiles.forEach(file => {
        const csvFilePath = `${roomsDirectory}/${file}`;
        convertCsvToPdf(csvFilePath, () => {
            filesConverted++;
            if (filesConverted === totalFilesToConvert) {
                zipPdfFiles();
            }
        });
    });
});

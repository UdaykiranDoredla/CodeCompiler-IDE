const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS for cross-origin requests
app.use(bodyParser.json()); // Support JSON-encoded bodies

// Create directories for different languages if they don't exist
const languagesDirs = ['c', 'cpp', 'java', 'python'];
languagesDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});

// Endpoint to handle code execution
app.post('/run', (req, res) => {
    const { language, code, userInput } = req.body;
    
    // Get the appropriate file extension based on the programming language
    const extension = getFileExtension(language);
    const dirPath = path.join(__dirname, language); // Language-specific directory
    const filename = `${getFilename(language, code)}.${extension}`;
    const filepath = path.join(dirPath, filename);

    // Write the code into a file in the respective language directory
    fs.writeFile(filepath, code, (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).send('Error writing file');
        }

        // Get the correct command to execute the code based on the language
        let command = getCommand(language, filepath);

        // Execute the code using child_process.exec
        const childProcess = exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
            if (error) {
                console.error('Execution error:', error);
                return res.status(500).send(stderr || error.message);
            } else {
                res.send(stdout || stderr); // Send the result (stdout or stderr) to the client
            }

            // Clean up the file after execution, except for Java class files
            if (language !== 'java') {
                fs.unlink(filepath, (unlinkErr) => {
                    if (unlinkErr) console.error('Error deleting file:', unlinkErr);
                });
            }
        });

        // If user input is provided, send it to the child process
        if (userInput) {
            childProcess.stdin.write(userInput);
            childProcess.stdin.end();
        }
    });
});

// Helper function to get the file extension based on the language
function getFileExtension(language) {
    switch (language) {
        case 'c': return 'c';
        case 'cpp': return 'cpp';
        case 'java': return 'java';
        case 'python': return 'py';
        default: return 'txt'; // Default to .txt if unknown language
    }
}

// Helper function to get the execution command based on the language
function getCommand(language, filepath) {
    const dirPath = path.dirname(filepath); // Directory path for the file
    
    switch (language) {
        case 'c':
            return `"C:/Program Files (x86)/Dev-Cpp/MinGW64/bin/gcc.exe" ${filepath} -o ${path.join(dirPath, 'temp.exe')} && ${path.join(dirPath, 'temp.exe')}`;
        case 'cpp':
            return `"C:/Program Files (x86)/Dev-Cpp/MinGW64/bin/g++.exe" ${filepath} -o ${path.join(dirPath, 'temp.exe')} && ${path.join(dirPath, 'temp.exe')}`;
        case 'java':
            const className = path.basename(filepath, '.java'); // Extract class name from filename
            return `"C:/Program Files/Java/jdk-18.0.1/1bin/javac.exe" ${filepath} && java -cp ${dirPath} ${className}`;
        case 'python':
            return `"C:/Users/satya/AppData/Local/Programs/Python/Python312/python.exe" ${filepath}`;
        default:
            return `cat ${filepath}`; // Default to cat for unknown languages (just reads the file)
    }
}

// Helper function to get the filename, specifically extracting class name for Java
function getFilename(language, code) {
    if (language === 'java') {
        // Extract class name from Java code using regex
        const match = code.match(/class\s+([A-Za-z_]\w*)/);
        return match ? match[1] : 'Main'; // Default to "Main" if no class name is found
    }
    return 'temp'; // Use a default "temp" name for other languages
}

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server running on port 3000');
});

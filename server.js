import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'public', 'styles', and 'src' directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/src', express.static(path.join(__dirname, 'src')));

const dataFilePath = path.join(__dirname, 'data.json');
let data = {
    users: [],
    tables: {},
    schools: [],
    students: [],
    completeentrydb: [],
    allDiscountOptions: [],
    indexesforinformationpass: []
};

// Load data from JSON file
function loadData() {
    if (fs.existsSync(dataFilePath)) {
        const fileData = fs.readFileSync(dataFilePath);
        data = JSON.parse(fileData);
    } else {
        console.error('data.json file does not exist');
    }
}

// Save data to JSON file
function saveData() {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

loadData();

app.get('/api/completeentrydb', (req, res) => {
    try {
        const { studenttezkereNo, schoolName } = req.query;
        let filteredStudents = data.completeentrydb;

        if (studenttezkereNo) {
            filteredStudents = filteredStudents.filter(student => student["Student Tezkere No"] === studenttezkereNo);
        }

        if (schoolName) {
            filteredStudents = filteredStudents.filter(student => student.name === schoolName);
        }

        console.log('Filtered students:', filteredStudents);
        res.json(filteredStudents);
    } catch (error) {
        console.error('Error in /api/completeentrydb:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/completeentrydb-ID', (req, res) => {
    const { studenttezkereNo } = req.query;
    let filteredStudents = data.completeentrydb;

    if (studenttezkereNo) {
        filteredStudents = filteredStudents.filter(student => student["Student Tezkere No"] === studenttezkereNo);
    }

    console.log('Filtered students2:', filteredStudents);
    res.json(filteredStudents);
});

app.get('/api/allDiscountOptions', (req, res) => {
    const discountValues = data.allDiscountOptions.map(item => ({
        option: item.option,
        discountRate: item.discountRate
    }));
    res.json(discountValues);
});

app.post('/api/allDiscountOptions', (req, res) => {
    console.log('Received request to save discount:', req.body);
    req.body.forEach(discount => {
        const { option, discountRate } = discount;
        const existingOption = data.allDiscountOptions.find(item => item.option === option);
        if (existingOption) {
            existingOption.discountRate = discountRate;
            console.log('Updated discount:', { option, discountRate });
        } else {
            data.allDiscountOptions.push({ option, discountRate });
            console.log('Saved discount:', { option, discountRate });
        }
    });
    saveData();
    res.status(200).json({ message: 'allDiscountOptions values saved successfully' });
});

app.post('/api/users', (req, res) => {
    const user = req.body;
    data.users.push(user);
    saveData();
    res.status(201).json(user);
});

app.get('/api/users', (req, res) => {
    res.json(data.users);
});

app.delete('/api/users/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    if (index >= 0 && index < data.users.length) {
        const user = data.users.splice(index, 1)[0];
        saveData();
        res.json(user);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

app.post('/api/schools', (req, res) => {
    const school = req.body;
    data.schools.push(school);
    saveData();
    res.status(201).json(school);
});

app.get('/api/tables', (req, res) => {
    console.log('Received request for all tables');
    loadData();
    console.log('Current tables data:', JSON.stringify(data.tables, null, 2));
    if (Object.keys(data.tables).length > 0) {
        res.json(data.tables);
    } else {
        console.log('No tables found');
        res.status(404).json({ error: 'No tables found' });
    }
});

app.get('/api/schools', (req, res) => {
    res.json(data.schools);
});

app.put('/api/schools/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    console.log(`PUT request for index: ${index}`);
    if (index >= 0 && index < data.schools.length) {
        data.schools[index] = req.body;
        saveData();
        res.json(data.schools[index]);
    } else {
        res.status(404).json({ error: 'School not found' });
    }
});

app.delete('/api/schools/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    console.log(`DELETE request for index: ${index}`);
    if (index >= 0 && index < data.schools.length) {
        const school = data.schools.splice(index, 1)[0];
        saveData();
        res.json(school);
    } else {
        res.status(404).json({ error: 'School not found' });
    }
});

app.post('/api/students', (req, res) => {
    try {
        const student = req.body;
        console.log('Received student:', student); // Debugging log

        // Validate the student object
        if (!student || typeof student !== 'object') {
            console.error('Invalid student:', student);
            return res.status(400).json({ error: 'Invalid student' });
        }

        data.students.push(student); // Add student to data.json
        saveData();
        res.status(201).json(student);
    } catch (error) {
        console.error('Error in /api/students:', error);
        console.error('Stack trace:', error.stack); // Log the stack trace
        res.status(500).send('Internal Server Error');
    }
});


app.get('/api/students', (req, res) => {
    const username = req.query.username;
    const selectedYear = req.query.year; // Ensure the parameter name matches the query parameter
    const filteredStudents = data.students.filter(student => student.username === username && student.selectedYear === selectedYear);
    res.json(filteredStudents);
});

app.put('/api/students/:id', (req, res) => {
    const studentId = parseInt(req.params.id, 10); // Convert studentId to a number
    const studentIndex = data.students.findIndex(student => student.id === studentId);
    if (studentIndex !== -1) {
        data.students[studentIndex] = { ...data.students[studentIndex], ...req.body };
        saveData();
        res.json(data.students[studentIndex]);
    } else {
        res.status(404).json({ error: 'Student not found' });
    }
});

app.delete('/api/students/:id', (req, res) => {
    const studentId = parseInt(req.params.id, 10); // Convert studentId to a number
    const studentIndex = data.students.findIndex(student => student.id === studentId);
    if (studentIndex !== -1) {
        const student = data.students.splice(studentIndex, 1)[0];
        // Remove the corresponding entry from completeentrydb
        data.completeentrydb = data.completeentrydb.filter(entry => entry.studentId !== studentId);
        saveData();
        res.json(student);
    } else {
        res.status(404).json({ error: 'Student not found' });
    }
});

app.post('/api/completeentrydb', (req, res) => {
    try {
        const completeEntry = req.body;
        console.log('Received complete entry:', completeEntry); // Debugging log

        // Validate the completeEntry object
        if (!completeEntry || typeof completeEntry !== 'object') {
            console.error('Invalid complete entry:', completeEntry);
            return res.status(400).json({ error: 'Invalid complete entry' });
        }

        data.completeentrydb.push(completeEntry);
        saveData();
        res.status(201).json(completeEntry);
    } catch (error) {
        console.error('Error in /api/completeentrydb:', error);
        console.error('Stack trace:', error.stack); // Log the stack trace
        res.status(500).send('Internal Server Error');
    }
});

app.put('/api/completeentrydb/:id', (req, res) => {
    const entryId = parseInt(req.params.id, 10);
    const entryIndex = data.completeentrydb.findIndex(entry => entry.id === entryId);
    if (entryIndex !== -1) {
        data.completeentrydb[entryIndex] = { ...data.completeentrydb[entryIndex], ...req.body };
        saveData();
        res.json(data.completeentrydb[entryIndex]);
    } else {
        res.status(404).json({ error: 'Complete entry not found' });
    }
});

app.delete('/api/completeentrydb/:id', (req, res) => {
    const entryId = parseInt(req.params.id, 10);
    const entryIndex = data.completeentrydb.findIndex(entry => entry.id === entryId);
    if (entryIndex !== -1) {
        const entry = data.completeentrydb.splice(entryIndex, 1)[0];
        saveData();
        res.json(entry);
    } else {
        res.status(404).json({ error: 'Complete entry not found' });
    }
});

app.post('/save-tables', (req, res) => {
    const newTables = req.body;
    fs.readFile(dataFilePath, 'utf8', (err, fileData) => {
        if (err) {
            return res.status(500).send('Error reading data');
        }
        let jsonData = JSON.parse(fileData);
        jsonData.tables = newTables;
        fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error saving data');
            }
            res.send('Data saved successfully');
        });
    });
});

app.get('/fetch-tables', (req, res) => {
    fs.readFile(dataFilePath, 'utf8', (err, fileData) => {
        if (err) {
            return res.status(500).send('Error reading data');
        }
        const jsonData = JSON.parse(fileData);
        res.json({ tables: jsonData.tables });
    });
});

app.post('/api/indexesforinformationpass', (req, res) => {
    const { indexRange } = req.body;
    console.log('Received index range:', indexRange);

    if (!Array.isArray(data.indexesforinformationpass)) {
        console.error('indexesforinformationpass is not an array');
        data.indexesforinformationpass = [];
    }

    if (data.indexesforinformationpass.length > 0) {
        console.log('Data already exists. No need to add more.');
        return res.status(400).json({ error: 'Data already exists. No need to add more.' });
    }

    data.indexesforinformationpass.push(indexRange);

    try {
        saveData();
    } catch (error) {
        console.error('Error saving data:', error);
        return res.status(500).json({ error: 'Failed to save data' });
    }

    res.json({ message: 'Index range received', indexRange });
});

app.put('/api/updateindexesforinformationpass', (req, res) => {
    const { indexRange } = req.body;
    console.log('Received index range for update:', indexRange);

    if (!Array.isArray(data.indexesforinformationpass)) {
        console.error('indexesforinformationpass is not an array');
        data.indexesforinformationpass = [];
    }

    if (data.indexesforinformationpass.length > 0) {
        data.indexesforinformationpass[0] = indexRange;
    } else {
        data.indexesforinformationpass.push(indexRange);
    }

    try {
        saveData();
    } catch (error) {
        console.error('Error saving data:', error);
        return res.status(500).json({ error: 'Failed to save data' });
    }

    res.json({ message: 'Index range updated', indexRange });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/data.json', (req, res) => {
    if (fs.existsSync(dataFilePath)) {
        res.sendFile(dataFilePath);
    } else {
        console.error('data.json file not found');
        res.status(404).send('data.json file not found');
    }
});

app.get('/api/example', (req, res) => {
    try {
        throw new Error('Simulated error');
    } catch (error) {
        console.error('Error in /api/example:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('*', (req, res) => {
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

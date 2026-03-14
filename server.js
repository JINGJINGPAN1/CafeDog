const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config();
const express = require('express');

const app = express();
const port = 5001;

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('Missing MONGODB_URI in environment variables');
    process.exit(1);
}
const client = new MongoClient(uri);

// 1. encode the json data from frontend
app.use(express.json());

// 2. cors: middleware (replace the cors package)
app.use((req, res, next) => {
    // allow all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    // allow all methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    // allow all headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // if the method is OPTIONS, send 200
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// 3. routes
app.get('/api/cafes', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('cafedog');
        const cafesCollection = database.collection('cafes');
        const cafes = await cafesCollection.find({}).toArray();
        res.json(cafes);
    } catch (error) {
        console.error('Error fetching cafes:', error);
        res.status(500).json({ error: 'Failed to fetch cafes' });
    }
});

app.get('/api/cafes/:id', async (req, res) => {
    try {
        const cafeId = req.params.id;

        await client.connect();
        const database = client.db('cafedog');
        const cafesCollection = database.collection('cafes');

        const cafe = await cafesCollection.findOne({ _id: new ObjectId(cafeId) });

        if (!cafe) {
            return res.status(404).json({ error: "Can't find the cafe!" });

        }

        res.status(200).json(cafe);

    } catch (error) {
        console.error("Error finding cafe:", error);
        res.status(500).json({ error: "Server error or invalid ID format." });
    }
});


app.delete('/api/cafes/:id', async (req, res) => {
    try {
        const cafeId = req.params.id;

        if (!cafeId || !ObjectId.isValid(cafeId)) {
            return res.status(400).json({ error: "Invalid cafe ID format." });
        }

        await client.connect();
        const database = client.db('cafedog');
        const cafesCollection = database.collection('cafes');

        let result = await cafesCollection.deleteOne({ _id: new ObjectId(cafeId) });
        if (result.deletedCount === 0) {
            result = await cafesCollection.deleteOne({ _id: cafeId });
        }
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Cafe not found or already deleted." });
        }

        res.status(200).json({ message: "Cafe successfully deleted!" });

    } catch (error) {
        console.error("Error deleting cafe:", error);
        res.status(500).json({ error: "Server error during deletion." });
    }
});

app.post('/api/cafes', async (req, res) => {
    try {
        const newCafe = req.body;
        if (!newCafe.name || !newCafe.address) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await client.connect();
        const database = client.db('cafedog');
        const cafesCollection = database.collection('cafes');

        const result = await cafesCollection.insertOne(newCafe);
        res.status(201).json({
            message: 'Cafe created successfully',
            insertedId: result.insertedId,
        });

    } catch (error) {
        console.error('Error creating cafe:', error);
        res.status(500).json({ error: 'Failed to create cafe' });
    }
});


// 4. start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
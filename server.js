
const express = require('express');
const db = require('./db');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
app.use(bodyParser.json());
const { connectDB, getDB } = require('./db');

const PORT = 3000;


// API: Add Product to Collection
app.post('/add-to-collection', async (req, res) => {
    const { user_email, collection_id, sku, likes, dislikes } = req.body;
    const created_at = new Date();
    const updated_at = new Date();

    const db = getDB();
    try {

        const userCollection = await db.collection('user_details').findOne({
            user_email,
            collection_id,
        });

        if (userCollection) {
            // Update `sku_list` if SKU is not already in the list
            const skuList = userCollection.sku_list || [];
            if (!skuList.includes(sku)) {
                skuList.push(sku);
                await db.collection('user_details').updateOne(
                    { user_email, collection_id },
                    { $set: { sku_list: skuList, updated_at } }
                );
            }
        } else {
            // Create a new entry in `user_details` if it doesn't exist
            await db.collection('user_details').insertOne({
                user_email,
                collection_id,
                sku_list: [sku],
                created_at,
                updated_at,
            });
        }
        await db.collection('collections').insertOne({
            user_email,
            collection_id,
            sku,
            likes,
            dislikes,
            created_at,
            updated_at,
        });
        res.status(201).send({ message: 'Product added to collection successfully' });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// API: Get Collection List
app.get('/collections/:user_email', async (req, res) => {
    const user_email = req.params.user_id;
    const db = getDB();
    try {
        const results = await db.collection('user_details').find({ user_email }).toArray();
        res.status(200).send(results);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});
// API: Get Collection Details
app.get('/collection-details/:collection_id', async (req, res) => {
    const collection_id = req.params.collection_id;
    const db = getDB();
    try {
        const results = await db.collection('collections').aggregate([
            { $match: { collection_id } },
            {
                $lookup: {
                    from: 'user_details',
                    localField: 'collection_id',
                    foreignField: 'collection_id',
                    as: 'details',
                },
            },
        ]).toArray();
        res.status(200).send(results);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});


// API: Update Collection Details (Like/Dislike)
app.put('/update-collection-details', async (req, res) => {
    const { collection_id, sku, likes, dislikes } = req.body;
    const updated_at = new Date();
    const db = getDB();
    try {
        await db.collection('collections').updateOne(
            { collection_id, sku },
            { $set: { likes, dislikes, updated_at } }
        );
        res.status(200).send({ message: 'Collection details updated successfully' });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});
connectDB().then(() => {
    http.listen(PORT,function(){
        console.log(`Server running on http://localhost:3000`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
});





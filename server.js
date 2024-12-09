
const express = require('express');
const db = require('./db');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
app.use(bodyParser.json());
const { connectDB, getDB } = require('./db');

const PORT = 3000;
function getCollection_id() {
    return Math.floor(10000 + Math.random() * 90000);
}


// API: Add Product to Collection
app.post('/add-to-collection', async (req, res) => {
    const { user_email, collection_name, sku } = req.body;
    const likes = 0, dislikes = 0, likes_email_ids = [], dislikes_email_ids = [];
    const collection_id = getCollection_id();
    const created_at = new Date();
    const updated_at = new Date();
    const db = getDB();
    try {

        const userCollection = await db.collection('user_details').findOne({
            user_email,
            collection_name,
        });

        if (userCollection) {
            const skuList = userCollection.sku_list || [];
            if (!skuList.includes(sku)) {
                skuList.push(sku);
                await db.collection('user_details').updateOne(
                    { user_email, collection_name},
                    { $set: { sku_list: skuList, updated_at } }
                );
            }
            else{
                throw new Error('sku already exists!');
            }
        } else {
            await db.collection('user_details').insertOne({
                user_email,
                collection_id,
                collection_name,
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
            likes_email_ids,
            dislikes_email_ids
        });
        res.status(201).send({ message: 'Product added to collection successfully' });
    } catch (err) {
        res.status(500).send({ error: 'Failed to add into collection: '+err.message });
    }
});

// API: Get Collection List
app.get('/collections/:user_email', async (req, res) => {
    const user_email = req.params.user_email;

    const db = getDB();
    try {
        const results = await db.collection('user_details').find({ user_email }).toArray();
        if (results.length > 0) {
            const collections = results.map(item => ({
                [item.collection_name]: item.sku_list
            }));
            res.status(200).send(collections);
        } else {
            res.status(404).send({ error: 'No collections found for the provided user_email' });
        }
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch collection names: ' + err.message });
    }
});

// API: Get Collection details
app.get('/collection-details/:user_email', async (req, res) => {
    const user_email = req.params.user_email;
    const db = getDB();

    try {
        const userCollections = await db.collection('user_details').find({ user_email }).toArray();

        if (userCollections.length === 0) {
            return res.status(404).send({ error: 'User not found' });
        }
        const collectionIds = [...new Set(userCollections.map(({ collection_id }) => collection_id))];
        const collectionDetails = await db.collection('collections').find({
            collection_id: { $in: collectionIds }
        }).toArray();
        const result = {};

        userCollections.forEach(({ collection_id, collection_name, sku_list }) => {
            if (!result[collection_id]) {
                result[collection_id] = {
                    collection_name,
                    sku_list: []
                };
            }
            sku_list.forEach(sku => {
                const collectionDetail = collectionDetails.find(collection => collection.collection_id === collection_id);

                if (collectionDetail && collectionDetail.sku == sku) {
                        result[collection_id].sku_list.push({
                            sku,
                            likes: collectionDetail.likes,
                            likes_email_ids: collectionDetail.likes_email_ids,
                            dislikes: collectionDetail.dislikes,
                            dislikes_email_ids: collectionDetail.dislikes_email_ids
                        });
                    }
                });
            });
        res.status(200).send(result);

    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch collection details: ' + err.message });
    }
});

// API: Update Collection Details (Increment Like/Dislike)
app.put('/update-collection-details', async (req, res) => {
    const { collection_id, sku, action, user_email, submitter } = req.body;
    const updated_at = new Date();
    const db = getDB();

    try {
        if (action !== 'like' && action !== 'dislike') {
            return res.status(400).send({ error: 'Invalid action. Use "like" or "dislike".' });
        }
        const updateField = action === 'like' ? 'likes' : 'dislikes';
        const incrementValue = 1;
        const arrayField = action === 'like' ? 'likes_email_ids' : 'dislikes_email_ids';
        const result = await db.collection('collections').updateOne(
            { collection_id, sku, user_email },
            { 
                $inc: { [updateField]: incrementValue },
                $set: { updated_at },
                $addToSet: { [arrayField]: submitter }
            }
        );
        if (result.matchedCount === 0) {
            return res.status(404).send({ error: 'No matching SKU found for the user in the collection.' });
        }
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





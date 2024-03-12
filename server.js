const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');
const cors = require('cors');

// Use cors middleware to enable CORS for all routes
app.use(cors());

app.use(express.static(path.join(__dirname, 'edusync_cw2')));
app.use(express.json());
app.set('port', 4000);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next();
})

const MongoClient = require('mongodb').MongoClient;

let db;
MongoClient.connect('mongodb+srv://HA1145:Hooda786@cluster0.bswsi9p.mongodb.net', (err, client) => {
    if (err) throw err;
    db = client.db('Webstore')
})

// Logger middleware (from sample code)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Function to check if a file exists (keeping your original code)
function fileExists(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
}

// Static file middleware for serving images (keeping your original code)
app.get('/images/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'images', filename);

  try {
      const exists = await fileExists(filePath);
    if (!exists) {
      return res.status(404).send('Image not found');
    }
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).send('An error occurred while trying to load the image');
  }
});

app.get('/', (req, res, next) => {
    res.send('Select a collection, e.g.,/collection/products')
}) 

app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName)
    return next()
})

app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    })
})

app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e)
        res.send(results.ops)
    })
})

const ObjectID = require('mongodb').ObjectID;
app.get('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
        if (e) return next(e)
        res.send(result)
    })
})

app.put('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.update(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? { msg: 'sucess' } : { msg: 'error' })
        }
    )
})

app.get('/collection/:collectionName/search/:k', (req, res) => {
    var key_1 = req.params.k.toLowerCase();
    console.log("Searched term: " + key_1);

    req.collection.find(
        {
            $or: [
                { name: { $regex: new RegExp(key_1, "i") } },
            {location: {$regex: new RegExp(key_1, "i")}}]
        })
        .toArray((e, results) => {
            if (e) return console.log(e)
            res.send(results);
        });
});

const port = process.env.PORT || 4000
app.listen(port, () => {
    console.log(`Express.js server running at localhost:${port}`);
});
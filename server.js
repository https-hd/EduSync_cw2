const express = require('express')
const path = require('path');
const app = express()
const fs = require('fs');



app.use(express.json())
app.set('port', 3000)
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

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});


// Function to check if a file exists
function fileExists(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
}

// Route to serve images
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


app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName)
    return next()
})
app.get('/', (req, res, next) => {
    res.send('select a collection, e.g., /collection/messages')
})

app.listen(3000, () => {
    console.log('Express.js server running at localhost:3000')
})

// app.get('/collection/:collectionName', (req, res, next) => {
//     console.log(req.collection)
//     req.collection.find({}).toArray((e, results) => {
//         if (e) return next(e)
//         res.send(results)
//     })
// })


app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray()
        .then(results => {
            res.send(results);
        })
        .catch(e => {
            next(e); // Pass the error to the error-handling middleware
        });
});

// app.post('/collection/:collectionName', (req, res, next) => {
//     req.collection.insert(req.body, (e, results) => {
//         if (e) return next(e)
//         res.send(results.ops)
//     })
// })


// POST route to update orders
app.post('/collection/:collectionName/:id', (req, res, next) => {
  const collectionName = req.params.collectionName;
  const id = req.params.id;
  const updateData = req.body;

  if (collectionName !== 'orders') {
    return res.status(400).send('Invalid collection name');
  }

  // Log the ID and update data for debugging purposes
  console.log('Updating order with ID:', id);
  console.log('Update data:', updateData);

  req.collection.updateOne(
    { _id: new ObjectID(id) },
    { $set: updateData },
    { safe: true, upsert: false },
    (e, result) => {
      if (e) return next(e);
      res.send((result.matchedCount >  0) ? { msg: 'success' } : { msg: 'error' });
    }
  );
});


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
            res.send((result.result.n === 1) ? { msg: 'success' } : { msg: 'error' })
        })
})

app.delete('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.deleteOne(
        { _id: new ObjectID(req.params.id) },
        (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? { msg: 'success' } : { msg: 'error' })
        })
})

const port = process.env.PORT || 4000
app.listen(port)


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

//Logger middleware
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

// Static file middleware for serving images
app.get('/images/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'images', filename);

// Custom middleware for handling non-existent images only when the path starts with "/images"
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


//after you type this line, go to terminal and type this command node server.js
app.get('/', (req, res, next) => {
    res.send('Select a collection, e.g.,/collection/lessons')
}) 

app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName)
    //console.log('collection name', req.collection)
    return next()
})

//after u write this piece of code, then go to the terminal and type node server.js
//this is the code to add ur collection basically type http://localhost:3000/collection/lessons into the browser URL, products is the collection name from webstore database in MongoDB Compass software
app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e) //e is error
        res.send(results)
    })
})

//after u write this piece of code, then go to the terminal and type node server.js
app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e) //e is error
        res.send(results.ops)
    })
})

//return with object id
//this peice of code is to get a product from the database
//after u write this piece of code, then go to the terminal and type node server.js
const ObjectID = require('mongodb').ObjectID;
app.get('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
        if (e) return next(e)
        res.send(result)
    })
})

//this peice of code is to update anything inside products so eg: price u can just update it using this code
//after u write this piece of code, then go to the terminal and type node server.js
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

//GET request for the search query
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




// app.post('/collection/:collectionName', (req, res, next) => {
//     req.collection.insert(req.body, (e, results) => {
//         if (e) return next(e)
//         res.send(results.ops)
//     })
// })


// POST route to update orders
// app.post('/collection/:collectionName/:id', (req, res, next) => {
//   const collectionName = req.params.collectionName;
//   const id = req.params.id;
//   const updateData = req.body;

//   if (collectionName !== 'orders') {
//     return res.status(400).send('Invalid collection name');
//   }

//   // Log the ID and update data for debugging purposes
//   console.log('Updating order with ID:', id);
//   console.log('Update data:', updateData);

//   req.collection.updateOne(
//     { _id: new ObjectID(id) },
//     { $set: updateData },
//     { safe: true, upsert: false },
//     (e, result) => {
//       if (e) return next(e);
//       res.send((result.matchedCount >  0) ? { msg: 'success' } : { msg: 'error' });
//     }
//   );
// });


// const ObjectID = require('mongodb').ObjectID;
// app.get('/collection/:collectionName/:id', (req, res, next) => {
//     req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
//         if (e) return next(e)
//         res.send(result)
//     })
// })

// app.put('/collection/:collectionName/:id', (req, res, next) => {
//     req.collection.update(
//         { _id: new ObjectID(req.params.id) },
//         { $set: req.body },
//         { safe: true, multi: false },
//         (e, result) => {
//             if (e) return next(e)
//             res.send((result.result.n === 1) ? { msg: 'success' } : { msg: 'error' })
//         })
// })

// app.delete('/collection/:collectionName/:id', (req, res, next) => {
//     req.collection.deleteOne(
//         { _id: new ObjectID(req.params.id) },
//         (e, result) => {
//             if (e) return next(e)
//             res.send((result.result.n === 1) ? { msg: 'success' } : { msg: 'error' })
//         })
// })

const port = process.env.PORT || 4000
app.listen(port)
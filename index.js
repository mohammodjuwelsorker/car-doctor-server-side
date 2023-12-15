const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000  

// middleware 
app.use(express.json())
app.use(cors())

// carDoctor
// tGS7wZKD2LYQLoh0

console.log()

app.get('/', (req, res) => {
   res.send('car doctor server is running')
})


// mongodb config start 
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.qt9rr6u.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db('carDoctor').collection('services')

   //  get the data 
   app.get('/services', async(req, res) => {
      const cursor = servicesCollection.find()
      const result = await cursor.toArray()
      res.send(result)
   })

   // specific id 
   app.get('/services/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const options = {
         // Include only the `title` and `imdb` fields in the returned document
         projection: {title: 1, price: 1 },
      }
      const result = await servicesCollection.findOne(query, options)
      res.send(result)
   })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   //  await client.close();
  }
}
run().catch(console.dir);
// mongodb config end

app.listen(port, () => {
   console.log(`Server started on port: ${port}`);
});
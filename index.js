const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000  ;

// middleware 
app.use(express.json());
app.use(cors({
   origin: ['http://localhost:5173', 'http://localhost:5174'],
   credentials: true
}));
app.use(cookieParser());


app.get('/', (req, res) => {
   res.send('car doctor server is running')
});


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

   //  mongodb services collection 
    const servicesCollection = client.db('carDoctor').collection('services')
   //  mongodb booking collection data push 
   const bookingCollection = client.db('carDoctor').collection('booking')


   
   /*******************jwt********************/ 
   app.post('/jwt', (req, res) => {
      const user = req.body;
      // console.log(user)

      // the token  set
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      // brawer cookies set 
      res.cookie('Access_Token', token, {
         httpOnly: true,
         secure: false
      }).send({Success: true})
   });

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
         // Include only the `title` `price` and `img` fields in the returned document
         projection: {title: 1, price: 1, img:1 },
      }
      const result = await servicesCollection.findOne(query, options)
      res.send(result)
   })

   /************************bookings path created*************************/

   // create booking path 
   app.post('/bookings', async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData)
      res.send(result)
   })

   // get the booking path 
   app.get('/bookings', async (req, res) => {
      console.log('ttt token: ', req.cookies.Access_Token)
      /*****************query start****************/ 
      // the check query syntax: http://localhost:5000/bookings?email=Kusula@gmail.com
      let query = {}
      // if email there area email this . the in query push 
      if(req.query?.email) {
         query = {email: req.query.email}
         // console.log(query)
      }
      /*****************query end****************/ 
      const getBookingData = await bookingCollection.find(query).toArray()
      res.send(getBookingData)
   })

   // update specific with id 
   app.patch('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      console.log(updatedData)
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
         $set: {
            status: updatedData.status
         }
      }
      const result = await bookingCollection.updateOne(filter, updatedDoc)
      res.send(result)
   })

   // delete specific id 
   app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
   })

   // delete id path 
   app.get('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const result = await bookingCollection.findOne(filter)
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
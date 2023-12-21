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

/*****************personal middlewares******************/
const logged = async(req, res, next) => {
   console.log('logged info: ', res.method, req.url, req.hostname, req.pathname)
   next()
}

// verify token middleware 
const verifyToken = (req, res, next) => {
   const token = req.cookies.token
   console.log('middleware tokenL',token)
   // no token available validation check 
   if(!token) {
      return res.status(401).send({message: 'not authorized'})
   }
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      // err check 
      if(err) {
         return res.status(401).send({message: 'unauthorized'})
      }
      // valid decoded 
      // set the decoded 
      req.userEmail = decoded
      // the next work next function is it 
      next()
      
   })
   
   
}
 

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

   //  mongodb services collection 
    const servicesCollection = client.db('carDoctor').collection('services')
   //  mongodb booking collection data push 
   const bookingCollection = client.db('carDoctor').collection('booking')


   
   /*******************jwt auth related api********************/
   app.post('/jwt', (req, res) => {
      const userEmail = req.body;
      console.log('84444 user for email token: ', userEmail.email)

      // the token set the brawer cookies 
      const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res.cookie('token', token, {
         httpOnly: true,
         secure: true,
         sameSite: 'none'
      }).send({success: true})
      
   }); 

   // user logout api 
   app.post('/logout', (req, res) => {
      const userEmail = req.body;
      console.log('logout user email info: ', userEmail)
      res.clearCookie('token', {maxAge: 0}).send({success: true})
   });

   /**********************services related api***************************/
   app.get('/services', async(req, res) => {
      const cursor = servicesCollection.find()
      const result = await cursor.toArray()
      res.send(result)
   })

   // specific id 
   app.get('/services/:id',  async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const options = {
         // Include only the `title` `price` and `img` fields in the returned document
         projection: {title: 1, price: 1, img:1 },
      }
      const result = await servicesCollection.findOne(query, options)
      res.send(result)
   })

   /************************bookings related api*************************/
   // create booking path 
   app.post('/bookings',  async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData)
      res.send(result)
   })

   // get the booking path 
   app.get('/bookings', logged, verifyToken, async (req, res) => {

      console.log("check email: ", req.userEmail?.email + " and " + req.query.email)
      // owner data validation 
      if(req.userEmail.email !== req.query.email) {
         return res.status(403).send({message: 'forbidden access'})
      }
      /*****************query start****************/ 
      // the check query syntax: http://localhost:5000/bookings?email=Kusula@gmail.com
      let query = {}
      // if email there area email this . the in query push 
      // console.log(query)
      if(req.query?.email) {
         query = {email: req.query.email}
         console.log(query)
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
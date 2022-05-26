const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
// const { get } = require('express/lib/response');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const stripe = require("stripe")('sk_test_51L3K1BGmCBN0z0XUOuHywq5iARLGLA7d91veJVvIrU2oVBzzqV37HcmSBsi5L1Hs2V0fGA8GqOnG9zogcXOolKXE00rQdrO8Sy');

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4vvso.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: 'Unauthorization'});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
    if(err){
      res.status(403).send({message: 'Forbidden Access'})
    }
    req.decoded = decoded;
    next();
  });
  // console.log('verify JWT');
}

async function run() {

  try {
    await client.connect();
    const toolsCollection = client.db("manufacturer_care").collection("tools");
    const userCollection = client.db("manufacturer_care").collection("users");
    const orderCollection = client.db("manufacturer_care").collection("ordered");
    const reviewCollection = client.db("manufacturer_care").collection("review");
    const paymentCollection = client.db("manufacturer_care").collection("payments");
    
    // get all services tools
    app.get("/tools", async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    //now get all services
    app.delete('/tools/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: ObjectId(id) }
      const result = await toolsCollection.deleteOne(query);
      res.send(result)

    })
    //now get all services
    app.post('/tools', async (req, res) => {

            const product = req.body;
            console.log(product);
      
            const result = await toolsCollection.insertOne(product);
            res.send(result);
          })

    // get a specific service tool by id
    app.get('/products/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id:ObjectId(id)};
      const result = await toolsCollection.findOne(query);
      res.send(result);
      // console.log(req);
    })

    // my orders
    app.get('/order/:email', async (req, res)=>{
      const email = req.params.email;
      const query ={email:email}
      const cursor = orderCollection.find(query);
      const result = await cursor.toArray()
      res.send(result)
    })
    // delete service from db by id
    app.delete('/order/:id', async (req, res)=>{
      const id = req.params.id;
      const query ={_id:ObjectId(id)}
      const result = await orderCollection.deleteOne(query);
      res.send(result)
    })
    // ordered and save service product in db
    app.post('/order',async(req, res)=>{
      const ordered = (req.body.orderInfo);
      const result = await orderCollection.insertOne(ordered);
      res.send(result);
    })

    app.get('/order/:id', async (req, res)=>{
      const id = req.params.id;
      // console.log(id)
     
         
      const query ={_id:ObjectId(id)}
      const result = await orderCollection.findOne(query);
      res.send(result)
    })
    //all order get now
    app.get('/order', async (req, res) => {
     

            const query = {}
            const cursor = orderCollection.find(query);
            const result = await cursor.toArray()
            res.send(result)
      
      
          })

    app.patch('/order/:id', async (req, res)=>{
      const id = req.params.id;
      const payment=req.body
      const filter ={_id:ObjectId(id)}
      const updateDoc = {
        $set: {
          paid:true,
          TransitionId:payment.transactionId
        },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);
      const result1 = await paymentCollection.insertOne(payment);
      res.send({result:result, result1:result1});
    
    })

    // add review
    app.post('/review',async(req, res)=>{
      const review =req.body;
      // console.log(review);
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    })

    app.get("/review", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // user create and save information to database
    app.put('/user/:email', async(req, res) => {
      const user = req.body;
      if(user ){
        // console.log( user.email, user.displayName)
        const email = user.email
        const filter = {email: email};
        const options = { upsert: true };

        const updateDoc = {
          $set:{email: email, displayName: user.displayName},
        };
        const result = await userCollection.updateOne(filter, updateDoc, options);
        const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET);
        res.send({result, token});
      }
    })
    app.post("/payment", async (req, res) => {
        
      const price = parseInt(req.body.totalprice)
      // console.log(price)
      const amount = price * 100;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
    
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    })
    //now users
    app.get('/user', async (req, res) => {

            const query = {};
            const cursor = userCollection.find(query);
            const result = await cursor.toArray()
            res.send(result)
          })
         //now for create new admin 
          app.put('/user/admin/:id', async (req, res) => {
      const email = req.params.id;
      const admin = req.body.admin

      const query = { email: email }
      const options = { upsert: true };
      const user = {
        $set: {
          rule: admin.rule
        },
      };
      const result = await userCollection.updateOne(query, user, options);
      res.send(result)
    })
    //now for admin remove 
    app.patch('/user/admin/:id', async (req, res) => {
      const email = req.params.id;
      const query = { email: email }
      const result = await userCollection.findOne(query);




    })
     app.get('/user/:id', async (req, res) => {
      const email = req.params.id;

      const query = { email: email }
      const result = await userCollection.findOne(query);
      res.send(result)
    })


  } 
  finally {

  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World! Server is Running');
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
})
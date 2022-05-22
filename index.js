const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());

//user:jubayer5230
//pas: bpdDGrsOA6HawuOn

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4vvso.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    console.log('connect database')
    const toolsCollection = client.db("manufacturer_care").collection("tools");
    const userCollection = client.db("manufacturer_care").collection("users");
    
    // get all services tools
    app.get("/tools", async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // user create
    app.put('/user/:email', async(req, res) => {
      const email = req.params.email;

      const user = req.body;
      console.log(email, user)
      const filter = {email: email};
      const options = { upsert: true };

      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET);
      res.send({result, token});
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
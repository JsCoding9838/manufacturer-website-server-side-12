const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { get } = require('express/lib/response');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

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
    
    // get all services tools
    app.get("/tools", async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // get a specific service tool by id
    app.get('/products/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id:ObjectId(id)};
      const result = await toolsCollection.findOne(query);
      res.send(result);
      console.log(req);
    })


    // user create
    app.put('/user/:email', async(req, res) => {
      
   
     
      const user = req.body;
      if(user ){
        console.log( user.email, user.displayName)
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
const express = require('express');
const app = express()
const cors = require('cors')
require('dotenv').config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = require('./diu-buisness-hub-firebase-adminsdk-fbsvc-c9a65a7ac9.json');

initializeApp({
  credential: cert(serviceAccount)
});


//middleware 

app.use(express.json());
app.use(cors());

const verifyToken =async(req,res,next)=>{
    const token = req.headers.authorization;
    // console.log(token);

    if(!token){
        return res.status(401).send({
            message: "Unauthorized"
        });
    }

    try{
        const auth = getAuth();

        const idToken = token.split(' ')[1]
       const decode = await auth.verifyIdToken(idToken);
        req.decoded_email = decode.email;
        next();

    }
    catch(error){
        return res.status(401).send({message:"unauthorized access"});
    }
}

//mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.etvdx8p.mongodb.net/?appName=Cluster0`;

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
    const db=client.db('diu_business-hub');

    const userCollection = db.collection('users');
    const businessCollection =db.collection('business');

    //users related api 

    app.get('/users',async(req,res)=>{

    })

    app.post('/users',async(req,res)=>{
        const user = req.body;
        const email = user.email;
        user.role = 'user';
        user.createAt=new Date();

        const userExisted = await userCollection.findOne({email});

        if(userExisted){
            return res.send({message:'user is already existed'})
        }


        const result = await userCollection.insertOne(user);
        res.send(result);
    })

    // Business related api 

    app.get('/business',verifyToken,async(req,res)=>{

        const status = req.query.status;
        let query = {};

        if(status){
            query.status = status;
        }
        
        const result = await businessCollection.find(query).toArray();

        res.send(result);
    })

   app.post('/business', verifyToken, async(req,res)=>{

    try {

        const businessData = req.body;

        const user = await userCollection.findOne({
            email: req.decoded_email
        });

        if(!user){
            return res.status(404).send({
                message:"User not found"
            });
        }

        const business = {
            ...businessData,
            userId: user._id,
            status:"pending",
            createdAt:new Date()
        };


        const result = await businessCollection.insertOne(business);

        res.send(result);

    } catch(error){

        console.log(error);

        res.status(500).send({
            message:"Internal server error"
        });
    }

});



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
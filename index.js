const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
const ObjectID = require("mongodb").ObjectID;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5nuaz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("doctors"));
app.use(fileUpload());

const port = 5000;

app.get("/", (req, res) => {
  res.send("hello from db it's working working");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const serviceCollection = client
    .db(process.env.DB_NAME)
    .collection("services");
  const adminCollection = client.db(process.env.DB_NAME).collection("admin");
  const orderCollection = client.db(process.env.DB_NAME).collection("orders");
  const reviewCollection = client.db(process.env.DB_NAME).collection("reviews");

  app.get("/services", (req, res) => {
    serviceCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.post("/addService", (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const price = req.body.price;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };

    serviceCollection.insertOne({ title, price, image }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.delete("/deleteService/:id", (req, res) => {
    const id = ObjectID(req.params.id);
    serviceCollection
      .findOneAndDelete({ _id: id })
      .then((documents) => res.send(!!documents.value));
  });
  app.get("/reviews", (req, res) => {
    reviewCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.post("/addReview", (req, res) => {
    const review = req.body;
    reviewCollection.insertOne(review).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

 

  app.post("/isAdmin", (req, res) => {
    const email = req.body.email;
    adminCollection.find({ email: email }).toArray((err, doctors) => {
      res.send(doctors.length > 0);
    });
  });
  app.post("/addAdmin", (req, res) => {
    const email = req.body.email;
    adminCollection.insertOne({ email: email }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  app.post("/createOrder", (req, res) => {
    const newOrder = req.body;
    orderCollection.insertOne(newOrder).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  app.post("/orders", (req, res) => {
    const email = req.body.email;
    adminCollection.find({ email: email }).toArray((err, admins) => {
      const filter = {};
      if (admins.length === 0) {
        filter.email = email;
      }
      orderCollection.find(filter).toArray((err, documents) => {
        res.send(documents);
      });
    });
  });
  app.patch("/orderUpdate/:id", (req, res) => {
    const id = ObjectID(req.params.id);
    orderCollection
      .updateOne({ _id: id }, { $set: { orderStatus: req.body.status } })
      .then((result) => res.send(result.modifiedCount > 0));
  });
});

app.listen(process.env.PORT || port);

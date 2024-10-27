const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tdjlbxg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log("URI", uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const usersCollection = client.db("coffeeshopwebsite").collection("users");
    const menuCollection = client.db("coffeeshopwebsite").collection("menu");
    const cartCollection = client.db("coffeeshopwebsite").collection("carts");
    const wishlistCollection = client
      .db("coffeeshopwebsite")
      .collection("wishlists");

    // user related api
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      console.log("existingUser", existingUser);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const { email } = req.query; // Destructure email from query parameters

      try {
        let result;
        if (email) {
          // If email is provided, find user by email
          result = await usersCollection.findOne({ email: email });
          if (!result) {
            return res.status(404).send({ message: "User not found" });
          }
        } else {
          // If no email is provided, return all users
          result = await usersCollection.find().toArray();
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });
    // menu related api
    app.get("/menu", async (req, res) => {
      try {
        // Retrieve menu items from the database or another data source
        const menuItems = await menuCollection.find().toArray();
        res.json(menuItems);
      } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ error: true, message: "An error occurred" });
      }
    });

    // cart related api
    app.post("/carts", async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });
    // verifyJWT add korte hobe
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const { quantity, address, phone, countryCode } = req.body;

      // Validate quantity to ensure it's at least 1
      if (quantity < 1) {
        return res.status(400).send({ message: "Quantity must be at least 1" });
      }

      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          quantity: quantity, // Update quantity
          address: address, // Update address
          phone: phone, // Update phone number
          countryCode: countryCode, // Update country code
        },
      };

      try {
        const result = await cartCollection.updateOne(query, update);
        console.log("update result:", result);
        if (result.modifiedCount === 1) {
          res.send({ message: "Cart updated successfully" });
        } else {
          res.status(404).send({ message: "Item not found" });
        }
      } catch (error) {
        console.error("Error updating cart:", error);
        res
          .status(500)
          .send({ message: "An error occurred while updating cart" });
      }
    });

    // wishlist related api
    app.post("/wishlists", async (req, res) => {
      const cartItem = req.body;
      const result = await wishlistCollection.insertOne(cartItem);
      console.log(result);
      res.send(result);
    });

    // verifyJWT add korte hobe
    app.get("/wishlists", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/wishlists/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
    });
    
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Coffee Shop Website server side is running");
});
app.listen(port, () => {
  console.log(`Coffee Shop Website server side is running on port ${port}`);
});

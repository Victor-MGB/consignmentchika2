const express = require("express");
const mongoose = require("mongoose");
const query = require("node:querystring");
const cors = require("cors");
const bodyParser = require("body-parser");
const UserModel = require("./Users_module/UserSchema");
require("dotenv").config();

const app = express();

const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.DB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("MongoDb connection error:", error);
});

db.once("open", () => {
  console.log("connected to mongoDb");
});

// Id NumberGenerator
const IdGen = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
};

// Function to generate a unique ID
const generateUniqueID = () => {
  // Implement your unique ID generation logic here
  // For simplicity, using a timestamp as an example
  return Date.now().toString();
};

app.post("/Register", async (req, res) => {
  try {
    const userData = req.body;

    // Check if the email already exists
    const existingUser = await UserModel.findOne({
      "bioData.email": userData.email,
    });
    if (existingUser) {
      // Email already exists, return a conflict response
      return res.status(409).json({
        message: "User already registered",
        user: existingUser.toObject(),
      });
    }

    // Generate a unique ID
    userData.ID = generateUniqueID();

    // Create a new user with the provided details
    const savedUser = await new UserModel({
      ID: userData.ID,
      bioData: {
        fullName: userData.fullName,
        email: userData.email,
        userName: userData.userName,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        DOB: userData.DOB,
        permanentAddress: userData.permanentAddress,
        password: userData.password,
      },
      parcels: [],
    }).save();

    res.status(201).json({
      message: "New user registered successfully",
      user: savedUser.toObject(),
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if either email and password is provided
    if (!email && !password) {
      return res
        .status(400)
        .json({ error: "Email or password is required for login" });
    }

    // Find the user based on email and password
    const user = await UserModel.findOne({
      $And: [{ "bioData.email": email }, { "bioData.password": password }],
    });

    // Check if the user exists
    if (user) {
      // Generate a token with 20 characters
      const token = IdGen(20);

      // You may want to save the token in the user document for future use
      user.token = token;
      await user.save();

      // Return success message, user details, and the token
      res.status(200).json({
        message: "Login successful",
        user: user.toObject(),
        token: token,
      });
    } else {
      // User not found
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/Parcels", async (req, res) => {
  try {
    const { userID, data } = req.body;

    const missingFields = [];
    if (userID === undefined) {
      missingFields.push("userID");
    }
    if (data.destination === undefined) {
      missingFields.push("destination");
    }
    if (data.sender === undefined) {
      missingFields.push("sender");
    }
    if (data.recipient === undefined) {
      missingFields.push("receiver");
    }
    if (data.coordinates === undefined) {
      missingFields.push("coordinates");
    } else {
      if (data.coordinates.lat === undefined) {
        missingFields.push("coordinates.lat");
      }
      if (data.coordinates.lon === undefined) {
        missingFields.push("coordinates.lon");
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
        requestBody: `the body of the request ${req.body}`,
      });
    }

    const foundUser = await UserModel.findOne({ ID: userID });

    if (foundUser) {
      const newParcel = {
        parcelLocation: data.destination,
        sender: data.sender,
        receiver: data.recipient,
        trackingNumber: IdGen(15),
        coordinates: {
          lat: data.coordinates.lat,
          lon: data.coordinates.lon,
        },
      };

      foundUser.parcels.push(newParcel);
      const savedUser = await foundUser.save();

      res.status(200).json({
        message: "Parcel added to user successfully",
        user: savedUser,
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error adding parcel:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/updateCoordinates", async (req, res) => {
  try {
    const { userId, parcelId, coordinates } = req.body;
    console.log("Request received:", { userId, parcelId, coordinates });

    const user = await UserModel.findOne({ ID: userId });
    console.log("User found:", user);

    if (!user) {
      console.error("User not found. UserId:", userId);
      return res
        .status(404)
        .json({ error: "User not found", dataRecieved: req.body });
    }

    const parcelIndex = user.parcels.findIndex(
      (p) => p.trackingNumber === parcelId,
    );

    console.log("ParcelIndex:", parcelIndex);

    if (parcelIndex === -1) {
      console.error("Parcel not found. User:", user, "ParcelId:", parcelId);
      return res.status(404).json({ error: "Parcel not found" });
    }

    console.log("Updating coordinates...");
    user.parcels[parcelIndex].coordinates = {
      lat: coordinates.lat,
      lon: coordinates.lon,
    };

    const savedUser = await user.save();
    console.log("Coordinates updated. User:", savedUser);

    res.status(200).json({
      message: "Parcel coordinates updated successfully",
      user: savedUser,
    });
  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/userParcels", async (req, res) => {
  try {
    const userID = req.query.data;

    // Check if user ID is provided
    if (!userID) {
      console.error("No user ID provided in the query parameters");
      return res.status(400).json({ error: "No user ID provided" });
    }

    // Find user in the database based on userId
    const user = await UserModel.findOne({ ID: userID });

    // Check if the user exists
    if (!user) {
      console.error("User not found. UserID:", userID);
      return res.status(404).json({ error: `User not found`, UserID: userID });
    }

    // Extract user's parcels
    const userParcels = user.parcels;

    // Check if the user has any parcels
    if (!userParcels || userParcels.length === 0) {
      return res.status(200).json({
        message: "User has no parcels",
        userParcels: [],
      });
    }

    // Respond with success message and user's parcels
    res.status(200).json({
      message: "User parcels retrieved successfully",
      userParcels: userParcels,
    });
  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

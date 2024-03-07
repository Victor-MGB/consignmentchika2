const http = require("http");
const Model = require("../Users_module/UserSchema");

const server = http.createServer((req, res) => {
  let userInfo = "";

  //this function is responsible for creating new users
  //with the information from request body.
CreateUser = (bio_data, parcel) => {
  // Id NumberGenerator
  const IdGen = (length) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      // Generate a random index to pick a character from the characters string
      const randomIndex = Math.floor(Math.random() * characters.length);
      // Append the randomly picked character to the result string
      result += characters.charAt(randomIndex);
    }
    return result;
  };

  let fullName,
    email,
    userName,
    phoneNumber,
    DOB,
    permanentAddress,
    destination,
    Sender,
    Reciever,
    coordinates;

  if (bio_data) {
    // destructure the required for updating the bio-data field from
    // information parameter
    ({ fullName, email, userName, phoneNumber, DOB, permanentAddress } =
      bio_data);
  }

  if (parcel) {
    // destructure the required for updating the parcel field from
    // information parameter
    ({ destination, Sender, Reciever, coordinates } = parcel);
  }

  // Check if all required biodata fields are provided
  if (
    !fullName ||
    !email ||
    !userName ||
    !phoneNumber ||
    !DOB ||
    !permanentAddress
  ) {
    throw new Error("Incomplete biodata. Please provide all required fields.");
  }

  const user = {
    BIO_DATA: {
      fullName: fullName,
      email: email,
      userName: userName,
      phoneNumber: phoneNumber,
      address: permanentAddress, // Assuming this should be permanentAddress instead of phoneNumebr
      DOB: DOB,
      permanentAddress: permanentAddress,
    },
    // id for getting this user
    ID: IdGen(5),

    // parcel shipped by this user if parcel information is provided
    PARCEL: parcel
      ? [
          {
            parcelLocation: destination,
            Sender: Sender,
            Reciever: Reciever,
            TrackingNumber: IdGen(15),
            coordinates: { Lat: coordinates.Lat, lon: coordinates.lon },
          },
        ]
      : [], // If parcel information is not provided, set PARCEL to an empty array
  };

  return user;
};


  req.on("data", (chunk) => {
    userInfo += chunk.toString();
  });

  req.on("end", () => {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    console.log("user Request", userInfo);

    //valid Routes
    const Route = "/Register" || "Parcel";

    if (req.url === Route && req.method === "POST") {
      // Parse the received JSON data
      const userData = JSON.parse(userInfo);

      // Create user using CreateUser function
      const newUser = CreateUser(userData);
      Model.create(newUser);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "User registered successfully",
          user: newUser,
        }),
      );

      //PARCEL route
    } else if (req.url === Route && req.method === "POST") {
      // Retrieve data parameters for updating parcel
      const { userID, destination, sender, receiver, coordinates } = userInfo;

      // Find the user in the database
      Model.findOne({ ID: userID }, (err, user) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        } else if (!user) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "User not found" }));
        } else {
          // Modify the parcel property
          const newParcel = {
            parcelLocation: destination,
            Sender: sender,
            Reciever: receiver,
            TrackingNumber: IdGen(15),
            coordinates: { Lat: coordinates.Lat, lon: coordinates.lon },
          };
          user.PARCEL.push(newParcel);

          // Save the modified user object back to the database
          user.save((err) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Internal server error" }));
            } else {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Parcel added to user successfully",
                  user: user,
                }),
              );
            }
          });
        }
      });
    } else {
      // If the route is not found or the method is not allowed
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });
});

// Set the port to listen on
const PORT = process.env.PORT || 4500;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

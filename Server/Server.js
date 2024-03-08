const http = require("http");
const Model = require("../Users_module/UserSchema");

const mock_DB = [];
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
const server = http.createServer((req, res) => {
  let userInfo = "";

  //this function is responsible for creating new users
  //with the information from request body.
  const CreateUser = (bio_data, parcel) => {
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
      throw new Error(
        "Incomplete biodata. Please provide all required fields."
      );
    }

    const user = {
      BIO_DATA: {
        fullName: fullName,
        email: email,
        userName: userName,
        phoneNumber: phoneNumber,
        address: permanentAddress, 
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
      "Content-Type, Authorization"
    );

    switch (req.url) {
      case "/Register":
        //REGISTERATION ENDPOINT ------------------------------------------------------------------------------------------------------------------------------------------------
        if (req.method === "POST") {
          // Parse the received JSON data
          const userData = JSON.parse(userInfo);

          // Create user using CreateUser function
          const newUser = CreateUser(userData);

          //since DB is not available for now. i will use a mocked DB
          const newDbData = mock_DB.push(newUser);
        
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: "User registered successfully",
              user: newUser,
              DBSize: newDbData,
            })
          );
        }
        break;

      case "/Parcels":
        // POST NEW PARCEL ----------------------------------------------------------------------------------------------------------------------------------------------------
        if (req.method === "POST") {
          // Retrieve data parameters for updating parcel
          const { userID, destination, sender, receiver, coordinates } =
            JSON.parse(userInfo);

          // Find the user in the mock database
          const foundUserIndex = mock_DB.findIndex(
            (user) => user.ID === userID
          );

          if (foundUserIndex !== -1) {
            // User found in the database
            const newParcel = {
              parcelLocation: destination,
              Sender: sender,
              Reciever: receiver,
              TrackingNumber: IdGen(15),
              coordinates: { Lat: coordinates.lat, lon: coordinates.lon },
            };

            // Add the new parcel to the user's PARCEL array
            mock_DB[foundUserIndex].PARCEL.push(newParcel);

            // Respond with success message and updated user data
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Parcel added to user successfully",
                user: mock_DB[foundUserIndex],
              })
            );
          } else {
            // User not found in the database
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "User not found" }));
          }
        }
        break;

      case "/updateCoordinates":
        // updates parcel coordinates ENDPOINT---------------------------------------------------------------------------------------------------------------------------------
        if (req.method === "PUT") {
          const { userId, parcelId, coordinates } = JSON.parse(userInfo);
          const user = mock_DB.find((user) => user.ID === userId);
          if (user) console.log(user);
          if (user) {
            const parcelIndex = user.PARCEL.findIndex(
              (p) => p.TrackingNumber === parcelId
            );

            const newCoordinates = {
              lat: coordinates.lat,
              lon: coordinates.lon,
            };

            if (parcelIndex === -1) {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Parcel not found" }));
            } else {
              user.PARCEL[parcelIndex].coordinates = newCoordinates;
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Parcel coordinates updated successfully",
                  user: user,
                })
              );
            }
          } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "User not found" }));
          }
        }
        break;
      case "/users":
        if (req.method === "GET") {
          // Query the database for all registered users
          let Users = mock_DB.map((user) => {
            return user;
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(Users));

          //TODO: Remember to uncomment
          // Model.find({}, (err, users) => {
          //   if (err) {
          //     res.writeHead(500, { "Content-Type": "application/json" });
          //     res.end(JSON.stringify({ error: "Internal server error" }));
          //   } else {
          //     // Send the list of registered users as a response
          //     res.writeHead(200, { "Content-Type": "application/json" });
          //     res.end(JSON.stringify(users));
          //   }
          // });
        }
        break;

      default:
        // If the route is not found or the method is not allowed
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        break;
    }
  });
});

// Set the port to listen on
const PORT = process.env.PORT || 4500;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

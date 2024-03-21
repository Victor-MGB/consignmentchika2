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

  req.on("end", async () => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    switch (req.url) {
      case "/Register":
        if (req.method === "POST") {
          const userData = JSON.parse(userInfo);
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
        if (req.method === "POST") {
          const { userID, destination, sender, receiver, coordinates } =
            JSON.parse(userInfo);

          try {
            const foundUser = await UserModel.findOne({ ID: userID });

            if (foundUser) {
              const newParcel = {
                parcelLocation: destination,
                Sender: sender,
                Reciever: receiver,
                TrackingNumber: IdGen(15),
                coordinates: { Lat: coordinates.lat, lon: coordinates.lon },
              };

              foundUser.PARCEL.push(newParcel);
              const savedUser = await foundUser.save();

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Parcel added to user successfully",
                  user: savedUser,
                })
              );
            } else {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "User not found" }));
            }
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        }
        break;


      case "/updateCoordinates":
        if (req.method === "PUT") {
          const { userId, parcelId, coordinates } = JSON.parse(userInfo);

          try {
            const user = await UserModel.findOne({ ID: userId });

            if (user) {
              const parcelIndex = user.PARCEL.findIndex(
                (p) => p.TrackingNumber === parcelId
              );

              if (parcelIndex === -1) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Parcel not found" }));
              } else {
                user.PARCEL[parcelIndex].coordinates = {
                  lat: coordinates.lat,
                  lon: coordinates.lon,
                };

                const savedUser = await user.save();

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    message: "Parcel coordinates updated successfully",
                    user: savedUser,
                  })
                );
              }
            } else {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "User not found" }));
            }
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        }
        break;


      case "/users":
        if (req.method === "GET") {
          try {
            const users = await UserModel.find({});
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(users));
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        }
        break;

      default:
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


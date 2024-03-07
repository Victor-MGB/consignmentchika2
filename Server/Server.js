const http = require("http");
const CreateUser = require("./CreateUser");
const Model = require("../Users_module/UserSchema");

const server = http.createServer((req, res) => {
  let userInfo = "";

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

    // Check if the request is for user registration
    const registerRoute = "/register";
    const getAndUpdateRoute = "/user/updateParcel"; // New route for getting and updating user parcel
    if (req.url === registerRoute && req.method === "POST") {
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
    } else if (req.url === getAndUpdateRoute && req.method === "PUT") {
      // Assuming the request body contains the user ID and updated parcel information
      const requestData = JSON.parse(userInfo);
      const userID = requestData.userID;
      const updatedParcel = requestData.updatedParcel;

      // Find the user by ID and update the parcel property
      Model.findOneAndUpdate(
        { ID: userID },
        { $set: { PARCEL: updatedParcel } },
        { new: true }, // Return the updated document
        (err, user) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Internal Server Error" }));
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Parcel updated successfully",
                user: user,
              }),
            );
          }
        },
      );
    } else {
      // If the route is not found or the method is not allowed
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });
});

// Set the port to listen on
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

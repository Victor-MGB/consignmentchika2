//this function is responsible for creating new users
//with the information from request body.

module.export = CreateUser = (Information) => {
  //Id NumberGenerator
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

  //destructure the required for updating the bio-data field from
  //information parameter
  const { fullName, email, userName, phoneNumebr, DOB, permanentAddress } =
    Information;

  //destructure the required for updating the parcel field from
  //information parameter

  const { destination, Sender, Reciever, TrackingNumber, coordinates } =
    Information;

  const user = {
    BIO_DATA: {
      fullName: fullName,
      email: email,
      userName: userName,
      phoneNumebr: phoneNumebr,
      address: phoneNumebr,
      DOB: DOB,
      permanentAddress: permanentAddress,
    },
    //id for getting this user
    ID: IdGen(5),

    //parcel shipped by this user
    PARCEL: [
      {
        parcelLocation: destination,
        Sender: Sender,
        Reciever: Reciever,
        TrackingNumber: IdGen(15),
        coordinates: { Lat: coordinates.Lat, lon: coordinates.lon },
      },
    ],
  };
  return user;
};

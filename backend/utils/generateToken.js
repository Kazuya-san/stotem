import jwt from "jsonwebtoken";

const generateToken = (id, isOrganizer, isAdmin) => {
  return jwt.sign({ id, isOrganizer, isAdmin }, process.env.JWT_SECRET);
};

export default generateToken;

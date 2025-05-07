import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("🔐 Chiamato middleware auth");
  console.log("Header ricevuto:", req.headers.authorization);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Autenticazione non valida' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    return next();
  } catch (err) {
    res.status(403).json({ message: 'Token di autenticazione non valido' });
  }
};

export default authMiddleware;
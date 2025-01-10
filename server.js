import express from "express";
import orderRoutes from "./routes/orders.js";

const app = express();
const port = process.env.PORT || 8000;

// request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// mount routes
app.use("/api", orderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

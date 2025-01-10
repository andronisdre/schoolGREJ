import express from "express";
import { EventEmitter } from "events";
import fs from "fs";
import path from "path";

const router = express.Router();
const eventEmitter = new EventEmitter();

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const decodedDirName = decodeURIComponent(__dirname);

const ordersFilePath = path.join(decodedDirName, "orders.json");

const readOrdersFromFile = () => {
  try {
    const data = fs.readFileSync(ordersFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading orders file:", err);
    return [];
  }
};

const writeOrdersToFile = (orders) => {
  try {
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error("Error writing orders to file:", err);
  }
};

let orders = readOrdersFromFile();
let lastOrderId = orders.length > 0 ? orders[orders.length - 1].id : 0;

// 1
router.post("/orders", (req, res) => {
  const order = {
    id: ++lastOrderId,
    items: req.body.items,
    customerId: req.body.customerId,
    totalAmount: req.body.items.reduce((sum, item) => sum + item.price, 0),
    status: "pending",
    createdAt: new Date(),
  };

  orders.push(order);
  writeOrdersToFile(orders);
  res.status(201).json(order);
});

// 2
router.get("/orders/:id", (req, res) => {
  const order = orders.find((o) => o.id === parseInt(req.params.id));
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

// 3
router.patch("/orders/:id", (req, res) => {
  const order = orders.find((o) => o.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  setTimeout(() => {
    Object.assign(order, req.body);
    order.updatedAt = new Date();
    res.json(order);
  }, Math.random() * 1000);
});

// 4
router.post("/orders/:id/process", (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  console.log(
    "Antal lyssnare före:",
    eventEmitter.listenerCount("orderProcessed")
  );

  eventEmitter.on("orderProcessed", (processedOrder) => {
    if (processedOrder.id === order.id) {
      order.status = "processed";
      order.processedAt = new Date();
    }
  });

  console.log(
    "Antal lyssnare efter:",
    eventEmitter.listenerCount("orderProcessed")
  );

  eventEmitter.emit("orderProcessed", order);

  console.log("Minnesförbrukning:", process.memoryUsage());

  res.json(order);
});

// 5
router.post("/orders/:id/calculate", (req, res) => {
  const order = orders.find((o) => o.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  let result = 0;
  for (let i = 0; i < order.items.length; i++) {
    result += calculate(order.items[i]);
  }

  order.calculatedValue = result;
  writeOrdersToFile(orders);
  res.json(order);
});

// 6
router.get("/orders", (req, res) => {
  const { customerId, status } = req.query;
  let result = orders;

  if (customerId) {
    result = result.filter((o) => o.customerId === customerId);
  }
  if (status) {
    result = result.filter((o) => o.status === status);
  }

  res.json(result);
});

// 7
router.put("/orders/:id", (req, res) => {
  let orders = readOrdersFromFile();

  const index = orders.findIndex((o) => o.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  orders[index] = {
    ...orders[index],
    ...req.body,
    updatedAt: new Date(),
  };

  writeOrdersToFile(orders);

  res.json(orders[index]);
});

// 8
let isProcessing = false;
router.post("/orders/bulk-process", (req, res) => {
  let orders = readOrdersFromFile();

  if (isProcessing) {
    return res.status(409).json({ error: "Processing in progress" });
  }

  isProcessing = true;
  try {
    orders.forEach((order) => {
      order.processed = true;
      order.processedAt = new Date();
    });

    writeOrdersToFile(orders);

    res.json({ success: true });
  } finally {
    isProcessing = false;
  }
});

// 9
router.post("/orders/link/:id", (req, res) => {
  let orders = readOrdersFromFile();
  const order = orders.find((o) => o.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  order.relatedOrder = order;

  res.json(order);
});

// 10
let processingOrders = new Set();

router.post("/orders/:id/start-process", (req, res) => {
  const orderId = parseInt(req.params.id);

  if (processingOrders.has(orderId)) {
    return res.status(409).json({ error: "Already processing" });
  }

  processingOrders.add(orderId);

  setTimeout(() => {
    processingOrders.delete(orderId);
    res.json({ success: true });
  }, 5000);
});

// Hjälpfunktion
function calculate(item) {
  let result = 0;
  for (let i = 0; i < 10000; i++) {
    result += item.price * item.quantity;
  }
  return result;
}

export default router;

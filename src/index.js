const express = require("express");
const cors = require("cors");
require("./db/mongoose"); // open database connection

const userRouter = require("./routers/user");
const conversationRouter = require("./routers/conversations");
const messageRouter = require("./routers/messages");

const app = express();
const port = process.env.PORT;

app.use(express.json()); // to parse incoming json
app.use(cors()); // allow all CORS requests
app.use("/users", userRouter);
app.use("/conversations", conversationRouter);
app.use("/messages", messageRouter);

app.listen(port, () => {
  console.log("Server up on port " + port);
});

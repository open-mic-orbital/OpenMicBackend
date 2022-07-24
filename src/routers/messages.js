const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// New Message
router.post("/", async (req, res) => {
  const newMessage = new Message(req.body);

  try {
    const savedMessage = await newMessage.save();
    return res.status(200).json(savedMessage);
  } catch (e) {
    res.status(500).json(e);
  }
});

// Get messages
router.get("/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });
    res.status(200).json(messages);
  } catch (e) {
    res.status(500).json(e);
  }
});
module.exports = router;

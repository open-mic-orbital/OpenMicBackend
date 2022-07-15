const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");

// New Conversation

router.post("/", async (req, res) => {
  const newConversation = new Conversation({
    members: [req.body.senderId, req.body.receiverId],
  });

  try {
    const savedConversation = await newConversation.save();
    return res.status(200).json(savedConversation);
  } catch (e) {
    res.status(500).json(e);
  }
});

// Get user conversations

router.get("/:userId", async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.userId] },
    });
    res.status(200).json(conversation);
  } catch (e) {
    res.status(500).json(e);
  }
});

module.exports = router;

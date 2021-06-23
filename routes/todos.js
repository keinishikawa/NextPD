const express = require("express");
const router = express.Router();
const controller = require("../controllers/todos");

router.get("/",(req,res) =>{
    controller.getTodos;
})

module.exports = router;
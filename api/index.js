const express = require("express");

const app = express();

app.get('*', async (req, res) => {
  res.json("normal day Database is down");
});

app.listen(1337, () => console.log("Server ready on port 1337."));

module.exports = app;

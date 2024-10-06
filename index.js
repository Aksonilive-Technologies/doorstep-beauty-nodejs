
 const app = require("./routes/apiRoute");
 const port = 3000;
 const AppError = require("./utility/appError");
 



app.get("/", (req, res) => {
  return res.send("Hello Beauty!");
});

app.all('*', async (request, response, next) => {
  return response.status(404).json({
    success: false,
    message: "Can't find " + request.originalUrl + " on this server",
  })
});

// Register SIGINT event listener
process.on('SIGINT', async () => {
  process.exit();
});
 

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


 

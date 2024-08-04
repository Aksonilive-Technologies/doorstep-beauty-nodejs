
 const app = require("./routes/apiRoute");
 const port = 5000;
 const AppError = require("./utility/appError");
 



app.get("/", (req, res) => {
  return res.send("Hello Beauty!");
});

app.all('*', async (request, response, next) => {
  next(new AppError(`Can't find ${request.originalUrl} on this server`, 404));
});

// Register SIGINT event listener
process.on('SIGINT', async () => {
  process.exit();
});
 

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


 

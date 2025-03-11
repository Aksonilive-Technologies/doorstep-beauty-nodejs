import cron from "node-cron";
import Product from "./model/product.model.js";

// Schedule job: Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  await Product.updateMany(
    { createdAt: { $lt: oneMonthAgo }, isnew: true },
    { $set: { isnew: false } }
  );
});
import cron from "node-cron";
import Booking from "../model/booking.model.js";

// Schedule: Runs every hour
cron.schedule("0 0 * * *", async () => {
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago

    await Booking.updateMany(
      {
        status: "cancelled",
        isActive: true,
        updatedAt: { $lt: cutoffTime },
      },
      { $set: { isActive: false } }
    );
});

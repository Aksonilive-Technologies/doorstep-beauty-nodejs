import cron from "node-cron";
import Offer from "./model/offers.model.js";

// Function to convert "DD/MM/YYYY" string to Date object
const parseOfferValidity = (validityString) => {
  const [day, month, year] = validityString.split("/").map(Number);
  return new Date(year, month - 1, day); // Month is 0-indexed in JavaScript
};

// Schedule job: Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  const now = new Date();

  // Fetch all active offers
  const offers = await Offer.find({ isActive: true });

  for (const offer of offers) {
    if (offer.offerValidity) {
      const offerExpiryDate = parseOfferValidity(offer.offerValidity);
      if (offerExpiryDate < now) {
        await Offer.updateOne({ _id: offer._id }, { $set: { isActive: false } });
        }
    }
  }
});

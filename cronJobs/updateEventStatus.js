const cron = require("node-cron");
const Event = require("../models/Event");

// Cron job: Every 5 minutes check for expired events
cron.schedule("*/5 * * * *", async () => {
  console.log("⏳ Checking for expired events...");

  try {
    const result = await Event.updateMany(
      {
        is_live: true,
        expires_at: { $lt: new Date() },
      },
      {
        $set: { is_live: false },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ ${result.modifiedCount} event(s) marked as expired.`);
    }
  } catch (error) {
    console.error("Error updating event statuses:", error.message);
  }
});

import cron from "node-cron";

export const startCronJobs = () => {
  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("Running daily cron job...");

      // Add your database cleanup/update logic here

      console.log("Daily cron job completed");
    } catch (error) {
      console.error("Daily cron job failed:", error.message);
    }
  });

  // Runs every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("Running 5-minute cron job...");

      // Add your logic here

      console.log("5-minute cron job completed");
    } catch (error) {
      console.error("5-minute cron job failed:", error.message);
    }
  });

  console.log("Cron jobs started");
};

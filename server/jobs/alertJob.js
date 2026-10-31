import cron from "node-cron";
import Supplier from "../models/supplier.js";
import Household from "../models/household.js";
import Alert from "../models/alert.js";
import { predictRunout } from "../services/prediction.js";

const buildMessage = (name, daysLeft) => {
  if (daysLeft < 0) return `${name} is overdue by ${-daysLeft} day(s)`;
  if (daysLeft === 0) return `${name} runs out today`;
  return `${name} runs out in ${daysLeft} day(s)`;
};

// Checks one supplier's households and saves new alerts. Returns how many were created.
export async function runAlertCheck(supplierId) {
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) return 0;
  const globalLeadDays = supplier.settings?.alertLeadDays ?? 5;


  const households = await Household.find({
    supplier: supplierId,
    alertedForCycle: { $ne: true },
  });

  let created = 0;
  for (const h of households) {
    const p = predictRunout(h);
    if (p.daysLeft === null) continue; 

    const leadDays = h.alertLeadDays ?? globalLeadDays;
    if (p.daysLeft > leadDays) continue;

    await Alert.create({
      supplier: supplierId,
      household: h._id,
      message: buildMessage(h.name, p.daysLeft),
      daysLeft: p.daysLeft,
    });
    h.alertedForCycle = true;
    await h.save();
    created++;
  }
  return created;
}

async function runAlertCheckForAll() {
  const suppliers = await Supplier.find({}, "_id");
  let total = 0;
  for (const s of suppliers) {
    total += await runAlertCheck(s._id);
  }
  return total;
}

export function startAlertJob() {
  cron.schedule(
    "0 8 * * *",
    async () => {
      try {
        const total = await runAlertCheckForAll();
        console.log(`Alert job finished: ${total} new alert(s)`);
      } catch (err) {
        console.error("Alert job failed:", err.message);
      }
    },
    { timezone: "Asia/Kolkata" }
  );
  console.log("Alert job scheduled for 08:00 daily (Asia/Kolkata)");
}
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Supplier from "../models/supplier.js";
import Household from "../models/household.js";
import Alert from "../models/alert.js";

dotenv.config();

const DEMO_EMAIL = "demo@gasqueue.app";
const DEMO_PASSWORD = "demo1234";
const DEPOT = { lat: 26.9124, lng: 75.7873 }; // Jaipur

// "daysAgo(30)" = the date 30 days before today
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const refills = (list) => list.map((n) => ({ date: daysAgo(n) }));

const HOUSEHOLDS = [
  // history of 4 refills, ~30 day cycle, last refill 31 days ago -> Overdue
  { name: "Sharma Residence", area: "North Heights", people: 4,
    location: { lat: 26.94, lng: 75.81 }, refills: refills([121, 91, 61, 31]) },
  // 2 days left -> Urgent
  { name: "Gupta Family", area: "Greenwood Park", people: 5,
    location: { lat: 26.89, lng: 75.76 }, refills: refills([118, 88, 58, 28]) },
  // 5 days left -> Due Soon
  { name: "Verma Apartment", area: "West End", people: 3,
    location: { lat: 26.93, lng: 75.74 }, refills: refills([115, 85, 55, 25]) },
  // 38 day cycle, 14 days left -> Safe
  { name: "Lakeside Villa", area: "Lakeside", people: 2,
    location: { lat: 26.88, lng: 75.82 }, refills: refills([100, 62, 24]) },
  // commercial, 10 day cycle, runs out today -> Urgent
  { name: "Sunrise Cafe & Bakery", area: "Central Market", people: 6,
    cylinderType: "commercial_19kg",
    location: { lat: 26.92, lng: 75.8 }, refills: refills([40, 30, 20, 10]) },
  // commercial, 4 days left -> Due Soon
  { name: "Metro Diner", area: "East Industrial", people: 8,
    cylinderType: "commercial_19kg",
    location: { lat: 26.95, lng: 75.84 }, refills: refills([36, 26, 16, 6]) },
  // only 1 refill, so the researched default (30 days) applies -> Safe
  { name: "Joshi House", area: "Old Town", people: 4,
    location: { lat: 26.9, lng: 75.79 }, refills: refills([12]) },
  // no refills yet -> No data
  { name: "Rao Residence", area: "South Suburbs", people: 3,
    location: { lat: 26.96, lng: 75.77 }, refills: [] },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // remove the old demo account and its data, so re-running resets everything
  const old = await Supplier.findOne({ email: DEMO_EMAIL });
  if (old) {
    await Household.deleteMany({ supplier: old._id });
    await Alert.deleteMany({ supplier: old._id });
    await Supplier.deleteOne({ _id: old._id });
  }

  const supplier = await Supplier.create({
    name: "Demo Distributor",
    email: DEMO_EMAIL,
    password: await bcrypt.hash(DEMO_PASSWORD, 10),
    settings: { alertLeadDays: 5, vehicleCapacity: 40, depot: DEPOT },
  });

  await Household.insertMany(
    HOUSEHOLDS.map((h) => ({ ...h, supplier: supplier._id }))
  );

  console.log(`Seeded ${HOUSEHOLDS.length} households.`);
  console.log(`Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
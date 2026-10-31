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
  // ---------- Overdue ----------
  { name: "Sharma Residence", area: "North Heights", people: 4,
    location: { lat: 26.94, lng: 75.81 }, refills: refills([121, 91, 61, 31]) },
  { name: "Mehta Residence", area: "Malviya Nagar", people: 5,
    location: { lat: 26.856, lng: 75.81 }, refills: refills([150, 110, 70, 40]) },
  { name: "Kapoor Family", area: "Vaishali Nagar", people: 4,
    location: { lat: 26.912, lng: 75.728 }, refills: refills([100, 68, 36]) },

  // ---------- Urgent ----------
  { name: "Gupta Family", area: "Greenwood Park", people: 5,
    location: { lat: 26.89, lng: 75.76 }, refills: refills([118, 88, 58, 28]) },
  { name: "Sunrise Cafe & Bakery", area: "Central Market", people: 6,
    cylinderType: "commercial_19kg",
    location: { lat: 26.92, lng: 75.8 }, refills: refills([40, 30, 20, 10]) },
  { name: "Agarwal House", area: "C-Scheme", people: 3,
    location: { lat: 26.905, lng: 75.804 }, refills: refills([88, 58, 28]) },
  { name: "Bansal Tea Stall", area: "Johari Bazaar", people: 3,
    cylinderType: "commercial_19kg",
    location: { lat: 26.919, lng: 75.826 }, refills: refills([45, 33, 21, 9]) },

  // ---------- Due Soon ----------
  { name: "Verma Apartment", area: "West End", people: 3,
    location: { lat: 26.93, lng: 75.74 }, refills: refills([115, 85, 55, 25]) },
  { name: "Metro Diner", area: "East Industrial", people: 8,
    cylinderType: "commercial_19kg",
    location: { lat: 26.95, lng: 75.84 }, refills: refills([36, 26, 16, 6]) },
  { name: "Khandelwal Villa", area: "Mansarovar", people: 6,
    location: { lat: 26.859, lng: 75.76 }, refills: refills([112, 80, 48, 24]) },
  { name: "Hotel Rajdhani", area: "MI Road", people: 10,
    cylinderType: "commercial_19kg",
    location: { lat: 26.916, lng: 75.8 }, refills: refills([57, 42, 27, 10]) },

  // ---------- Safe ----------
  { name: "Lakeside Villa", area: "Lakeside", people: 2,
    location: { lat: 26.88, lng: 75.82 }, refills: refills([100, 62, 24]) },
  { name: "Saini Residence", area: "Jagatpura", people: 2,
    location: { lat: 26.833, lng: 75.859 }, refills: refills([120, 85, 50, 15]) },
  { name: "Sweet Corner", area: "Raja Park", people: 4,
    cylinderType: "commercial_19kg",
    location: { lat: 26.898, lng: 75.833 }, refills: refills([31, 21, 11, 1]) },
  // only 1 refill: uses the researched default (30 days)
  { name: "Joshi House", area: "Old Town", people: 4,
    location: { lat: 26.9, lng: 75.79 }, refills: refills([12]) },
  // only 1 refill, but the supplier set a 20-day estimate, so that is used
  { name: "Pillai House", area: "Bani Park", people: 4, expectedCycleDays: 20,
    location: { lat: 26.938, lng: 75.787 }, refills: refills([8]) },

  // ---------- No data ----------
  { name: "Rao Residence", area: "South Suburbs", people: 3,
    location: { lat: 26.96, lng: 75.77 }, refills: [] },
  { name: "Nair Residence", area: "Sodala", people: 3,
    location: { lat: 26.904, lng: 75.765 }, refills: [] },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  let supplier = await Supplier.findOne({ email: DEMO_EMAIL });

  if (supplier) {
    // keep the account (so you stay logged in) and reset its data
    await Household.deleteMany({ supplier: supplier._id });
    await Alert.deleteMany({ supplier: supplier._id });
    supplier.settings = { alertLeadDays: 5, vehicleCapacity: 40, depot: DEPOT };
    await supplier.save();
  } else {
    supplier = await Supplier.create({
      name: "Demo Distributor",
      email: DEMO_EMAIL,
      password: await bcrypt.hash(DEMO_PASSWORD, 10),
      settings: { alertLeadDays: 5, vehicleCapacity: 40, depot: DEPOT },
    });
  }

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
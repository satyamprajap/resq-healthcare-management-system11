const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const User = require("./server/models/User");

// Load environment variables
require("dotenv").config();
console.log("MONGODB_URI:", process.env.MONGODB_URI);

const app = express();

// Connect to MongoDB with additional options and debug logging
// Connect to MongoDB with additional options and debug logging
console.log("MONGODB_URI:", process.env.MONGODB_URI);

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is missing from .env file");
  process.exit(1);
}

console.log(
  "Connecting to MongoDB with URI:",
  process.env.MONGODB_URI.replace(/:[^:]*@/, ":****@"),
);

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(async () => {
    console.log("MongoDB connected successfully!");

    try {
      await ensureAdminAccount();
    } catch (error) {
      console.error("Admin creation error:", error);
    }
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

async function ensureAdminAccount() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    console.log("Please configure admin credentials in .env");
    return;
  }

  let admin = await User.findOne({ email });

  if (admin) {
    admin.role = "admin";

    const passwordMatches = await admin.comparePassword(password);

    if (!passwordMatches) {
      admin.password = password;
    }

    await admin.save();

    console.log("Admin account verified and updated.");
    return;
  }

  await User.create({
    firstName: "ResQ",
    lastName: "Admin",
    email,
    password,
    role: "admin",
  });

  console.log("Initial admin account created successfully!");
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.JWT_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Make user data available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
});

// Set up EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.render("index", {
    title: "Home | ResQ",
    page: "home",
  });
});

app.get("/about", (req, res) => {
  res.render("about", {
    title: "About Us | ResQ",
    page: "about",
  });
});

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login | ResQ",
    page: "login",
  });
});
// Admin Login
app.get("/admin/login", (req, res) => {
  if (req.session.user?.role === "admin") {
    return res.redirect("/admin");
  }

  res.render("admin/login", {
    title: "Admin Login | ResQ",
    page: "admin",
  });
});

app.get("/sign-up", (req, res) => {
  res.render("sign-up", {
    title: "Sign Up | ResQ",
    page: "sign-up",
  });
});

app.get("/med-reminder", (req, res) => {
  res.render("med-reminder", {
    title: "Med Reminder | ResQ",
    page: "med-reminder",
  });
});

app.get("/appointment", (req, res) => {
  res.render("appointment", {
    title: "Appointment | ResQ",
    page: "appointment",
  });
});

app.get("/ambulance", (req, res) => {
  res.render("ambulance", {
    title: "Book Ambulance | ResQ",
    page: "ambulance",
  });
});

app.get("/track-ambulance", (req, res) => {
  res.render("track-ambulance", {
    title: "Track Ambulance | ResQ",
    page: "ambulance",
  });
});

app.get("/shop", (req, res) => {
  res.render("shop", {
    title: "Quick-Med Shop | ResQ",
    page: "shop",
  });
});

app.get("/cart", (req, res) => {
  res.render("cart", {
    title: "Cart Shop | ResQ",
    page: "cart",
  });
});

app.get("/checkout", (req, res) => {
  res.render("checkout", {
    title: "Checkout | ResQ",
    page: "checkout",
  });
});

app.get("/wishlist", (req, res) => {
  res.render("wishlist", {
    title: "Wishlist | ResQ",
    page: "wishlist",
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    title: "Contact | ResQ",
    page: "contact",
  });
});

app.get("/doctors", (req, res) => {
  res.render("doctors", {
    title: "Doctors | ResQ",
    page: "doctors",
  });
});

app.get("/hospitals", (req, res) => {
  res.render("hospitals", {
    title: "Hospitals | ResQ",
    page: "hospitals",
  });
});

app.get("/services", (req, res) => {
  res.render("services", {
    title: "Services | ResQ",
    page: "contact",
  });
});

// Route directly to the auth routes for the logout page
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/");
  });
});

// Add API routes
const reminderRoutes = require("./server/routes/reminderRoutes");
const authRoutes = require("./server/routes/authRoutes");
const appointmentRoutes = require("./server/routes/appointmentRoutes");
const medicationRoutes = require("./server/routes/medicationRoutes");
const ambulanceRoutes = require("./server/routes/ambulanceRoutes");

app.use("/api/reminders", reminderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/ambulance", ambulanceRoutes);
console.log("reminderRoutes:", typeof reminderRoutes);
console.log("authRoutes:", typeof authRoutes);
console.log("appointmentRoutes:", typeof appointmentRoutes);
console.log("medicationRoutes:", typeof medicationRoutes);
console.log("ambulanceRoutes:", typeof ambulanceRoutes);

const adminRoutes = require("./server/routes/adminRoutes");

console.log("adminRoutes:", typeof adminRoutes);
app.use("/admin", adminRoutes);

// Start server after MongoDB and Admin setup
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env file");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("MongoDB connected successfully!");

    await ensureAdminAccount();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 ResQ server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();

const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const User = require("./server/models/User");

const app = express();

// ==========================================
// 1. BASIC MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// 2. SESSION CONFIGURATION
// ==========================================

app.use(
  session({
    secret: process.env.SESSION_SECRET || "development-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// ==========================================
// 3. EJS CONFIGURATION
// ==========================================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.set("layout", "layouts/main");

app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// 4. GLOBAL TEMPLATE VARIABLES
// ==========================================

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;

  res.locals.page =
    req.path === "/"
      ? "home"
      : req.path.split("/").filter(Boolean).pop() || "home";

  next();
});

// ==========================================
// 5. ADMIN ACCOUNT SETUP
// ==========================================

async function ensureAdminAccount() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error("Valid ADMIN_EMAIL and ADMIN_PASSWORD required");
  }

  let admin = await User.findOne({ email });

  if (admin) {
    admin.role = "admin";

    const passwordMatches = await admin.comparePassword(password);

    if (!passwordMatches) {
      admin.password = password;
    }

    await admin.save();

    console.log("Admin account verified successfully.");
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

// ==========================================
// 6. WEBSITE PAGE ROUTES
// ==========================================

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
    page: "services",
  });
});

// ==========================================
// 7. LOGOUT ROUTE
// ==========================================

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
    }

    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// ==========================================
// 8. API ROUTES
// ==========================================

app.use("/api/reminders", require("./server/routes/reminderRoutes"));

app.use("/api/auth", require("./server/routes/authRoutes"));

app.use("/api/appointments", require("./server/routes/appointmentRoutes"));

app.use("/api/medications", require("./server/routes/medicationRoutes"));

app.use("/api/ambulance", require("./server/routes/ambulanceRoutes"));

app.use("/admin", require("./server/routes/adminRoutes"));

// ==========================================
// 9. HEALTH CHECK ROUTE
// ==========================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    application: "ResQ Healthcare Management System",
  });
});

// ==========================================
// 10. DATABASE CONNECTION & SERVER START
// ==========================================

async function startServer() {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is missing");
    }

    if (!process.env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET is missing");
    }

    console.log("Connecting to MongoDB Atlas...");

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    console.log("MongoDB connected successfully!");

    await ensureAdminAccount();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ResQ server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();

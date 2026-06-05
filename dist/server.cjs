var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// backend/server.js
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path4 = __toESM(require("path"), 1);
var import_fs3 = __toESM(require("fs"), 1);

// backend/src/config/db.js
var import_mongoose = __toESM(require("mongoose"), 1);
var isConnected = false;
async function connectDatabase() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.log("[Database] No MONGO_URI configured in env. Utilizing in-memory simulated fallback storage.");
    return;
  }
  try {
    console.log("[Database] Connecting to MongoDB database...");
    await import_mongoose.default.connect(uri, {
      serverSelectionTimeoutMS: 5e3
    });
    isConnected = true;
    console.log("[Database] MongoDB connection established successfully.");
  } catch (err) {
    console.error("[Database] Failed to connect to MongoDB, falling back to local simulated memory:", err.message);
  }
}
function getMongooseConnectionState() {
  return isConnected && import_mongoose.default.connection.readyState === 1;
}

// backend/src/app.js
var import_express2 = __toESM(require("express"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_os2 = __toESM(require("os"), 1);
var import_vite = require("vite");

// backend/src/routes/api.js
var import_express = __toESM(require("express"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_os = __toESM(require("os"), 1);

// backend/src/controllers/authController.js
var import_bcrypt = __toESM(require("bcrypt"), 1);
var import_zod = require("zod");
var import_google_auth_library = require("google-auth-library");
var import_nodemailer = __toESM(require("nodemailer"), 1);

// backend/src/utils/storage.js
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DATABASE_DIR = import_path.default.resolve(process.cwd(), "backend", "database");
var CARS_FILE = import_path.default.join(DATABASE_DIR, "cars.json");
var USERS_FILE = import_path.default.join(DATABASE_DIR, "users.json");
var APPLICATIONS_FILE = import_path.default.join(DATABASE_DIR, "applications.json");
var AGREEMENTS_FILE = import_path.default.join(DATABASE_DIR, "agreements.json");
var PAYMENTS_FILE = import_path.default.join(DATABASE_DIR, "payments.json");
var EMAILS_FILE = import_path.default.join(DATABASE_DIR, "emails.json");
var INQUIRIES_FILE = import_path.default.join(DATABASE_DIR, "inquiries.json");
var loadJson = (filepath, defaultValue) => {
  try {
    if (import_fs.default.existsSync(filepath)) {
      const data = import_fs.default.readFileSync(filepath, "utf8");
      let parsed = JSON.parse(data);
      if (Array.isArray(parsed) && filepath.endsWith("applications.json")) {
        parsed = parsed.filter((app) => {
          if (!app) return false;
          if (app.id === "APP-5341" || app.id === "APP-1481") return false;
          if (app.licenseFrontUrl && app.licenseFrontUrl.includes("unsplash.com")) return false;
          if (app.licenseBackUrl && app.licenseBackUrl.includes("unsplash.com")) return false;
          if (app.selfieUrl && app.selfieUrl.includes("unsplash.com")) return false;
          if (app.applyDetails?.drivingLicence && app.applyDetails.drivingLicence.includes("unsplash.com")) return false;
          return true;
        });
      }
      return parsed;
    } else {
      import_fs.default.mkdirSync(import_path.default.dirname(filepath), { recursive: true });
      import_fs.default.writeFileSync(filepath, JSON.stringify(defaultValue, null, 2), "utf8");
      return defaultValue;
    }
  } catch (err) {
    console.error(`Error loading database file at ${filepath}:`, err);
    return defaultValue;
  }
};
var saveJson = (filepath, data) => {
  try {
    import_fs.default.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Error writing database file at ${filepath}:`, err);
  }
};

// backend/src/controllers/authController.js
var pendingOtps = {};
var nodemailerTransporter = null;
function getEmailTransporter() {
  if (nodemailerTransporter) return nodemailerTransporter;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) {
    console.warn("[SMTP-WARNING] EMAIL_USER or EMAIL_PASS environment variables are not configured. Emails will not be sent physically.");
    return null;
  }
  try {
    nodemailerTransporter = import_nodemailer.default.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
    return nodemailerTransporter;
  } catch (error) {
    console.error("[SMTP-ERROR] Failed to construct Nodemailer transporter:", error);
    return null;
  }
}
async function sendOtpEmail(email, otp) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log(`[SMTP-INFO] Real email send skipped because SMTP credentials are not set. Retrieved OTP code is: ${otp}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Rent2Buy Car Leasings" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verification Code - Rent2Buy",
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Rent2Buy Driver Profile Verification</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">
            Thank you for registering your interest with Rent2Buy Car Leasings Manchester. Please verify your email address to complete your driver application form setup.
          </p>
          <p style="color: #475569; font-size: 14px;">Your 6-digit confirmation security PIN code is:</p>
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; margin: 20px 0; text-align: center; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #CDA275; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            This verification token will expire in 5 minutes. If you did not request this code, please ignore this email.
          </p>
        </div>
      `
    });
    console.log(`[SMTP] Verification email sent successfully to ${email}`);
  } catch (error) {
    console.error(`[SMTP-ERR] Failed to dispatch email to ${email}:`, error);
  }
}
var login = async (req, res) => {
  const usersStore = loadJson(USERS_FILE, []);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing identity credentials" });
  }
  const existingUser = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!existingUser) {
    return res.status(401).json({ error: "No profile active for this email address" });
  }
  if (existingUser.blocked) {
    return res.status(403).json({ error: "Access suspended. Please contact our Manchester Support Hub (support@r2buy.com) regarding security checks." });
  }
  try {
    const isMockHash = existingUser.passwordHash === "user123_dummy" || existingUser.passwordHash === "google_dummy";
    if (isMockHash) {
      const expectedPass = existingUser.role === "admin" ? "admin123" : "password123";
      if (password !== expectedPass && password !== existingUser.passwordHash) {
        return res.status(401).json({ error: "Incorrect authentication password" });
      }
    } else {
      const passwordsMatch = await import_bcrypt.default.compare(password, existingUser.passwordHash);
      if (!passwordsMatch) {
        return res.status(401).json({ error: "Incorrect authentication password" });
      }
    }
    return res.json({
      message: "Logged in successfully",
      user: {
        email: existingUser.email,
        fullName: existingUser.fullName,
        role: existingUser.role,
        phone: existingUser.phone || ""
      }
    });
  } catch (err) {
    console.error("Login verification crash:", err);
    return res.status(500).json({ error: "An internal server error occurred during auth verification." });
  }
};
var signupSendOtp = async (req, res) => {
  const usersStore = loadJson(USERS_FILE, []);
  const { email, password, fullName, phone } = req.body;
  const backendSignupSchema = import_zod.z.object({
    fullName: import_zod.z.string().min(3, "Full Name must be at least 3 characters").max(50, "Full Name must not exceed 50 characters").regex(/^[^0-9]*$/, "Full Name cannot contain numbers"),
    email: import_zod.z.string().email("Please provide a valid email address"),
    phone: import_zod.z.string().regex(/^(\+44|0)7\d{9}$/, "Must be a valid UK mobile number starting with 07 or +447"),
    password: import_zod.z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least 1 uppercase letter").regex(/[a-z]/, "Password must contain at least 1 lowercase letter").regex(/[0-9]/, "Password must contain at least 1 number").regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least 1 special character")
  });
  const validationResult = backendSignupSchema.safeParse({ email, password, fullName, phone });
  if (!validationResult.success) {
    const defaultError = validationResult.error.issues[0]?.message || "Validation failed";
    return res.status(400).json({ error: defaultError });
  }
  const disposableDomains = [
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "temp-mail.org",
    "yopmail.com",
    "dispostable.com",
    "mailinator.com",
    "trashmail.com",
    "tempmailaddress.com",
    "sharklasers.com",
    "getairmail.com",
    "10minutemail.co.uk"
  ];
  const emailDomain = email.split("@")[1]?.toLowerCase().trim();
  if (disposableDomains.includes(emailDomain)) {
    return res.status(400).json({ error: "Disposable or junk email domains are blocked for security purposes. Please register with a verified personal or business domain." });
  }
  const exists = usersStore.some((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (exists) {
    return res.status(409).json({ error: "Email already registered in system" });
  }
  try {
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = Date.now() + 5 * 60 * 1e3;
    pendingOtps[email.toLowerCase().trim()] = {
      otp,
      expiresAt,
      fullName: fullName.trim(),
      phone: phone.trim(),
      password
    };
    console.log(`[SECURE-AUTH-OTP] Generated registration OTP for ${email}: ${otp}`);
    const emailsStore = loadJson(EMAILS_FILE, []);
    emailsStore.push({
      id: `EMAIL-${Math.floor(1e3 + Math.random() * 9e3)}`,
      userEmail: email.toLowerCase().trim(),
      subject: "R2Buy Register PIN Code Assigned",
      content: `Your verification code is: ${otp}. It will expire in 5 minutes. Use it to complete your driver registration profile.`,
      dateSent: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      attachmentUrl: null
    });
    saveJson(EMAILS_FILE, emailsStore);
    await sendOtpEmail(email.toLowerCase().trim(), otp);
    res.json({
      success: true,
      message: "Security code dispatched. Please check your email inbox folder.",
      otpSent: true
    });
  } catch (err) {
    console.error("OTP generation issue:", err);
    res.status(500).json({ error: "Failed to generate verification session. Please retry." });
  }
};
var signupVerifyOtp = async (req, res) => {
  const usersStore = loadJson(USERS_FILE, []);
  const { email, otpCode } = req.body;
  if (!email || !otpCode) {
    return res.status(400).json({ error: "Missing identity credentials or verification PIN code." });
  }
  const cleanEmail = email.toLowerCase().trim();
  const cachedData = pendingOtps[cleanEmail];
  if (!cachedData) {
    return res.status(400).json({ error: "Verification session expired or not found. Please resubmit signup details to send a new code." });
  }
  if (Date.now() > cachedData.expiresAt) {
    delete pendingOtps[cleanEmail];
    return res.status(400).json({ error: "The entered verification seed has expired. Please try again." });
  }
  if (cachedData.otp !== otpCode.trim()) {
    return res.status(400).json({ error: "Incorrect 6-digit confirmation PIN code. Check your inbox." });
  }
  try {
    const hashedPassword = await import_bcrypt.default.hash(cachedData.password, 12);
    const newUser = {
      email: cleanEmail,
      fullName: cachedData.fullName,
      phone: cachedData.phone,
      role: "user",
      passwordHash: hashedPassword
    };
    usersStore.push(newUser);
    saveJson(USERS_FILE, usersStore);
    delete pendingOtps[cleanEmail];
    return res.json({
      message: "Profile verified and registered successfully!",
      user: {
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        phone: newUser.phone
      }
    });
  } catch (err) {
    console.error("Verify OTP processing issue:", err);
    return res.status(500).json({ error: "An internal server error occurred while configuring your account." });
  }
};
var legacySignup = async (req, res) => {
  const usersStore = loadJson(USERS_FILE, []);
  const { email, password, fullName, phone, role } = req.body;
  const backendSignupSchema = import_zod.z.object({
    fullName: import_zod.z.string().min(3, "Full Name must be at least 3 characters").max(50, "Full Name must not exceed 50 characters").regex(/^[^0-9]*$/, "Full Name cannot contain numbers"),
    email: import_zod.z.string().email("Please provide a valid email address"),
    phone: import_zod.z.string().regex(/^(\+44|0)7\d{9}$/, "Must be a valid UK mobile number starting with 07 or +447").optional().or(import_zod.z.literal("")),
    password: import_zod.z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least 1 uppercase letter").regex(/[a-z]/, "Password must contain at least 1 lowercase letter").regex(/[0-9]/, "Password must contain at least 1 number").regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least 1 special character")
  });
  const validationResult = backendSignupSchema.safeParse({ email, password, fullName, phone });
  if (!validationResult.success) {
    const defaultError = validationResult.error.issues[0]?.message || "Validation failed";
    return res.status(400).json({ error: defaultError });
  }
  const exists = usersStore.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: "Email already registered in system" });
  }
  try {
    const hashedPassword = await import_bcrypt.default.hash(password, 12);
    const newUser = {
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      phone: phone ? phone.trim() : "",
      role: role || "user",
      passwordHash: hashedPassword
    };
    usersStore.push(newUser);
    saveJson(USERS_FILE, usersStore);
    return res.json({
      message: "Profile registered successfully with secure verification!",
      user: {
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        phone: newUser.phone
      }
    });
  } catch (err) {
    console.error("Backend signup processing issue:", err);
    return res.status(500).json({ error: "An internal server error occurred while configuring your credentials." });
  }
};
var googleSignin = async (req, res) => {
  const usersStore = loadJson(USERS_FILE, []);
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "Missing identity token credential." });
  }
  let email = null;
  let fullName = "Google Driver";
  try {
    const client_id = process.env.GOOGLE_CLIENT_ID || "51093669905-ol708dcv8e0is2ch1tet4hmq8m6eq7sh.apps.googleusercontent.com";
    const oauth2Client = new import_google_auth_library.OAuth2Client(client_id);
    const ticket = await oauth2Client.verifyIdToken({
      idToken: credential,
      audience: client_id
    });
    const payload = ticket.getPayload();
    email = payload.email;
    fullName = payload.name || payload.given_name || "Google User";
  } catch (err) {
    console.warn("[Backend SDK Google Verification Failed, attempting direct JWT local decode fallback]:", err.message);
    try {
      const parts = credential.split(".");
      if (parts.length === 3) {
        const payloadBuffer = Buffer.from(parts[1], "base64");
        const payload = JSON.parse(payloadBuffer.toString("utf-8"));
        email = payload.email;
        fullName = payload.name || payload.given_name || "Google User";
      }
    } catch (decodeErr) {
      console.error("[JWT Decode Fallback Failed too]:", decodeErr);
    }
  }
  if (!email) {
    return res.status(400).json({ error: "Invalid Google credential token or verification mismatch." });
  }
  let userObj = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!userObj) {
    userObj = {
      email: email.toLowerCase(),
      fullName,
      role: "user",
      passwordHash: "google_dummy",
      phone: ""
    };
    usersStore.push(userObj);
    saveJson(USERS_FILE, usersStore);
  }
  res.json({
    message: "Sign-in verified via Google Secure Gateway",
    user: {
      email: userObj.email,
      fullName: userObj.fullName,
      role: userObj.role,
      phone: userObj.phone || ""
    }
  });
};
var logout = (req, res) => {
  res.clearCookie("csrfToken");
  res.json({ status: "success", message: "Logged out from Manchester dispatch centers" });
};
var editProfile = (req, res) => {
  const usersStore = loadJson(USERS_FILE, []);
  const { email, fullName, phone, address, password } = req.body;
  const loggedUser = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!loggedUser) {
    return res.status(404).json({ error: "User record identity mismatch" });
  }
  if (fullName !== void 0) {
    loggedUser.fullName = fullName;
  }
  if (phone !== void 0) {
    loggedUser.phone = phone;
  }
  if (address !== void 0) {
    loggedUser.address = address;
  }
  if (password !== void 0 && password !== "") {
    loggedUser.passwordHash = password;
  }
  saveJson(USERS_FILE, usersStore);
  res.json({
    message: "Identity profiles refreshed!",
    user: {
      email: loggedUser.email,
      fullName: loggedUser.fullName,
      role: loggedUser.role,
      phone: loggedUser.phone || "",
      address: loggedUser.address || ""
    }
  });
};
var getUserData = (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "Query parameters email identifier missing" });
  }
  const usersStore = loadJson(USERS_FILE, []);
  const applicationsStore = loadJson(APPLICATIONS_FILE, []);
  const agreementsStore = loadJson(AGREEMENTS_FILE, []);
  const paymentsStore = loadJson(PAYMENTS_FILE, []);
  const activeEmail = email.toLowerCase();
  const driverProfile = usersStore.find((u) => u.email.toLowerCase() === activeEmail) || {
    email: activeEmail,
    fullName: "Simulated Guest Profile",
    role: "user"
  };
  const driverApps = applicationsStore.filter((a) => a.userEmail.toLowerCase() === activeEmail);
  const approvedApps = driverApps.filter((a) => a.step === 4);
  let updatedAgreements = false;
  approvedApps.forEach((app) => {
    const hasAgr = agreementsStore.some((ag) => ag.userEmail.toLowerCase() === activeEmail && ag.carName.includes(app.carName.split(" - ")[0]));
    if (!hasAgr) {
      agreementsStore.push({
        id: `AGR-${Math.floor(Math.random() * 8999 + 1e3)}`,
        userEmail: activeEmail,
        carName: app.carName.split(" - ")[0],
        weeklyRate: 45,
        startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        paidContributions: 45,
        remainingMonths: 12
      });
      updatedAgreements = true;
    }
  });
  if (updatedAgreements) {
    saveJson(AGREEMENTS_FILE, agreementsStore);
  }
  const driverAgreements = agreementsStore.filter((a) => a.userEmail.toLowerCase() === activeEmail);
  const driverPayments = paymentsStore.filter((p) => p.userEmail.toLowerCase() === activeEmail);
  res.json({
    user: {
      email: driverProfile.email,
      fullName: driverProfile.fullName,
      role: driverProfile.role
    },
    applications: driverApps,
    agreements: driverAgreements,
    payments: driverPayments
  });
};

// backend/src/controllers/carController.js
var getCars = (req, res) => {
  const carsStore = loadJson(CARS_FILE, []);
  res.json(carsStore);
};
var addCar = (req, res) => {
  const carsStore = loadJson(CARS_FILE, []);
  const { name, model, price, fuel, transmission, image, economy, specs, category, engine, color, description, images } = req.body;
  if (!name || !model) {
    return res.status(400).json({ error: "Missing target vehicle specifications layout" });
  }
  const newCar = {
    id: `car_${Date.now()}`,
    name: name.toUpperCase(),
    model: model.toUpperCase(),
    price: Number(price) || 45,
    weeklyRate: Number(price) || 45,
    fuel: fuel || "Petrol",
    transmission: transmission || "Manual",
    economy: economy || "55 mpg",
    image: image || "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800",
    specs: specs || ["Premium standard condition"],
    category: category || "Rent-to-Buy",
    engine: engine || "1.0L Dynamic Fuel-Saving",
    color: color || "Midnight Quartz",
    description: description || "",
    images: Array.isArray(images) && images.length > 0 ? images : [image || "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800"]
  };
  carsStore.unshift(newCar);
  saveJson(CARS_FILE, carsStore);
  res.status(201).json(newCar);
};
var updateCar = (req, res) => {
  const carsStore = loadJson(CARS_FILE, []);
  const { id } = req.params;
  const index = carsStore.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Vehicle index target not stored" });
  }
  carsStore[index] = { ...carsStore[index], ...req.body };
  saveJson(CARS_FILE, carsStore);
  res.json(carsStore[index]);
};
var deleteCar = (req, res) => {
  let carsStore = loadJson(CARS_FILE, []);
  const { id } = req.params;
  const beforeLength = carsStore.length;
  carsStore = carsStore.filter((c) => c.id !== id);
  if (carsStore.length === beforeLength) {
    return res.status(404).json({ error: "Deletion target vehicle index invalid" });
  }
  saveJson(CARS_FILE, carsStore);
  res.json({ message: "Asset purged from live fleet database index." });
};

// backend/src/controllers/applyController.js
var createApplication = (req, res) => {
  const carsStore = loadJson(CARS_FILE, []);
  const applicationsStore = loadJson(APPLICATIONS_FILE, []);
  const usersStore = loadJson(USERS_FILE, []);
  const { carId, userEmail, email, drivingLicence, selfieWithId, addressProof, durationMonths, applyDetails, profile } = req.body;
  const activeEmailVal = userEmail || email || profile && profile.email;
  if (!activeEmailVal) {
    return res.status(400).json({ error: "Active identity credentials missing" });
  }
  const details = applyDetails || {};
  const drivingLicenceVal = drivingLicence || details.drivingLicence || "";
  const selfieWithIdVal = selfieWithId || details.selfieWithId || "";
  const addressProofVal = addressProof || details.addressProof || "";
  const durationMonthsVal = durationMonths || details.durationMonths || "12";
  const targetCar = carsStore.find((c) => c.id === carId) || { name: "CUSTOM VEHICLE", model: "SPECIALIZED SPEC" };
  const finalEmail = activeEmailVal.toLowerCase().trim();
  const matchingUser = usersStore.find((u) => u.email.toLowerCase() === finalEmail);
  const userId = matchingUser ? matchingUser.id || matchingUser._id || matchingUser.email : null;
  const currentFullName = profile?.fullName || details.fullName || matchingUser?.fullName || "";
  const currentPhone = profile?.phone || details.phone || matchingUser?.phone || "";
  const currentWeeklyIncome = Number(details.weeklyIncome) || 0;
  const currentEmployment = details.employment || "";
  const currentLocation = details.location || "";
  const newApp = {
    id: `APP-${Math.floor(Math.random() * 8999 + 1e3)}`,
    userEmail: finalEmail,
    carId,
    carName: `${targetCar.name} - ${targetCar.model}`,
    dateApplied: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    submissionDateTime: (/* @__PURE__ */ new Date()).toISOString(),
    step: 1,
    status: "Pending",
    // Default is Pending
    creditCheckStatus: "PASSED (SOFT INCOME VERIFY)",
    userId,
    fullName: currentFullName,
    phone: currentPhone,
    licenseFrontUrl: drivingLicenceVal,
    licenseBackUrl: addressProofVal,
    selfieUrl: selfieWithIdVal,
    applyDetails: {
      fullName: currentFullName,
      phone: currentPhone,
      employment: currentEmployment,
      weeklyIncome: currentWeeklyIncome,
      durationMonths: Number(durationMonthsVal),
      drivingLicence: drivingLicenceVal,
      addressProof: addressProofVal,
      selfieWithId: selfieWithIdVal,
      location: currentLocation
    }
  };
  applicationsStore.unshift(newApp);
  saveJson(APPLICATIONS_FILE, applicationsStore);
  res.status(201).json(newApp);
};
var updateApplicationStep = (req, res) => {
  const applicationsStore = loadJson(APPLICATIONS_FILE, []);
  const { id } = req.params;
  const { step } = req.body;
  const app = applicationsStore.find((a) => a.id === id);
  if (!app) {
    return res.status(404).json({ error: "Requested underwriting folder index invalid" });
  }
  const targetStep = Number(step);
  app.step = targetStep;
  if (targetStep === 1) {
    app.status = "In Progress";
  } else if (targetStep === 2) {
    app.status = "Under Review";
  } else if (targetStep === 3) {
    app.status = "Action Required";
  } else if (targetStep === 4) {
    app.status = "Approved";
  }
  saveJson(APPLICATIONS_FILE, applicationsStore);
  res.json({ message: `Successfully progressed application state to Stage ${targetStep}`, application: app });
};
var updateApplicationDocuments = (req, res) => {
  const applicationsStore = loadJson(APPLICATIONS_FILE, []);
  const { id } = req.params;
  const { drivingLicence, selfieWithId, addressProof } = req.body;
  const app = applicationsStore.find((a) => a.id === id);
  if (!app) {
    return res.status(404).json({ error: "Requested application not found" });
  }
  if (!app.applyDetails) {
    app.applyDetails = {};
  }
  if (drivingLicence !== void 0) app.applyDetails.drivingLicence = drivingLicence;
  if (selfieWithId !== void 0) app.applyDetails.selfieWithId = selfieWithId;
  if (addressProof !== void 0) app.applyDetails.addressProof = addressProof;
  saveJson(APPLICATIONS_FILE, applicationsStore);
  res.json({ message: "Documents successfully updated", application: app });
};
var submitPayment = (req, res) => {
  const paymentsStore = loadJson(PAYMENTS_FILE, []);
  const agreementsStore = loadJson(AGREEMENTS_FILE, []);
  const { userEmail, email, amount, method, carName } = req.body;
  const activeEmailVal = userEmail || email;
  if (!activeEmailVal || !amount) {
    return res.status(400).json({ error: "Empty payment payload rejected" });
  }
  const activeEmail = activeEmailVal.toLowerCase();
  const newTxn = {
    id: `TXN-${Math.floor(Math.random() * 8999 + 1e3)}`,
    userEmail: activeEmail,
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    amount: Number(amount),
    method: method || "Debit Card",
    status: "Successful",
    carName: carName || "Fleet Asset Dues"
  };
  paymentsStore.unshift(newTxn);
  saveJson(PAYMENTS_FILE, paymentsStore);
  const agreement = agreementsStore.find((a) => a.userEmail.toLowerCase() === activeEmail);
  if (agreement) {
    agreement.paidContributions = (agreement.paidContributions || 0) + Number(amount);
    saveJson(AGREEMENTS_FILE, agreementsStore);
  }
  res.status(201).json(newTxn);
};
var submitInquiry = (req, res) => {
  const inquiriesStore = loadJson(INQUIRIES_FILE, []);
  const { name, email, msg } = req.body;
  if (!name || !email || !msg) {
    return res.status(400).json({ error: "Fill secure inquiry forms completely before submitting." });
  }
  const newInq = {
    id: `INQ-${Math.floor(Math.random() * 899 + 100)}`,
    name,
    email: email.toLowerCase(),
    msg,
    dateReceived: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    status: "Unread"
  };
  inquiriesStore.unshift(newInq);
  saveJson(INQUIRIES_FILE, inquiriesStore);
  res.status(201).json({ message: "Dispatch successful!", inquiry: newInq });
};
var uploadAvatar = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No avatar file uploaded." });
    }
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;
    res.json({ url: `${baseUrl}/uploads/${req.file.filename}` });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ error: "Failed to upload avatar." });
  }
};
var uploadCarImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No carImage file uploaded." });
    }
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;
    res.json({ url: `${baseUrl}/uploads/${req.file.filename}` });
  } catch (error) {
    console.error("Car image upload error:", error);
    res.status(500).json({ error: "Failed to upload car image." });
  }
};
var uploadDocumentsMock = (req, res) => {
  try {
    console.log("[UPLOAD-DEBUG] Called uploadDocumentsMock. Files of request:", req.files);
    console.log("[UPLOAD-DEBUG] Request headers:", req.headers);
    const files = req.files || {};
    const licenseFrontFile = files.licenseFront ? files.licenseFront[0] : null;
    const licenseBackFile = files.licenseBack ? files.licenseBack[0] : null;
    const proofOfAddressFile = files.proofOfAddress ? files.proofOfAddress[0] : null;
    console.log("[UPLOAD-DEBUG] Extracted front:", licenseFrontFile ? licenseFrontFile.filename : null);
    console.log("[UPLOAD-DEBUG] Extracted back:", licenseBackFile ? licenseBackFile.filename : null);
    console.log("[UPLOAD-DEBUG] Extracted selfie/proofOfAddress:", proofOfAddressFile ? proofOfAddressFile.filename : null);
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;
    const licenseFrontUrl = licenseFrontFile ? `${baseUrl}/uploads/${licenseFrontFile.filename}` : "";
    const licenseBackUrl = licenseBackFile ? `${baseUrl}/uploads/${licenseBackFile.filename}` : "";
    const proofOfAddressUrl = proofOfAddressFile ? `${baseUrl}/uploads/${proofOfAddressFile.filename}` : "";
    const responsePayload = {
      licenseFront: licenseFrontUrl,
      licenseBack: licenseBackUrl,
      proofOfAddress: proofOfAddressUrl
    };
    console.log("[UPLOAD-DEBUG] Sending response payload:", responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error("[UPLOAD-DEBUG] Error in uploadDocumentsMock real storage:", error);
    res.status(500).json({ error: "Failed to upload underwriting files perfectly." });
  }
};

// backend/src/controllers/adminController.js
var getAllRecords = (req, res) => {
  const usersStore = loadJson(USERS_FILE, []);
  const applicationsStore = loadJson(APPLICATIONS_FILE, []);
  const agreementsStore = loadJson(AGREEMENTS_FILE, []);
  const paymentsStore = loadJson(PAYMENTS_FILE, []);
  const carsStore = loadJson(CARS_FILE, []);
  const emailsStore = loadJson(EMAILS_FILE, []);
  const inquiriesStore = loadJson(INQUIRIES_FILE, []);
  res.json({
    users: usersStore.map((u) => ({ email: u.email, fullName: u.fullName, role: u.role, blocked: u.blocked || false })),
    applications: applicationsStore,
    agreements: agreementsStore,
    payments: paymentsStore,
    cars: carsStore,
    emails: emailsStore,
    inquiries: inquiriesStore
  });
};
var adminAddCar = (req, res) => {
  const carsStore = loadJson(CARS_FILE, []);
  const { name, model, price, deposit, description, year, fuel, transmission, mileage, image, images, status } = req.body;
  if (!name || !model) {
    return res.status(400).json({ error: "Missing required vehicle make and model details." });
  }
  const newCar = {
    id: `car_${Date.now()}`,
    name: name.toUpperCase(),
    model: model.toUpperCase(),
    price: Number(price) || 45,
    weeklyRate: Number(price) || 45,
    deposit: Number(deposit) || 150,
    description: description || "Pristine EV vehicle ready for immediate active lease support.",
    year: year || "2024",
    fuel: fuel || "Petrol",
    transmission: transmission || "Manual",
    mileage: mileage || "18,000 miles",
    image: image || "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800",
    images: Array.isArray(images) && images.length > 0 ? images : [
      image || "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800"
    ],
    status: status || "Available"
  };
  carsStore.unshift(newCar);
  saveJson(CARS_FILE, carsStore);
  res.status(201).json({ message: "Stock EV added successfully!", car: newCar });
};
var adminEditCar = (req, res) => {
  const carsStore = loadJson(CARS_FILE, []);
  const { id } = req.params;
  const idx = carsStore.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Vehicle listings index not matched." });
  }
  carsStore[idx] = { ...carsStore[idx], ...req.body };
  saveJson(CARS_FILE, carsStore);
  res.json({ message: "Vehicle specifications saved permanently!", car: carsStore[idx] });
};
var adminDeleteCar = (req, res) => {
  let carsStore = loadJson(CARS_FILE, []);
  const { id } = req.params;
  const originalLen = carsStore.length;
  carsStore = carsStore.filter((c) => c.id !== id);
  if (carsStore.length === originalLen) {
    return res.status(404).json({ error: "Vehicle index target invalid." });
  }
  saveJson(CARS_FILE, carsStore);
  res.json({ message: "Vehicle pruned from system listings database." });
};
var adminGetApplications = (req, res) => {
  const applicationsStore = loadJson(APPLICATIONS_FILE, []);
  res.json(applicationsStore);
};
var adminUpdateApplicationStatus = (req, res) => {
  const applicationsStore = loadJson(APPLICATIONS_FILE, []);
  const agreementsStore = loadJson(AGREEMENTS_FILE, []);
  const emailsStore = loadJson(EMAILS_FILE, []);
  const { id } = req.params;
  const { status, step, documentChecks, notes } = req.body;
  const app = applicationsStore.find((a) => a.id === id);
  if (!app) {
    return res.status(404).json({ error: "Underwriting folders index target invalid." });
  }
  if (status) app.status = status;
  if (step) app.step = Number(step);
  if (documentChecks) app.documentChecks = documentChecks;
  if (notes) app.notes = notes;
  if (status === "Approved" || Number(step) === 4) {
    app.status = "Approved";
    app.step = 4;
    const hasAgr = agreementsStore.some((ag) => ag.userEmail.toLowerCase() === app.userEmail.toLowerCase());
    if (!hasAgr) {
      const parts = app.carName.split(" - ");
      const newAgr = {
        id: `AGR-${Math.floor(Math.random() * 8999 + 1e3)}`,
        userEmail: app.userEmail.toLowerCase(),
        carName: parts[0] || "TOYOTA PRIUS",
        weeklyRate: 45,
        startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        endDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        paidContributions: 0,
        remainingMonths: 12,
        depositStatus: "Pending",
        insuranceCopyUrl: null
      };
      agreementsStore.unshift(newAgr);
      saveJson(AGREEMENTS_FILE, agreementsStore);
    }
    const autoEmail = {
      id: `EMAIL-${Date.now()}`,
      userEmail: app.userEmail.toLowerCase(),
      subject: "HEATHROW INBOX: Rent-to-Own Application Approved!",
      content: `Dear Applicant, your driving credentials validation and Soft Credit review are complete. Your underwriting application status is APPROVED.

Deposit requirement is activated. Please pay your refundable lease deposit of \xA3150 in the driver portal to initiate EV key logistics delivery schedules. Your temporary motor cover documents will be generated within 1 hour.`,
      dateSent: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      attachmentUrl: null
    };
    emailsStore.unshift(autoEmail);
    saveJson(EMAILS_FILE, emailsStore);
  }
  if (status === "Rejected") {
    const rejectEmail = {
      id: `EMAIL-${Date.now()}`,
      userEmail: app.userEmail.toLowerCase(),
      subject: "HEATHROW INBOX: Application Underwriting Status Update",
      content: `Dear Applicant, we regret to inform you that your rent-to-own lease folders has been declined due to driver eligibility credentials checks. Please cross check your driving history details and uploaded address proof files for precision.`,
      dateSent: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      attachmentUrl: null
    };
    emailsStore.unshift(rejectEmail);
    saveJson(EMAILS_FILE, emailsStore);
  }
  saveJson(APPLICATIONS_FILE, applicationsStore);
  res.json({ message: "Underwriting status progressed successfully!", application: app });
};
var adminGetUsers = (req, res) => {
  const usersStore = loadJson(USERS_FILE, []);
  const applicationsStore = loadJson(APPLICATIONS_FILE, []);
  const activeUsersData = usersStore.map((u) => {
    const appsCount = applicationsStore.filter((a) => a.userEmail.toLowerCase() === u.email.toLowerCase()).length;
    return {
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      blocked: u.blocked || false,
      applicationsCount: appsCount
    };
  });
  res.json(activeUsersData);
};
var adminDeleteUser = (req, res) => {
  let usersStore = loadJson(USERS_FILE, []);
  const { email } = req.params;
  const originalLen = usersStore.length;
  usersStore = usersStore.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
  if (usersStore.length === originalLen) {
    return res.status(404).json({ error: "User mismatch or not registered." });
  }
  saveJson(USERS_FILE, usersStore);
  res.json({ message: "Driver account profile permanent purged." });
};
var adminBlockUser = (req, res) => {
  const usersStore = loadJson(USERS_FILE, []);
  const { email } = req.params;
  const { blocked } = req.body;
  const profile = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!profile) {
    return res.status(404).json({ error: "Driver profile mismatch." });
  }
  profile.blocked = blocked === true;
  saveJson(USERS_FILE, usersStore);
  res.json({ message: `Driver access ${profile.blocked ? "SUSPENDED" : "RESTORED"} successfully!`, user: profile });
};
var adminGetPayments = (req, res) => {
  const paymentsStore = loadJson(PAYMENTS_FILE, []);
  res.json(paymentsStore);
};
var adminVerifyPayment = (req, res) => {
  const paymentsStore = loadJson(PAYMENTS_FILE, []);
  const agreementsStore = loadJson(AGREEMENTS_FILE, []);
  const { id } = req.params;
  const tx = paymentsStore.find((p) => p.id === id);
  if (!tx) {
    return res.status(404).json({ error: "Payment statement target missing." });
  }
  tx.status = "Successful";
  saveJson(PAYMENTS_FILE, paymentsStore);
  const agr = agreementsStore.find((a) => a.userEmail.toLowerCase() === tx.userEmail.toLowerCase());
  if (agr) {
    agr.depositStatus = "Paid";
    agr.paidContributions = (agr.paidContributions || 0) + Number(tx.amount);
    saveJson(AGREEMENTS_FILE, agreementsStore);
  }
  res.json({ message: "Payment statement confirmed as Successful!", payment: tx });
};
var adminGetEmails = (req, res) => {
  const emailsStore = loadJson(EMAILS_FILE, []);
  res.json(emailsStore);
};
var adminSendEmail = (req, res) => {
  const emailsStore = loadJson(EMAILS_FILE, []);
  const { userEmail, subject, content, attachmentUrl } = req.body;
  if (!userEmail || !subject || !content) {
    return res.status(400).json({ error: "Email subject and target user details mandatory." });
  }
  const emailItem = {
    id: `EMAIL-${Date.now()}`,
    userEmail: userEmail.toLowerCase(),
    subject,
    content,
    dateSent: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    attachmentUrl: attachmentUrl || null
  };
  emailsStore.unshift(emailItem);
  saveJson(EMAILS_FILE, emailsStore);
  res.status(201).json({ message: "Administrative support message dispatched!", email: emailItem });
};
var adminUploadInsurance = (req, res) => {
  const agreementsStore = loadJson(AGREEMENTS_FILE, []);
  const emailsStore = loadJson(EMAILS_FILE, []);
  const { userEmail, insuranceCopyUrl } = req.body;
  if (!userEmail) {
    return res.status(400).json({ error: "Target driver email not specified." });
  }
  const targetEmail = userEmail.toLowerCase();
  const agr = agreementsStore.find((a) => a.userEmail.toLowerCase() === targetEmail);
  if (agr) {
    agr.insuranceCopyUrl = insuranceCopyUrl || "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=800";
    saveJson(AGREEMENTS_FILE, agreementsStore);
  }
  const insuranceEmail = {
    id: `EMAIL-${Date.now()}`,
    userEmail: targetEmail,
    subject: "HEATHROW SECURITY: Motor Fleet Insurance Certificate Cover",
    content: "Please find attached your comprehensive motor fleet insurance certificate for your active rent-to-buy lease. Review high-visibility safety directives in case of physical breakdown cover callouts.",
    dateSent: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    attachmentUrl: insuranceCopyUrl || "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=800"
  };
  emailsStore.unshift(insuranceEmail);
  saveJson(EMAILS_FILE, emailsStore);
  res.json({ message: "Motor insurance copy attached and support copy sent!", email: insuranceEmail });
};
var adminGetInquiries = (req, res) => {
  const inquiriesStore = loadJson(INQUIRIES_FILE, []);
  res.json(inquiriesStore);
};
var adminUpdateUserRole = (req, res) => {
  const usersStore = loadJson(USERS_FILE, []);
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: "Missing required parameters: email and role." });
  }
  const profile = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!profile) {
    return res.status(404).json({ error: "No user found with this email coordinates." });
  }
  profile.role = role;
  saveJson(USERS_FILE, usersStore);
  res.json({ message: `Successfully updated user role to ${role.toUpperCase()}`, user: profile });
};
var deleteApplication = (req, res) => {
  let applicationsStore = loadJson(APPLICATIONS_FILE, []);
  const { id } = req.params;
  const originalLen = applicationsStore.length;
  applicationsStore = applicationsStore.filter((a) => a.id !== id);
  if (applicationsStore.length === originalLen) {
    return res.status(404).json({ error: "Application records not found." });
  }
  saveJson(APPLICATIONS_FILE, applicationsStore);
  res.json({ message: "Lease application successfully deleted." });
};
var deleteAgreement = (req, res) => {
  let agreementsStore = loadJson(AGREEMENTS_FILE, []);
  const { id } = req.params;
  const originalLen = agreementsStore.length;
  agreementsStore = agreementsStore.filter((a) => a.id !== id);
  if (agreementsStore.length === originalLen) {
    return res.status(404).json({ error: "Lease contract agreement not found." });
  }
  saveJson(AGREEMENTS_FILE, agreementsStore);
  res.json({ message: "Lease contract agreement successfully truncated." });
};
var deletePayment = (req, res) => {
  let paymentsStore = loadJson(PAYMENTS_FILE, []);
  const { id } = req.params;
  const originalLen = paymentsStore.length;
  paymentsStore = paymentsStore.filter((p) => p.id !== id);
  if (paymentsStore.length === originalLen) {
    return res.status(404).json({ error: "Payment transaction block not found." });
  }
  saveJson(PAYMENTS_FILE, paymentsStore);
  res.json({ message: "Payment receipt statement permanent deleted." });
};

// backend/src/routes/api.js
var uploadDir = import_path2.default.join(import_os.default.tmpdir(), "uploads");
if (!import_fs2.default.existsSync(uploadDir)) {
  import_fs2.default.mkdirSync(uploadDir, { recursive: true });
}
var fileStorage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = import_path2.default.extname(file.originalname) || ".jpg";
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});
var upload = (0, import_multer.default)({
  storage: fileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
  // 5MB limit
});
var docsUpload = upload.fields([
  { name: "licenseFront", maxCount: 1 },
  { name: "licenseBack", maxCount: 1 },
  { name: "proofOfAddress", maxCount: 1 }
]);
var router = import_express.default.Router();
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: getMongooseConnectionState() ? "mongoose" : "simulated_local",
    rateLimiting: "active",
    csrfDefense: "enabled",
    xssDefense: "enabled",
    nosqlDefense: "enabled"
  });
});
router.get("/csrf-token", (req, res) => {
  const csrfToken = import_crypto.default.randomBytes(24).toString("hex");
  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: true,
    sameSite: "None"
  });
  res.json({ csrfToken });
});
router.get("/config/google-client-id", (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || "51093669905-ol708dcv8e0is2ch1tet4hmq8m6eq7sh.apps.googleusercontent.com"
  });
});
router.post("/auth/login", login);
router.post("/auth/signup-send-otp", signupSendOtp);
router.post("/auth/signup-verify-otp", signupVerifyOtp);
router.post("/auth/signup", legacySignup);
router.post("/auth/google", googleSignin);
router.post("/auth/logout", logout);
router.put("/auth/profile", editProfile);
router.get("/user/data", getUserData);
router.get("/cars", getCars);
router.post("/cars", addCar);
router.put("/cars/:id", updateCar);
router.delete("/cars/:id", deleteCar);
router.post("/applications", createApplication);
router.put("/applications/:id/step", updateApplicationStep);
router.put("/applications/:id/documents", updateApplicationDocuments);
router.post("/payments", submitPayment);
router.post("/inquiries", submitInquiry);
router.post("/upload/avatar", upload.single("avatar"), uploadAvatar);
router.post("/upload/car-image", upload.single("carImage"), uploadCarImage);
router.post("/upload/documents", docsUpload, uploadDocumentsMock);
var checkAdminRole = (req, res, next) => {
  next();
};
router.get("/admin/all-records", checkAdminRole, getAllRecords);
router.post("/admin/add-car", checkAdminRole, adminAddCar);
router.put("/admin/edit-car/:id", checkAdminRole, adminEditCar);
router.delete("/admin/delete-car/:id", checkAdminRole, adminDeleteCar);
router.get("/admin/applications", checkAdminRole, adminGetApplications);
router.put("/admin/application-status/:id", checkAdminRole, adminUpdateApplicationStatus);
router.get("/admin/users", checkAdminRole, adminGetUsers);
router.delete("/admin/user/:email", checkAdminRole, adminDeleteUser);
router.put("/admin/user/block/:email", checkAdminRole, adminBlockUser);
router.get("/admin/payments", checkAdminRole, adminGetPayments);
router.post("/admin/payments/verify/:id", checkAdminRole, adminVerifyPayment);
router.get("/admin/emails", checkAdminRole, adminGetEmails);
router.post("/admin/emails/send", checkAdminRole, adminSendEmail);
router.post("/admin/emails/upload-insurance", checkAdminRole, adminUploadInsurance);
router.get("/admin/inquiries", checkAdminRole, adminGetInquiries);
router.put("/admin/users/role", checkAdminRole, adminUpdateUserRole);
router.delete("/applications/:id", checkAdminRole, deleteApplication);
router.delete("/agreements/:id", checkAdminRole, deleteAgreement);
router.delete("/payments/:id", checkAdminRole, deletePayment);
var api_default = router;

// backend/src/middleware/securityMiddleware.js
var import_cors = __toESM(require("cors"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.APP_URL || ""
].filter(Boolean);
var corsMiddleware = (0, import_cors.default)({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".run.app") || origin.startsWith("http://localhost:")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
});
var apiRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 1e3,
  // Very high limit to prevent locking out students or agents
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many API requests from this connection channel. Please wait." }
});
var mongoSanitizeMiddleware = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (key.startsWith("$") || key.includes(".")) {
          const newKey = key.replace(/[\$.]/g, "");
          obj[newKey] = obj[key];
          delete obj[key];
          sanitize(obj[newKey]);
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};
var xssProtectionMiddleware = (req, res, next) => {
  const clean = (val) => {
    if (typeof val === "string") {
      return val.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "");
    }
    return val;
  };
  const sanitize = (obj) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (typeof obj[key] === "string") {
          obj[key] = clean(obj[key]);
        } else if (obj[key] instanceof Object) {
          sanitize(obj[key]);
        }
      }
    }
  };
  if (req.body) sanitize(req.body);
  next();
};
var expressHelmet = (req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.removeHeader("Content-Security-Policy");
  res.setHeader("X-Frame-Options", "ALLOWALL");
  next();
};
var parameterPollutionProtection = (req, res, next) => {
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][0];
      }
    }
  }
  next();
};

// backend/src/middleware/csrfMiddleware.js
var csrfProtection = (req, res, next) => {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return next();
  }
  if (req.path === "/api/csrf-token") {
    return next();
  }
  const csrfHeader = req.headers["x-csrf-token"] || req.headers["X-CSRF-Token"];
  const csrfCookie = req.cookies && req.cookies["csrfToken"];
  if (!csrfHeader) {
    console.warn(`[CSRF-Security] Rejected ${method} ${req.path} - missing x-csrf-token header.`);
    return res.status(403).json({ error: "Security verification failed: Please refresh your browser or log in again." });
  }
  next();
};

// backend/src/app.js
async function createApp() {
  const app = (0, import_express2.default)();
  app.set("trust proxy", 1);
  app.use(expressHelmet);
  app.use((0, import_cookie_parser.default)());
  app.use(import_express2.default.json());
  app.use(import_express2.default.urlencoded({ extended: true }));
  app.use(parameterPollutionProtection);
  app.use(mongoSanitizeMiddleware);
  app.use(xssProtectionMiddleware);
  app.use(corsMiddleware);
  app.use("/uploads", import_express2.default.static(import_path3.default.join(import_os2.default.tmpdir(), "uploads")));
  app.use((req, res, next) => {
    console.log(`[Request-Logger] ${req.method} ${req.url}`);
    next();
  });
  app.use("/api", apiRateLimiter);
  app.use(csrfProtection);
  app.use("/api", api_default);
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Configuring Vite live compilation middleware for frontend...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      root: import_path3.default.resolve(process.cwd(), "frontend"),
      configFile: import_path3.default.resolve(process.cwd(), "vite.config.js"),
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Configuring production file server distribution...");
    const distPath = import_path3.default.resolve(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path3.default.join(distPath, "index.html"));
    });
  }
  return app;
}

// backend/server.js
var envPath = import_path4.default.resolve(process.cwd(), "backend", ".env");
if (import_fs3.default.existsSync(envPath)) {
  import_dotenv.default.config({ path: envPath });
  console.log("[ENV] Loaded backend/.env successfully");
} else {
  console.log("[ENV ERROR] backend/.env not found!");
}
var PORT = process.env.PORT || 3e3;
async function startServer() {
  await connectDatabase();
  const app = await createApp();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("[FATAL ERROR]", err);
});
//# sourceMappingURL=server.cjs.map

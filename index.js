const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

// Connection to the database.
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);

// Schemas for the database.
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
});
const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", ExerciseSchema);

// CORS & Middleware.
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Endpoints.
/// Create user.
app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  const newUser = new User({ username });
  try {
    const user = await newUser.save();
    res.json(user);
  } catch (error) {
    console.log(error);
    res.send("Error creating user. Please try again.");
  }
  // newUser.save((err, data) => {
  //  if (err) return console.error(err);
  //  res.json(data);
  // });
});

/// Add exercise.
app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date ? new Date(req.body.date) : new Date();
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.send("User not found.");
    } else {
      const newExercise = new Exercise({
        user_id: userId,
        description,
        duration,
        date,
      });
      const exercise = await newExercise.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      });
    }
  } catch (error) {
    console.log(error);
    res.send("Error saving exercise. Please try again.");
  }
});

/// Get list of users.
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}).select("username _id");
    if (!users) {
      res.send("No users found.");
    } else {
      res.json(users);
    }
  } catch (error) {
    console.log(error);
    res.send("Error retrieving users. Please try again.");
  }
});

/// Get user logs.
app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const from = req.query.from ? new Date(req.query.from) : new Date(0);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const limit = req.query.limit ? parseInt(req.query.limit) : 0;
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.send("User not found.");
      return;
    } else {
      const exercises = await Exercise.find({
        user_id: userId,
        date: { $gte: from, $lte: to },
      })
        .select("description duration date")
        .limit(limit);
      res.json({
        username: user.username,
        count: exercises.length,
        _id: user._id,
        log: exercises.map((exercise) => ({
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString(),
        })),
      });
    }
  } catch (error) {
    console.log(error);
    res.send("Error retrieving user logs. Please try again.");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// Martín Fargnoli.
// Back-end development and APIs certification.
// FreeCodeCamp.
// https://www.freecodecamp.org/

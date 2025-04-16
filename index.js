const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
require('dotenv').config()

// Middleware
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// Schemas
const { Schema } = mongoose

const userSchema = new Schema({
  username: { type: String, required: true }
})

const exerciseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
})

const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)

// Routes

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

// POST /api/users - create a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body
  try {
    const user = new User({ username })
    await user.save()
    res.json({ username: user.username, _id: user._id })
  } catch (err) {
    res.status(500).json({ error: 'User creation failed' })
  }
})

// GET /api/users - return list of users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id')
  res.json(users)
})

// POST /api/users/:_id/exercises - add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id
  const { description, duration, date } = req.body

  try {
    const user = await User.findById(userId)
    if (!user) return res.status(400).json({ error: 'User not found' })

    const exercise = new Exercise({
      userId,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    })

    await exercise.save()

    res.json({
      _id: user._id,
      username: user.username,
      date: exercise.date.toDateString(),
      duration: exercise.duration,
      description: exercise.description
    })
  } catch (err) {
    res.status(500).json({ error: 'Exercise creation failed' })
  }
})

// GET /api/users/:_id/logs - get logs with optional query params
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id
  const { from, to, limit } = req.query

  try {
    const user = await User.findById(userId)
    if (!user) return res.status(400).json({ error: 'User not found' })

    let filter = { userId }
    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from)
      if (to) filter.date.$lte = new Date(to)
    }

    let query = Exercise.find(filter).select('description duration date')
    if (limit) query = query.limit(parseInt(limit))

    const logs = await query.exec()

    res.json({
      _id: user._id,
      username: user.username,
      count: logs.length,
      log: logs.map(entry => ({
        description: entry.description,
        duration: entry.duration,
        date: entry.date.toDateString()
      }))
    })
  } catch (err) {
    res.status(500).json({ error: 'Could not retrieve logs' })
  }
})

// Listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

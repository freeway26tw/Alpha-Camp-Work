const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('This is my first Express Web App')
})

app.get('/food', (req, res) => {
  res.send('My favorite food is ice cream')
})

app.get('/popular/languages', (req, res) => {
  res.send('Javascript is a popular language')
})

app.get('/popular/languages/:language', (req, res) => {
  res.send(`<h1>${req.params.language} is a popular language</h1>`)
})

app.listen(port, () => {
  console.log(`Express is running on http://localhost:${port}`)
})
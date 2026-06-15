# Per Scholas Capstone Project (Back End)

Welcome to Per Scholas Capstone Project, where I created , [The Dineary](https://perscholascapstonefe.onrender.com/), a restaurant and dining experience journal application where users can log, manage, and organize their dining experience.

<br>

## Table of Contents

- [Installation](#installation)
- [Environment Variables](#env)
- [Running the Server](#running)
- [API Routes & Usage](#api)
- [Database Schema Overview](#schema)
- [Error Handling & Status Codes](#error)
- [Technologies](#technologies)
- [Notes](#notes)
- [Acknowledgments](#acknowledgments)
- [Feedback](#feedback)

<br>

## Installation <a name="installation"></a>

```sh
git clone https://github.com/SutheeDev/PerScholasCapstoneBE.git
cd PerScholasCapstoneBE
npm install
```

<br>

## Environment Variables <a name="env"></a>

Create a `.env` file and add the following variables:

```sh
PORT=5000
MONGO_URI=your-mongodb-connection-string
```

<br>

## Running the Server <a name="running"></a>

```sh
npm start
```

_Note: This project uses Nodemon for hot reloading._

<br>

## API Routes & Usage <a name="api"></a>

### 1. User Routes

- `GET /api/user/:id` - Get user details
- `PATCH /api/user/:id` - Update user details

### 2. Restaurant Routes

- `POST /api/restaurants/:userId` - Create a restaurant entry
- `GET /api/restaurants/:userId` - Get all user restaurants
- `GET /api/restaurants/:userId/:restaurantId` - Get a single restaurant entry
- `PATCH /api/restaurants/:userId/:restaurantId` - Update a restaurant entry
- `DELETE /api/restaurants/:userId/:restaurantId` - Delete a restaurant entry

### 3. Seed Routes (for populating data)

- `GET /api/seed/users` - Populate user data
- `GET /api/seed/restaurants` - Populate restaurant data

<br>

## Database Schema Overview <a name="schema"></a>

The application uses MongoDB with Mongoose. Below is a summary of the key schema properties:

### User Schema

- `name` (String, required, 2-20 chars, trimmed)
- `lastname` (String, max 20 chars, trimmed)
- `email` (String, required, unique)
- `password` (String, required, min 6 chars)

### Restaurant Schema

- `name` (String, required, trimmed)
- `cuisine` (String, optional)
- `visitDate` (Date, required)
- `rating` (Number, required, 1-5 scale)
- `review` (String, optional)
- `priceRange` (String, enum: "", "$", "$$", "$$$", "$$$$")
- `image` (String, default placeholder image)
- `userId` (Reference to User)

For full schema details, refer to the `models/` directory.

<br>

## Error Handling & Status Codes <a name="error"></a>

- `400` - Bad request
- `404` - Not found
- `500` - Internal server error

<br>

## Technologies Used <a name="technologies"></a>

- Node.js
- Express.js
- MongoDB / Mongoose
- Cloudinary
- Axios
- Cors
- Dotenv
- Deployed on [Render.com](https://render.com)

<br>

## Notes <a name="notes"></a>

This project is still in progress. Future updates will include:

- Additional schemas and schema properties
- More user-related routes (login, register, delete user)
- JWT authentication and cookies

<br>

## Acknowledgments <a name="acknowledgments"></a>

- Seed files were created to populate user and restaurant data.
- Special thanks to [Unsplash](https://unsplash.com/) for food and restaurant images used in this project.
- For Front End repository, follow this [Link](https://github.com/SutheeDev/PerScholasCapstoneFE)

<br>

## Feedback <a name="feedback"></a>

Feedback to improve this project is welcome. If you have any suggestions or would like to collaborate, please get in touch with me on [GitHub](https://github.com/SutheeDev). Thanks!

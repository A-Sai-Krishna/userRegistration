const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const path = require("path");
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(`DbError:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashPassword =await bcrypt.hash(password, 10);
  const selectUserQuery = `
    SELECT *
    FROM
    user
    WHERE
    username=${username};`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
        INSERT INTO
        user (username,name,password,gender,location)
        VALUES('${username}','${name}','${hashPassword}','${gender}','${location}');`;
    if (password.length > 4) {
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const isUserThereQuery = `
  SELECT *
  FROM
  user
  WHERE username=${username};`;
  const dbUser = await db.get(isUserThereQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const isUserThereQuery = `
    SELECT *
    FROM
    user
    WHERE username=${username};`;
  const dbUser = await db.get(isUserThereQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched) {
      if (password.length > 4) {
        const hashedPassword =await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
          user
          SET
          password=${hashedPassword}
          WHERE
          username=${username};`;
        const user = await db.run(updatePasswordQuery);
        response.send("Password Updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;

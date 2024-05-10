const { test, describe, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const supertest = require('supertest');
const app = require('../app');
const helper = require('./test_helper');
const mongoose = require('mongoose');

const api = supertest(app);

describe.only('When there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({
      name: 'Superuser',
      username: 'root',
      passwordHash,
    });
    await user.save();
  });

  test.only('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    assert(usernames.includes(newUser.username));
  });

  test.only('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    assert(result.body.error.includes('expected `username` to be unique'));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test.only('creation fails with proper statuscode and message if username does not exists', async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      name: 'Superuser',
      password: 'salainen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    assert(result.body.error.includes('User validation failed'));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test.only('creation fails with proper statuscode and message if password does not exists', async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      name: 'Superuser',
      username: 'root',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    assert(result.body.error.includes('Password is required'));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test.only('creation fails with proper statuscode and message if length of password is less then 3 characters', async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      name: 'Superuser',
      username: 'root',
      password: '',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    assert(
      result.body.error.includes(
        'Password must be at least 3 characters long.',
      ),
    );

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });
});

after(async () => {
  await mongoose.connection.close();
});

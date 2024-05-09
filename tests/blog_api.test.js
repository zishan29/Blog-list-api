const { test, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const supertest = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Blog = require('../models/blog');
const helper = require('./test_helper');

const api = supertest(app);

beforeEach(async () => {
  await Blog.deleteMany({});

  for (let blog of helper.initialBlogs) {
    let blogObj = new Blog(blog);
    await blogObj.save();
  }
});

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/);
});

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs');
  assert.strictEqual(response.body.length, helper.initialBlogs.length);
});

test.only('unique identifier property named as id', async () => {
  const response = await api.get('/api/blogs');

  const ids = response.body.map((obj) => obj.id);
  assert.strictEqual(ids.length, helper.initialBlogs.length);
});

test.only('a valid blog can be added', async () => {
  const newBlog = {
    title: 'title3',
    author: 'author3',
    url: 'url3',
    likes: 31,
  };

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/);

  const blogsAtEnd = await helper.blogsInDB();
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);

  const titles = blogsAtEnd.map((blog) => blog.title);
  assert(titles.includes('title3'));
});

after(async () => {
  await mongoose.connection.close();
});

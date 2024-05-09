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

test('unique identifier property named as id', async () => {
  const response = await api.get('/api/blogs');

  const ids = response.body.map((obj) => obj.id);
  assert.strictEqual(ids.length, helper.initialBlogs.length);
});

test('a valid blog can be added', async () => {
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

test('deletion of a note', async () => {
  const blogsAtStart = await helper.blogsInDB();
  const blogToDelete = blogsAtStart[0];

  await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

  const blogsAtEnd = await helper.blogsInDB();

  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1);

  const titles = blogsAtEnd.map((b) => b.title);
  assert(!titles.includes(blogToDelete.title));
});

test('update a note', async () => {
  const blogsAtStart = await helper.blogsInDB();
  const blogToUpdate = { ...blogsAtStart[0], likes: blogsAtStart[0].likes + 1 };
  const response = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(blogToUpdate)
    .expect(200);

  assert.deepStrictEqual(response.body, blogToUpdate);
});

after(async () => {
  await mongoose.connection.close();
});

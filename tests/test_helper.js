const Blog = require('../models/blog');

const initialBlogs = [
  {
    title: 'title1',
    author: 'author1',
    url: 'url1',
    likes: 32,
  },
  {
    title: 'title2',
    author: 'author2',
    url: 'url2',
    likes: 323,
  },
];

const blogsInDB = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

module.exports = {
  initialBlogs,
  blogsInDB,
};

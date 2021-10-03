const { AuthenticationError } = require("apollo-server-express");
const { User, Book } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      try {
        if (context.user) {
          const user = await User.findById(context.user._id);
          return user;
        }
        throw new AuthenticationError("Not logged in");
      } catch (err) {
        console.log(err);
      }
    },
  },

  Mutation: {
    addUser: async (parent, { email, password, username }) => {
      try {
        const emailUser = await User.findOne({ email });
        if (emailUser) {
          throw new AuthenticationError("Email Taken");
        }
        const user = await User.create({
          email,
          password,
          username,
        });

        const token = signToken(user);
        return { token, user };
      } catch (err) {
        console.log(err);
      }
    },

    login: async (parent, { email, password }) => {
      try {
        const user = await User.findOne({ email });

        if (!user) {
          throw new AuthenticationError("Incorrect credentials");
        }

        const correctPw = await user.isCorrectPassword(password);

        if (!correctPw) {
          throw new AuthenticationError("Incorrect credentials");
        }

        const token = signToken(user);
        return { token, user };
      } catch (err) {
        console.log(err);
      }
    },
    saveBook: async (
      __,
      { bookId, description, title, authors, image, link },
      context
    ) => {
      try {
        console.log(context.user + "context");
        const author = await User.findById(context.user._id);
        if (!!author) {
          const updatedUser = await User.findOneAndUpdate(
            { _id: context.user._id },
            {
              $addToSet: {
                savedBooks: {
                  bookId,
                  description,
                  title,
                  authors,
                  image,
                  link,
                },
              },
            },
            { new: true, runValidators: true }
          );
          return updatedUser;
        }
        throw new AuthenticationError("Not logged in");
      } catch (err) {
        console.log(err);
      }
    },
    removeBook: async (__, { bookId }, context) => {
      console.log("In heree" + bookId);
      try {
        const author = await User.findById(context.user._id);
        if (!!author) {
          const updatedUser = await User.findOneAndUpdate(
            { _id: context.user._id },
            { $pull: { savedBooks: { bookId } } },
            { new: true }
          );
          if (!updatedUser) {
            return res
              .status(404)
              .json({ message: "Couldn't find user with this id!" });
          }
          //    console.log(updatedUser);
          return updatedUser;
        }
        throw new AuthenticationError("Not logged in");
      } catch (err) {
        console.log(err);
      }
    },
  },
};

module.exports = resolvers;

'use strict';

// Require our models. Running each module registers the model into sequelize
// so any other part of the application could call sequelize.model('User')
// to get access to the User model.

const User = require('./user');
const Cat = require('./cat');

Cat.belongsTo(User, {as: 'pet'});

module.exports = {User, Cat};


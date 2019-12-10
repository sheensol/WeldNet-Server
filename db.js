var Bookshelf = require('bookshelf');

var config = {
   host : '127.0.0.1',
   user : 'postgres',
   password : 'haider',
   database : 'pern_stack'
};

var DB = Bookshelf.initialize({
   client: 'pg',
   connection: config
});

module.exports.DB = DB;

const DB = require('../db').DB;

const User = DB.Model.extend({
   tableName: 'users',
   idAttribute: 'ID'
});
const Users = DB.Collection.extend({
   model:User
});
const Company = DB.Model.extend({
   tableName: 'company',
   idAttribute: 'ID'
});
const Companys = DB.Collection.extend({
   model:Company
});
module.exports = {
   User: User,
   Users:Users,
   Company:Company,
   Companys:Companys
};
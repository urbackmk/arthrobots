var Parse = require('parse-browserify');

var ProgramModel = require('./ProgramModel');
var World = require('../core/World');
var WorldParser = require('../core/WorldParser');

var WorldModel = Parse.Object.extend("WorldModel", {
  loadCurrentUserPrograms: function(success) {
    var query = new Parse.Query(ProgramModel);
    query.equalTo("world", this);
    query.equalTo("owner", Parse.User.current());
    query.find({
      success: success,
      error: function() {
        alert("there was an error loading programs:"+error.code+" "+error.message);
      }
    });
  },
  getNewWorld: function() {
    var world = new World();
    var parser = new WorldParser(this.get('definition').split('\n'), world);
    parser.parse();
    return world;
  },
  getNewWorldAtStep: function(index) {
    var world = new World();
    var parser = new WorldParser(this.get('steps')[index].split('\n'), world);
    parser.parse();
    return world;
  },
  getTitle: function() {
    if (this.get('order')) {
      return 'Level '+this.get('order')+': '+this.get('name');
    }
    return this.get('name');
  }
});



module.exports = WorldModel;
var assert = require("assert");
var git2provCvt = require("../lib/git2provConverter");

describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(9));
    })
  })
});

//
//describe('Simple', function(){
//    describe('S1', function(){
//        it('should return ok when run', function(){
//            git2provCvt.convert("GITURL");
//        })
//    })
//});


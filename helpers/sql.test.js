const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require('../expressError');

describe("sqlForPartialUpdate", function() {
  let data, definitions;
  beforeEach(function(){
    data = {firstName: "John", age:40, lastName: "Doe"};
    definitions = {firstName: "first_name", lastName: "last_name"}
  })
  test("returns expected output", function() {
    const result = sqlForPartialUpdate(data, definitions);
    expect(result.values).toEqual(["John", 40, "Doe"]);
    expect(result.setCols).toEqual('"first_name"=$1, "age"=$2, "last_name"=$3');
  });
  test("throws 400 BadRequestError if no data in object", function() {
    data = {};
    const s = () => {sqlForPartialUpdate(data, definitions)}
    expect(s).toThrow(BadRequestError);
  });
});
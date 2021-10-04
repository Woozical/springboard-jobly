const { sqlForPartialUpdate, sqlForFilter } = require('./sql');
const { BadRequestError } = require('../expressError');

describe("sqlForPartialUpdate", function() {
  let data, definitions;
  beforeEach(function(){
    data = {firstName: "John", age:40, lastName: "Doe"};
    definitions = {firstName: "first_name", lastName: "last_name"}
  })
  test("works", function() {
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

describe("sqlForFilter", function() { 
  test("works", function() {
    const filters = [
      {column: "name", operation: "ILIKE", value: "Dog"},
      {column: "num_employees", operation: ">", value: 3},
      {column: "num_employees", operation: "<", value: 6}];

    const result = sqlForFilter(filters);
    expect(result.values).toEqual(["%Dog%", 3, 6]);
    expect(result.string).toEqual('"name" ILIKE $1 AND "num_employees" > $2 AND "num_employees" < $3');
  })
})
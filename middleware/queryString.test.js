const { cleanCompanyQString, cleanJobQString } = require('./queryString');
const { BadRequestError } = require('../expressError');

describe('Clean query string for Company filtering', function() {
  test('works', function() {
      expect.assertions(2);
      const req = { query : {name: 'dog', minEmployees: 2, numDragons: 50} };
      const res = {};
      const next = function (err) {
          expect(err).toBeFalsy()
      };
      cleanCompanyQString(req, res, next);
      expect(req.cleanQuery).toEqual( {name: 'dog', minEmployees: 2} );
  });
  test('throws BadRequestError if minEmployees > maxEmployees in query string', function() {
      expect.assertions(2);
      const req = { query : { minEmployees: 6, maxEmployees: 3 } };
      const res = {};
      const next = function (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
      };
      cleanCompanyQString(req, res, next);
      expect(req.cleanQuery).toBeUndefined();
  });
  test('No clean query on empty or completely invalid', function() {
      expect.assertions(4);
      let req = { query : {} };
      const res = {};
      const next = function (err) {
          expect(err).toBeFalsy();
      };
      cleanCompanyQString(req, res, next);
      expect(req.cleanQuery).toBeUndefined();

      req = { query : {numDragons: 50, favColor: 'green'} };
      cleanCompanyQString(req, res, next);
      expect(req.cleanQuery).toBeUndefined();
  });
});

describe('Clean query string for Job filtering', function() {
    test('works', function() {
        expect.assertions(2);
        const req = { query : {title: 'dog', minSalary: 2, numDragons: 50, hasEquity: 'true'} };
        const res = {};
        const next = function (err) {
            expect(err).toBeFalsy()
        };
        cleanJobQString(req, res, next);
        expect(req.cleanQuery).toEqual( {title: 'dog', minSalary: 2, hasEquity: true} );
    });
    test('No clean query on empty or completely invalid', function() {
        expect.assertions(4);
        let req = { query : {} };
        const res = {};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        cleanJobQString(req, res, next);
        expect(req.cleanQuery).toBeUndefined();
  
        req = { query : {numDragons: 50, favColor: 'green'} };
        cleanJobQString(req, res, next);
        expect(req.cleanQuery).toBeUndefined();
    });
  });
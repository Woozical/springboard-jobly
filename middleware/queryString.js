const { BadRequestError } = require('../expressError');

/** Cleans an incoming query string to be used in filtering company results.
 * Adds the "cleanQuery" object property to the request and then continues with next()
 * cleanQuery is a subset of the query string with only the key:values expected,
 * as defined by the filter definitions of the Company model.
 * May improve this later to directly reference the Company model's filters for cleaning.
 */

function cleanCompanyQString(req, res, next){
  if (Object.keys(req.query).length > 0){
    // Clean out bad query parameters
    const params = {};
    if (req.query.name) params.name = req.query.name;
    if (req.query.minEmployees) params.minEmployees = req.query.minEmployees;
    if (req.query.maxEmployees) params.maxEmployees = req.query.maxEmployees;
    if ((params.minEmployees && params.maxEmployees) && (params.minEmployees > params.maxEmployees)){
      return next(new BadRequestError('Min employees can not be greater than max employees'));
    }
    if (Object.keys(params).length > 0) req.cleanQuery = {...params};
  }
  return next();
}

/** Cleans an incoming query string to be used in filtering job results.
 * Adds the "cleanQuery" object property to the request and then continues with next()
 * cleanQuery is a subset of the query string with only the key:values expected,
 * as defined by the filter definitions of the Job model.
 * May improve this later to directly reference the Job model's filters for cleaning.
 */

function cleanJobQString(req, res, next){
  if (Object.keys(req.query).length > 0){
    // Clean out bad query parameters
    const params = {};
    if (req.query.title) params.title = req.query.title;
    if (req.query.minSalary) params.minSalary = req.query.minSalary;
    if (req.query.hasEquity && req.query.hasEquity === 'true') params.hasEquity = true; // Models expect Boolean, not string "true"
    if (Object.keys(params).length > 0) req.cleanQuery = {...params};
  }
  return next();
}

module.exports = { cleanCompanyQString, cleanJobQString }
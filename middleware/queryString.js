const { BadRequestError } = require('../expressError');

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

module.exports = { cleanCompanyQString }
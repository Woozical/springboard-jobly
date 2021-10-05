"use strict"
const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate, sqlForFilter } = require('../helpers/sql');

/* Related functions for jobs. */

class Job{

  /** Static property, maps query string parameter keys to objects of the filter interface
  * that are used by sqlForFilter. Used for constructing WHERE clauses for filtering/searching.
  * Available params:
  *   hasEquity (if true, filter where equity > 0)
  *   minSalary (filter where salary > value)
  *   title (filter where value appears in title, case insensitive)
  */
  static filterDefinitions = {
    hasEquity : {column: "equity", operation: ">", value: 0},
    minSalary : {column: "salary", operation: ">="},
    title: {column: "title", operation: "ILIKE"}
  }

  /** Create a job (from data), update db, return new job data.
  *
  * data should be { title, salary, equity, company_handle }
  *
  * Returns { id, title, salary, equity, company_handle }
  *
  * Throws BadRequestError if company_handle not in database.
  * */
  static async create({title, salary, equity, companyHandle}){
    try{
      const result = await db.query(
        `INSERT INTO jobs
        (title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [title, salary, equity, companyHandle]
      );
      return result.rows[0];
    } catch (err) {
      if (err.code === "23503") throw new BadRequestError(`companyHandle: '${companyHandle}' is invalid`);
    }
  }

   /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */
  static async findAll(){
    const companiesRes = await db.query(
        `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
         FROM jobs
         ORDER BY title`);
    return companiesRes.rows;
  }

   /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company }
   *   where company is [{ handle, name, description, numEmployees, logoUrl }, ...]
   *
   * Throws NotFoundError if not found.
   **/
  static async get(jobID){
      const result = await db.query(
          `SELECT id, title, salary, equity,
          companies.handle, companies.name, companies.description,
          companies.num_employees AS "numEmployees", companies.logo_url AS "logoUrl"
          FROM jobs
          JOIN companies ON jobs.company_handle = companies.handle
          WHERE jobs.id = $1`,
          [jobID]
      );

      if (result.rowCount < 1) throw new NotFoundError(`Job with id ${jobID} does not exist`);

      const {id, title, salary, equity, handle, name, description, numEmployees, logoUrl} = result.rows[0];
      const company = {handle, name, description, numEmployees, logoUrl};
      const job = {id, title, salary, equity, company};
      return job;

  }

  /** Update job data with `data`.
  *
  * This is a "partial update" --- it's fine if data doesn't contain all the
  * fields; this only changes provided ones.
  *
  * Data can include: {title, salary, equity}
  *
  * Returns {id, title, salary, equity, companyHandle}
  *
  * Throws NotFoundError if not found.
  */

  static async update(jobID, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        companyHandle: "company_handle",
      });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, jobID]);
    if (result.rowCount < 1) throw new NotFoundError(`Job with id ${jobID} does not exist`);

    return result.rows[0];
  }

  /** Delete given job from database; returns undefined.
  *
  * Throws NotFoundError if job not found.
  */

  static async remove(jobID) {
    const result = await db.query(
          `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
          [jobID]);

  if (result.rowCount < 1) throw new NotFoundError(`No job with ID: ${jobID}`);
  }
  /**
  * Performs a filtered selection from the database. These filters are defined
  * by the 'params' argument, which is an object, where they key is the type of filter
  * and the value is the expectation of that filter. Each 'params' key is mapped to a definition
  * found at the top of this class, which defines how that filter type corresponds to SQL.
  * 
  * E.g. params = {title: 'engineer', minSalary: 50000 };
  * Returns [{ id, title, salary, equity, companyHandle }, ...], where
  * each object has 'engineer' (case insensitive) appearing in its title, and a salary of at least 50000.
  */

  static async filter(params) {
    // Define filters based on given params
    const filters = [];
    for (let key in params){
      const filter = Job.filterDefinitions[key]
      if (key === 'hasEquity' && params[key] === true){
        // The filter for hasEquity is fully defined up top in the static property
        // If hasEquity parameter is set to anything but true, just ignore it and dont create a filter
        filters.push(filter)
      } else {
        filter.value = params[key];
        filters.push(filter);
      }
    }
    // Build WHERE clause
    const whereClause = sqlForFilter(filters);
    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
        FROM jobs
        WHERE ${whereClause.string}
        ORDER BY title`,
        whereClause.values);
    return jobsRes.rows;
  }

  /**
   * Returns an object with job data and an array of user data for each user
   * that has applied to the given job. Will return an empty array if there are
   * no applicants. Throws NotFoundError if invalid job id given.
   * 
   *  jobID => {
   *    job: { id, title, salary, equity, companyHandle },
   *    applicants: [ { username, firstName, lastName, email, isAdmin }, ... ]
   *    }
   */
  static async getApplicants(jobID){
    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle",
      u.username, u.first_name AS "firstName", u.last_name AS "lastName",
      u.email, u.is_admin AS "isAdmin"
      FROM jobs
      LEFT JOIN applications a ON jobs.id = a.job_id
      LEFT JOIN users u ON a.username = u.username
      WHERE jobs.id = $1`, [jobID]
    );
    
    if (result.rowCount < 1) throw new NotFoundError(`No job with id: ${jobID}`);

    const { id, title, salary, equity, companyHandle } = result.rows[0];
    let applicants = [];
    // Build out our array of user objects if we got at least one row of user data from the query
    if (result.rows[0].username){
      applicants = result.rows.map(
        ({username, firstName, lastName, email, isAdmin}) => ({username, firstName, lastName, email, isAdmin})
      );
    }
    const job = { id, title, salary, equity, companyHandle, applicants }
    return job;

  }
}

module.exports = Job;
"use strict"
const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');

/* Related functions for jobs. */

class Job{
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
      if (err.code === "23503") throw new BadRequestError(`company handle '${companyHandle}' is invalid`);
    }
  }

   /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
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
}

module.exports = Job;
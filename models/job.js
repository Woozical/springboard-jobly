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
}

module.exports = Job;
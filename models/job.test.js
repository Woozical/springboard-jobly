"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new job",
    salary: 1000,
    equity: 0.2,
    companyHandle: 'c1',
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({id: expect.any(Number), title: "new job", salary: 1000, equity: "0.2", companyHandle: "c1"});

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new job'`);
    expect(result.rows).toEqual([
      {
        title: "new job",
        salary: 1000,
        equity: '0.2',
        company_handle: 'c1',
      },
    ]);
  });

  test("bad request with invalid company handle", async function () {
    try {
      let badJob = {...newJob, companyHandle: 'nsdnbgsodibns'};
      await Job.create(badJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

/************************************** get */

/************************************** update */

/************************************** remove */

/************************************** filter */

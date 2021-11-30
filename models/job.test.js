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

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1000,
        equity: "0.1",
        companyHandle: "c1",
        companyName: "C1"
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2000,
        equity: "0.2",
        companyHandle: "c2",
        companyName: "C2"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3000,
        equity: "0.3",
        companyHandle: "c3",
        companyName: "C3"
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const q = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
    const { id } = q.rows[0];
    let job = await Job.get(id);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "j1",
      salary: 1000,
      equity: "0.1",
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 500,
    equity: 0.5,
  };

  let id;
  beforeEach(async function() {
    const q = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
    id = q.rows[0].id;
  });

  test("works", async function () {
    let job = await Job.update(id, updateData);
    expect(job).toEqual({
      ...updateData,
      id,
      equity: '0.5',
      companyHandle: "c1",
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [id]);
    expect(result.rows).toEqual([{
      id,
      title: "New",
      salary: 500,
      equity: '0.5',
      company_handle: "c1",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
    };

    let job = await Job.update(id, updateDataSetNulls);
    expect(job).toEqual({
      id, 
      companyHandle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [id]);
    expect(result.rows).toEqual([{
      id,
      title: "New",
      salary: null,
      equity: null,
      company_handle: "c1",
    }]);
  });

  test("not found if no such job", async function () {
    try {
      const j = await Job.update(-1, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
  /** HANDLING OF THIS HAS BEEN MOVED TO API SCHEMA VALIDATION */
  // test("bad request if no title", async function () {
  //   const badData = {...updateData};
  //   badData.title = '';
  //   try {
  //     await Job.update(id, badData);
  //     fail();
  //   } catch (err) {
  //     expect(err instanceof BadRequestError).toBeTruthy();
  //   }
  //   badData.title = null;
  //   try {
  //     await Job.update(id, badData);
  //     fail();
  //   } catch (err) {
  //     expect(err instanceof BadRequestError).toBeTruthy();
  //   }
  // });

  test("bad request with no data", async function () {
    try {
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  let id;
  beforeEach(async function() {
    const q = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
    id = q.rows[0].id;
  });
  test("works", async function () {
    await Job.remove(id);
    const res = await db.query(
        "SELECT title FROM jobs WHERE id = $1", [id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** filter */

describe("filter", function () {
  test("works", async function() {
    await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
       VALUES ('nj2', 1000, 0, 'c1')`)

    let filters = {title: "2"};
    let jobs = await Job.filter(filters);
    expect(jobs).toEqual([
      {
      id: expect.any(Number),
      title: "j2",
      salary: 2000,
      equity: "0.2",
      companyHandle: "c2",
      companyName: "C2"
      },
      {
      id: expect.any(Number),
      title: "nj2",
      salary: 1000,
      equity: "0",
      companyHandle: "c1",
      companyName: "C1"
    }]);

    filters = {title: "2", hasEquity: true}
    jobs = await Job.filter(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2000,
        equity: "0.2",
        companyHandle: "c2",
        companyName: "C2"
      }
    ])

    filters = {minSalary: 10000};
    jobs = await Job.filter(filters);
    expect(jobs).toEqual([]);

    filters = {minSalary: 2000};
    jobs = await Job.filter(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2000,
        equity: "0.2",
        companyHandle: "c2",
        companyName: "C2"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3000,
        equity: "0.3",
        companyHandle: "c3",
        companyName: "C3"
      }
    ]);
    
  });
});

/************************************** getApplicants */

describe("getApplicants", function() {
  let jobID;
  beforeEach(async function (){
    const jobQuery = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    jobID = jobQuery.rows[0].id;
    await db.query(
      `INSERT INTO applications (username, job_id)
       VALUES ($1, $2)`, ["u1", jobID]
    );
  });

  test("works", async function () {
    const result = await Job.getApplicants(jobID);
    expect(result).toEqual(
      {
        id: jobID,
        title: "j1",
        salary: 1000,
        equity: "0.1",
        companyHandle: "c1",
        applicants: [
          {
            username: "u1",
            firstName: "U1F",
            lastName: "U1L",
            email: "u1@email.com",
            isAdmin: false
          }
        ]
      }
    );
  });

  test("works with no applicants", async function () {
    await db.query('DELETE FROM applications');
    const result = await Job.getApplicants(jobID);
    expect(result).toEqual(
      {
        id: jobID,
        title: "j1",
        salary: 1000,
        equity: "0.1",
        companyHandle: "c1",
        applicants: []
      }
    );
  });

  test("throws NotFoundError if invalid job id", async function () {
    try{
      await Job.getApplicants(-1);
    } catch(err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
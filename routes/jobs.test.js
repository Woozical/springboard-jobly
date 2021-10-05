"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  userToken,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 500,
    equity: 0.5,
    companyHandle: "c1",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {...newJob, id: expect.any(Number)},
    });
  });

  test("forbidden for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${userToken}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 500,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: "500",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "j1",
              salary: 1000,
              equity: "0.1",
              companyHandle: "c1",
            },
            {
              id: expect.any(Number),
              title: "j2",
              salary: 2000,
              equity: "0.2",
              companyHandle: "c2",
            },
            {
              id: expect.any(Number),
              title: "j3",
              salary: 3000,
              equity: "0.3",
              companyHandle: "c3",
            },
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${userToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  let id;
  beforeEach(async function() {
    const q = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
    id = q.rows[0].id;
  });

  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({
      job: {
        id,
        title: "j1",
        salary: 1000,
        equity: "0.1",
        company: {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        }
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/-1`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  let id;
  beforeEach(async function() {
    const q = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
    id = q.rows[0].id;
  });

  test("works for users", async function () {
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id,
        title: "j1-new",
        salary: 1000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "j1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("forbidden for users", async function () {
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${userToken}`);
    expect(resp.statusCode).toEqual(403);
  })

  test("not found on no such company", async function () {
    const resp = await request(app)
        .patch(`/jobs/-1`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          id: 1,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/c1`)
        .send({
          title: "",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs?queryFilter */
// ******** TO DO: REWRITE FOR JOB FILTERS ********
// describe("GET /jobs?queryStringFilter", function () {
//   test("filter by case insensitive company name", async function() {
//     const resp = await request(app).get("/jobs?name=c1");
//     expect(resp.body).toEqual({
//       jobs:
//         [
//           {
//             handle: "c1",
//             name: "C1",
//             description: "Desc1",
//             numEmployees: 1,
//             logoUrl: "http://c1.img",
//           }
//         ]
//     });
//   });

//   test("invalid parameters are ignored and don't muck things up", async function(){
//     const resp = await request(app).get("/jobs?name=c2&minDragons=10");
//     expect(resp.statusCode).toEqual(200);
//     expect(resp.body).toEqual({
//       jobs:
//         [
//           {
//             handle: "c2",
//             name: "C2",
//             description: "Desc2",
//             numEmployees: 2,
//             logoUrl: "http://c2.img",
//           },
//         ]
//     });
//   });

//   test("filter by min and max # of employees", async function() {
//     const resp1 = await request(app).get("/jobs?minEmployees=2");
//     expect(resp1.body).toEqual({
//       jobs:
//         [
//           {
//             handle: "c2",
//             name: "C2",
//             description: "Desc2",
//             numEmployees: 2,
//             logoUrl: "http://c2.img",
//           },
//           {
//             handle: "c3",
//             name: "C3",
//             description: "Desc3",
//             numEmployees: 3,
//             logoUrl: "http://c3.img",
//           }
//         ]
//     });
//     const resp2 = await request(app).get("/jobs?maxEmployees=2");
//     expect(resp2.body).toEqual({
//       jobs:
//         [
//           {
//             handle: "c1",
//             name: "C1",
//             description: "Desc1",
//             numEmployees: 1,
//             logoUrl: "http://c1.img",
//           },
//           {
//             handle: "c2",
//             name: "C2",
//             description: "Desc2",
//             numEmployees: 2,
//             logoUrl: "http://c2.img",
//           }
//         ]
//     });
//     const resp3 = await request(app).get("/jobs?minEmployees=2&maxEmployees=2");
//     expect(resp3.body).toEqual({
//       jobs:
//         [
//           {
//             handle: "c2",
//             name: "C2",
//             description: "Desc2",
//             numEmployees: 2,
//             logoUrl: "http://c2.img",
//           }
//         ]
//     })
//   });

//   test("fails: q string where minEmployees is > maxEmployees", async function(){
//     const resp = await request(app).get("/jobs?minEmployees=3&maxEmployees=2");
//     expect(resp.statusCode).toEqual(400);
//   });
// });

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  let id;
  beforeEach(async function() {
    const q = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
    id = q.rows[0].id;
  });

  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: id });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("forbidden for users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${userToken}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/-1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
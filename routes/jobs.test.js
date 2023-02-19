"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  u2Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /jobs", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          companyHandle: 'c1',
          title: "new-job",
          salary: 80000,
          equity: 0.1
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        companyHandle: 'c1',
        title: "new-job",
        salary: 80000,
        equity: 0.1,
    }}
  )});

  test("unauth for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            id: expect.any(Number),
            companyHandle: 'c1',
            title: "new-job",
            salary: 80000,
            equity: 0.1,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          companyHandle: "c1",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            companyHandle: 'c1',
            title: "new-job",
            salary: 'foobar',
            equity: 0.2,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

//get jobs

describe("GET /jobs", function () {
  test("works for anyone", async function () {
    const resp = await request(app).get(`jobs`);
    expect(resp.body).toEqual({
      jobs: [
        {
            id: expect.any(Number),
            companyHandle: 'J1',
            title: "J1",
            salary:1,
            equity: 0.1,
            companyHandle: 'c1',
            companyName:"C1"
        },
        {
            id: expect.any(Number),
            title: "J2",
            salary:2,
            equity: 0.2,
            companyHandle: 'c1',
            companyName:"C1"
        },
        {
            id: expect.any(Number),
            title: "J3",
            salary:3,
            equity: null,
            companyHandle: 'c1',
            companyName:"C1"
        },
      ],
    });
  });

  test("works: filters", async function () {
    const resp = await request(app)
        .get("/jobs")
        .query({minSalary: 1, title: '2'})
    expect(resp.statusCode).toEqual({
        jobs: [
            {
              id: expect.any(Number),
              title: "J3",
              salary: 3,
              equity: null,
              companyHandle: "c1",
              companyName: "C1",  
            },
        ],
    });
  });

  test("tests bad filter", async function () {
    const resp = await request(app)
        .get("/jobs")
        .query({minSalary:2, random: 'randomText'});
    expect(resp.statusCode).toEqual(400);
  });
});

//get jobs based on id

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
    expect(resp.body).toEqual({  
      job: {
        id: testJobIds[0],
        title: "J1",
        salary: 1,
        equity: "0.1",
        company: {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      },
    });
 });

  test("works for same user", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        applications: [testJobIds[0]],
      },
    });
  });

  test("job not found", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

//patch jobs

describe("PATCH /jobs/:id", () => {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          firstName: "New-jobby",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        title: "New-jobby",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1"
      },
    });
  });

  test("unauth if not admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "New-jobby",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          handle: 'new',
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`jobs/${testJobIds[0]}`)
        .send({
          salary: 'foobar',
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

});

//delete jobs

describe("DELETE /jobs/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: testJobIds[0] });
  });

  test("unauth if not admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });


  test("not found if no job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
})

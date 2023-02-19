"use strict";

const {notFoundError, BadRequestError, NotFoundError} = require("../expressError");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
} = require("./_testCommon");
const Job = require("../../express-jobly-solution/models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function() {
    let newJob = {
        companyHandle: 'c1',
        title: "test",
        salary: 100,
        equity: "0.1"
    };

    test('works', async function () {
        let job = await Job.create(newJob);
        expect(job.toEqual({
            ...newJob,
            id: expect.any(Number),
        }));
    });
});

/************************************** findAll */
//tests for various filters: no filter, equity, salary
describe("findAll", function () {
  test("works with no filter", async function () {
    const jobs = await Job.findAll();
    expect(jobs).toEqual(
          [
            {
              id: testJobIds[0],
              title: 'Job1',
              salary: 100,
              equity: '0.1',
              companyHandle: 'c1',
              companyName: 'C1',
            },
            {
              id: testJobIds[1],
              title: 'Job2',
              salary: 200,
              equity: '0.2',   
              companyHandle: 'c1',
              companyName: 'C1',
            },
            {
              id: testJobIds[2],
              title: 'Job3',
              salary: 300,
              equity: '0',   
              companyHandle: 'c1',
              companyName: 'C1',
            },
            {
              id: testJobIds[3],
              title: "Job4",
              salary: null,
              equity: null,
              companyHandle: "c1",
              companyName: "C1",
            }
    ]);
  });

  //should successfully return a response when filtering by minEmployees
  test('works by min salary', async function() {
    let jobs = await Job.findAll({minSalary: 275 });
    expect(jobs).toEqual([
        {
          id: testJobIds[2],
          title: "Job3",
          salary: 300,
          equity: '0',
          companyHandle: 'c1',
          companyName: "C1",
        },
      ]);
  });

  test('works by equity', async function() {
    let jobs = await Job.findAll({hasEquity: false });
    expect(jobs).toEqual([
        {
        id: testJobIds[0],
        title: 'Job1',
        salary: 100,
        equity: '0.1',
        companyHandle: 'c1',
        companyName: 'C1',
        },
        {
        id: testJobIds[1],
        title: 'Job2',
        salary: 200,
        equity: '0.2',   
        companyHandle: 'c1',
        companyName: 'C1',
        },
      ]);
  });

  test('works by min salary plus equity', async function() {
    let jobs = await Job.findAll({minSalary: 175, hasEquity: true });
    expect(jobs).toEqual([
        {
          id: testJobIds[1],
          title: "Job2",
          salary: 200,
          equity: '0.2',
          companyHandle: 'c1',
          companyName: "C1",
        },
      ]);
  });

  test('works by name', async function() {
    let jobs = await Job.findAll({title: 'b2'});
    expect(jobs).toEqual([
        {
          id: testJobIds[1],
          title: "Job2",
          salary: 200,
          equity: '0.2',
          companyHandle: 'c1',
          companyName: "C1",
        },
      ]);
  });
});


/************************************** GET  */

describe("get", function () {
  test("works", async function () {
    const job = await Job.get(testJobIds[1]);
    expect(job).toEqual({
      id: testJobIds[1], 
      title: "Job2",
      salary: 200,
      equity: 0.2,
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found for no such job", async function () {
    try {
        await Job.get(0);
        fail();
    }   catch (err) {
        expect(err instanceof NotFoundError == true);
    }
  });

  test('bad request with no data', async function () {
    try {
        await Job.update(testJobIds[0], {});
        fail();
    } catch (err) {
        expect(err instanceof BadRequestError == true);
    }

  });
});

//remove

describe('remove', function() {
    test('works', async function() {
        await Job.remove(testJobIds[0]);
        const res = await db.query(
            'SELECT if FROM jobs WHERE id =$1', [testJobIds[0]]);
        expect(res.rows.length).toEqual(0);
    });

    test("not found for no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        }   catch (err) {
            expect(err instanceof NotFoundError == true);
        }
      }); 
});
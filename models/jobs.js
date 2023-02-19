"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
    //create job, update db, return data. should include: title, salary, equity, companyHandle
  static async create(data) {
    const result = await db.query(
          `INSERT INTO jobs (title,
                            salary,
                            equity,
                            company_handle)
            VALUES ($1, $2, $3, $4)
            Returning id, title, salary, equity, company_handle AS "companyHandle"`,
        [
            data.title,
            data.salary,
            data.equity,
            data.companyHandle,
        ]);

    let job = result.rows[0];

    return job;
   }
   
  //Find all jobs. Include optional filters: minSalary, hasEquity, title. Return: id, title, salary, equity, companyHandle, companmyName

  static async findAll({ minSalary, hasEquity, title} = {}) {
    let query = `SELECT j.id,
                        j.title,
                        j.salary,
                        j.equity,
                        j.company_handle AS 'companyHandle',
                        c.name as 'companyName'
                FROM jobs j
                 LEFT JOIN companies as c on c.handle = j.company_handle`;
    let whereExpression = [];
    let queryValues = [];
    
    if (minSalary !== undefined) {
        queryValues.push(minSalary);
        whereExpression.push(`salary >= $${queryValues.length}`);
    }

    if (hasEquity === true) {
        whereExpression.push(`equity > 0`);
    }

    if (title !== undefined) {
      queryValues.push(`%${title}%`);
      whereExpression.push(`title ILIKE $${queryValues.length}`);
    }

    if (whereExpression.length > 0) {
        query += " WHERE " + whereExpression.join(" AND ");
    }

    query += " ORDER BY title";
    const jobResults = await db.query(query, queryValues);
    return jobResults.rows;
  }


  // returm job info based on job id

  static async get(id) {

    const jobResults = await db.query(
          `SELECT id
                  name,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, 
        [id]);

    const job = jobResults.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    const companiesRes = await db.query(
        `SELECT handle
                name,
                description,
                num_employees AS "numEmployees",
                logo_url as "logoURL",
         FROM companies
         WHERE handle = $1`, 
      [job.companyHandle]);
    
    delete job.companyHandle;
    job.company = companiesRes.rows[0];

    return job;
  }


   //update job info, passing in id and data

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const company = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return company;
  }


  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const company = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;

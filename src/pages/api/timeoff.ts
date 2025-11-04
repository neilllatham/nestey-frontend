// insert request into PostgreSQL database

import type { APIRoute } from "astro";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: import.meta.env.DATABASE_URL, // stored in .env
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { employee_id, startDate, endDate, type } = await request.json();

    if (!employee_id || !startDate || !endDate || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      INSERT INTO time_off_requests (
        employee_id, type, start_date, end_date, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'Pending', NOW(), NOW())
      RETURNING request_id, status
      `,
      [employee_id, type, startDate, endDate]
    );

    return new Response(
      JSON.stringify({
        message: "Request submitted successfully",
        request_id: result.rows[0].request_id,
        status: result.rows[0].status,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Failed to submit request" }),
      { status: 500 }
    );
  }
};

USE capstone_jobs;

INSERT INTO users (username, email, password_hash, role)
VALUES
  ('admin', 'admin@example.com', '$2b$10$VW4c2O3nFEjZi3obFNyvrus/HI27ubgHO3GaDokY0UhQqFQwytk06', 'admin'),
  ('student', 'student@example.com', '$2b$10$Q.fZ2E.i6/ndy0hDYW49PukSS/PtdHOdCG6.DBvYHGJl9M6Y1JJuy', 'user')
ON DUPLICATE KEY UPDATE email = VALUES(email);


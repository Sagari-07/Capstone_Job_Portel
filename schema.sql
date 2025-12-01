CREATE DATABASE IF NOT EXISTS capstone_jobs;
USE capstone_jobs;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id VARCHAR(64) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  applicant_name VARCHAR(120) NOT NULL,
  applicant_email VARCHAR(150) NOT NULL,
  resume_file_path VARCHAR(255) NOT NULL,
  user_id INT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_job_applications_users FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE SET NULL
);


CREATE TABLE project (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100),
  client_email VARCHAR(120),
  work_system VARCHAR(100),
  subsystem VARCHAR(100),
  specialty VARCHAR(100),
  work_location VARCHAR(100),
  project_contract VARCHAR(100),
  area VARCHAR(100)
);

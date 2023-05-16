const Department = require('./lib/department');
const Role = require('./lib/role');
const Employee = require('./lib/employee')

const inquirer = require('inquirer');
const connection = require('./db/connection');
const mysql = require('mysql2');
const cTable = require('console.table');



const runSearch = () => {
  inquirer.prompt({
    name: 'action',
    type: 'list',
    message: 'What may I assist you with today?',
    choices: [
      'View all employees',
      'View all employees by department',
      'View all employees by manager',
      'Add an employee',
      'Remove an employee',
      'Update an existing employee job role',
      'Update an employee manager',
      'View all job roles',
      'Add a new job role',
      'Remove a job role',
      'View all departments',
      'Add a department',
      'Remove a department',
      'Exit',
    ],
  }).then(answer => {
    switch(answer.action) {
      case 'View all employees':
        viewAllEmployees();
        break;
      case 'View all employees by department':
        viewAllEmployeesByDepartment();
        break;
      case 'View all employees by manager':
        viewAllEmployeesByManager();
        break;
      case 'Add an employee':
        addEmployee();
        break;
      case 'Remove an employee':
        removeEmployee();
        break;
      case 'Update an existing employee job role':
        updateEmployeeRole();
        break;
      case 'Update an employee manager':
        updateEmployeeManager();
        break;
      case 'View all job roles':
        viewAllRoles();
        break;
      case 'Add a new job role':
        addRole();
        break;
      case 'Remove a job role':
        removeRole();
        break;
      case 'View all departments':
        viewAllDepartments();
        break;
      case 'Add a department':
        addDepartment();
        break;
      case 'Remove a department':
        removeDepartment();
        break;
      case 'Exit':
        connection.end();
        break;
      default:
            console.log(`Invalid action: ${answer.action}`);
        break;
    }
  });
};

const viewAllEmployees = () => {
  const query = `
    SELECT ei.id, ei.first_name, ei.last_name, jr.title, d.name AS department, jr.income, CONCAT(eim.first_name, ' ', eim.last_name) AS manager
    FROM employee_info ei
    LEFT JOIN job_role jr ON ei.position_id = jr.id
    LEFT JOIN department d ON jr.department_id = d.id
    LEFT JOIN employee_info eim ON eim.id = ei.manager_id
  `;

  connection.query(query, (err, res) => {
    if (err) throw err;
    console.table(res);
    runSearch();
  });
};

const getDepartments = () => {
  return new Promise((resolve, reject) => {
    connection.promise().query('SELECT * FROM department')
      .then(([rows, fields]) => {
        const departmentChoices = rows.map(department => ({
          name: department.name,
          value: department.id
        }));
        resolve(departmentChoices);
      })
      .catch(reject);
  });
};

const viewAllEmployeesByDepartment = async () => {
  try {
    const departmentChoices = await getDepartments();

    const answer = await inquirer.prompt({
      name: "department",
      type: "list",
      message: "Which department would you like to view?",
      choices: departmentChoices,
    });

    const query = `
      SELECT ei.id, ei.first_name, ei.last_name, jr.title, d.name AS department, jr.income, CONCAT(eim.first_name, ' ', eim.last_name) AS manager
      FROM employee_info ei
      LEFT JOIN job_role jr ON ei.position_id = jr.id
      LEFT JOIN department d ON jr.department_id = d.id
      LEFT JOIN employee_info eim ON eim.id = ei.manager_id
      WHERE d.id = ?`; // Use "d.id" instead of "d.name"

    const [rows, fields] = await connection.promise().query(query, [answer.department]);
    console.table(rows);

    runSearch();
  } catch (error) {
    console.log(`Error: ${error.message}`);
    runSearch();
  }
};


// Function to retrieve a list of managers
// Function to retrieve a list of managers
const getManagers = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id, first_name, last_name FROM employee_info WHERE manager_id IS NULL';

    connection.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        const managers = results.map((row) => ({
          name: `${row.first_name} ${row.last_name}`,
          value: row.id,
        }));
        resolve(managers);
      }
    });
  });
};

// Function to view all employees by manager
const viewAllEmployeesByManager = async () => {
  try {
    const managerChoices = await getManagers();

    const answer = await inquirer.prompt({
      name: "manager",
      type: "list",
      message: "Which manager would you like to view?",
      choices: managerChoices,
    });

    const query = `
      SELECT ei.id, ei.first_name, ei.last_name, jr.title, d.name AS department, jr.income, CONCAT(eim.first_name, ' ', eim.last_name) AS manager
      FROM employee_info ei
      LEFT JOIN job_role jr ON ei.position_id = jr.id
      LEFT JOIN department d ON jr.department_id = d.id
      LEFT JOIN employee_info eim ON eim.id = ei.manager_id
      WHERE CONCAT(eim.first_name, ' ', eim.last_name) = ?`;

    const [rows, fields] = await connection.promise().query(query, [answer.manager]);
    console.table(rows);

    runSearch();
  } catch (error) {
    console.log(`Error: ${error.message}`);
    runSearch();
  }
};




// Function to validate if an input is provided
const validateRequiredInput = (input) => {
  if (input.trim() === "") {
    return "This input is required. Please enter a value.";
  }
  return true;
};

// Function to display the main menu
const mainMenu = async () => {
  try {
    const answer = await inquirer.prompt({
      name: "action",
      type: "list",
      message: "What would you like to do?",
      choices: [
        "View all employees",
        "View all employees by department",
        "View all employees by manager",
        "Add employee",
        "Exit",
      ],
    });

    switch (answer.action) {
      case "View all employees":
        viewAllEmployees();
        break;
      case "View all employees by department":
        viewAllEmployeesByDepartment();
        break;
      case "View all employees by manager":
        viewAllEmployeesByManager();
        break;
      case "Add employee":
        addEmployee();
        break;
      case "Exit":
        connection.end();
        process.exit();
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
    mainMenu();
  }
};

// Function to fetch job roles from the database
// Get job roles from the database
const getJobRoles = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id, title FROM job_role';

    connection.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        const jobRoles = results.map((row) => ({ name: row.title, value: row.id }));
        resolve(jobRoles);
      }
    });
  });
};

// Function to add an employee
// Add Employee
const addEmployee = () => {
  // Prompt for employee details
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'firstName',
        message: "Enter the employee's first name:",
      },
      {
        type: 'input',
        name: 'lastName',
        message: "Enter the employee's last name:",
      },
      {
        type: 'list',
        name: 'jobRoleId',
        message: 'Select the employee job role:',
        choices: getJobRoles(),
      },
      {
        type: 'list',
        name: 'managerId',
        message: 'Select the employee manager:',
        choices: getManagers(),
      },
    ])
    .then((answers) => {
      // Add employee to the database
      const { firstName, lastName, jobRoleId, managerId } = answers;
      const query = 'INSERT INTO employee_info (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)';
      const values = [firstName, lastName, jobRoleId, managerId];

      connection.query(query, values, (error) => {
        if (error) {
          throw new Error(`Failed to add employee: ${error.message}`);
        }
        console.log('Employee added successfully!');
        mainMenu();
      });
    });
};






const updateEmployeeRole = () => {
  // First, query the database for all employees and job roles
  const sql = `SELECT employee_info.id, CONCAT(employee.first_name, ' ', employee_info.last_name) AS employee_name, job_role.id AS job_role_id, job_role.title AS role_title FROM employee_info INNER JOIN job_role ON employee_info.job_role_id = job_role.id`;

  connection.query(sql, (err, res) => {
    if (err) throw err;

    // Prompt the user to select an employee to update and a new job role
    inquirer.prompt([
      {
        name: 'employee',
        type: 'list',
        message: 'Which employee would you like to update?',
        choices: res.map(employee => ({ name: employee.employee_name, value: employee.id })),
      },
      {
        name: 'role',
        type: 'list',
        message: 'What is the employee\'s new job role?',
        choices: [...new Set(res.map(employee => ({ name: employee.role_title, value: employee.role_id })))],
      },
    ])
    .then(answer => {
      // Update the employee's job role in the database
      const sql = `UPDATE employee_info SET role_id = ? WHERE id = ?`;

      connection.query(sql, [answer.role, answer.employee], (err, res) => {
        if (err) throw err;

        console.log(`Successfully updated employee's job role!`);

        // Return to the main menu
        runSearch();
      });
    });
  });
}

const updateEmployeeManager = async () => {
  try {
    // get all employees to choose from
    const employees = await db.findAllEmployees();

    // prompt user to select an employee to update
    const { employeeId } = await inquirer.prompt({
      name: 'employeeId',
      type: 'list',
      message: 'Which employee do you want to update?',
      choices: employees.map(({ id, first_name, last_name }) => ({
        name: `${first_name} ${last_name}`,
        value: id,
      })),
    });

    // get all possible managers to choose from (exclude current employee)
    const managers = await db.findAllPossibleManagers(employeeId);

    // prompt user to select a new manager
    const { managerId } = await inquirer.prompt({
      name: 'managerId',
      type: 'list',
      message: 'Who is the employee\'s new manager?',
      choices: managers.map(({ id, first_name, last_name }) => ({
        name: `${first_name} ${last_name}`,
        value: id,
      })),
    });

    // update the employee with the new manager
    await db.updateEmployeeManager(employeeId, managerId);

    console.log('Employee manager updated successfully.');
  } catch (err) {
    console.error(err);
  }
};

const viewAllRoles = () => {
  connection.query(
    `SELECT job_role.id, job_role.title, department.name AS department, job_role.salary 
    FROM job_role 
    LEFT JOIN department ON job_role.department_id = department.id 
    ORDER BY job_role.id`,
    (err, res) => {
      if (err) throw err;
      console.table(res);
      runSearch();
    }
  );
};

const addRole = async () => {
  try {
    const departments = await db.findAllDepartments();

    const roleData = await inquirer.prompt([
      {
        name: 'title',
        type: 'input',
        message: 'What is the title of the role?',
      },
      {
        name: 'salary',
        type: 'input',
        message: 'What is the salary of the role?',
        validate(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return 'Please enter a valid number';
        },
      },
      {
        name: 'departmentId',
        type: 'list',
        message: 'Which department does the role belong to?',
        choices: departments.map(({ id, name }) => ({
          name: name,
          value: id,
        })),
      },
    ]);

    await db.createJobRole(roleData);

    console.log('The job role was successfully added!');
  } catch (err) {
    console.error(err);
  }
};


const removeRole = () => {
  connection.query('SELECT * FROM job_role', (err, results) => {
    if (err) throw err;

    inquirer.prompt([
      {
        name: 'role_id',
        type: 'rawlist',
        choices: () => results.map(role => ({ name: role.title, value: role.id })),
        message: 'Which role do you want to remove?'
      }
    ]).then(answer => {
      connection.query('DELETE FROM job_role WHERE id = ?', [answer.role_id], (err, res) => {
        if (err) throw err;

        console.log(`${res.affectedRows} role has been removed from the database.`);

        start();
      });
    });
  });
};


const viewAllDepartments = () => {
  connection.query(
    `SELECT id AS "Department ID", name AS "Department Name" FROM department`,
    (err, res) => {
      if (err) throw err;
      console.table(res);
      runSearch();
    }
  );
};

const addDepartment = () => {
  inquirer.prompt({
    name: 'departmentName',
    type: 'input',
    message: 'What is the name of the new department?',
    validate: validateStringInput
  }).then(answer => {
    const query = 'INSERT INTO department (name) VALUES (?)';
    connection.query(query, [answer.departmentName], (err, res) => {
      if (err) throw err;
      console.log(`${res.affectedRows} department added!\n`);
      runSearch();
    });
  });
};


const removeDepartment = async () => {
  try {
    const departments = await getDepartments();
    const departmentChoices = departments.map(({ id, name }) => ({
      name: name,
      value: id,
    }));

    const { departmentId } = await inquirer.prompt({
      name: 'departmentId',
      type: 'list',
      message: 'Which department would you like to remove?',
      choices: departmentChoices,
    });

    await db.promise().query('DELETE FROM department WHERE id = ?', departmentId);

    console.log(`Department with ID ${departmentId} has been removed.\n`);

    runSearch();
  } catch (err) {
    console.log(err);
  }
};

const endConnection = () => {
  connection.end(err => {
    if (err) throw err;
    console.log('Connection ended.');
  });
};

const init = () => {
  console.log('Application started!');
  // ...
};
runSearch();
init();
// endConnection();
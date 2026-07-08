const mysql = require('mysql2/promise');

async function create() {
  try {
    const connection = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
    await connection.query('CREATE DATABASE IF NOT EXISTS `agunan_db`;');
    console.log('Database agunan_db created or already exists');
    process.exit(0);
  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  }
}

create();

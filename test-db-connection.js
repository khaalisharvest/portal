const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    host: 'postgres-production-a4c2.up.railway.app',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'oulQLxTSbhOYZnuGBONPjSipnMdMOpDH',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Attempting to connect to Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Successfully connected to Railway PostgreSQL!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📊 Database Info:');
    console.log('   Current Time:', result.rows[0].current_time);
    console.log('   PostgreSQL Version:', result.rows[0].postgres_version);
    
    await client.end();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

testConnection();


// db/seed-user.js
// Seed script to create a default administrator staff account

const bcrypt = require('bcryptjs');
const readline = require('readline');
const pool = require('./db');

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

async function seedUser() {
    try {
        let username = process.env.SEED_ADMIN_USER;
        let password = process.env.SEED_ADMIN_PASS;

        // If credentials are not in environment variables, check if we can prompt
        if (!username || !password) {
            if (process.stdin.isTTY) {
                console.log('🔑 Credentials not found in environment variables.');
                if (!username) {
                    username = await askQuestion('Enter Admin Username (default: admin): ');
                    username = username.trim() || 'admin';
                }
                if (!password) {
                    password = await askQuestion('Enter Admin Password (default: Password123!): ');
                    password = password || 'Password123!';
                }
            } else {
                // Fallback to default
                username = username || 'admin';
                password = password || 'Password123!';
            }
        }

        console.log(`👤 Seeding staff user "${username}"...`);
        const normalizedUser = username.trim().toLowerCase();
        const hash = await bcrypt.hash(password, 10);

        const check = await pool('users').select('username').where({ username: normalizedUser }).first();
        if (check) {
            await pool('users').where({ username: normalizedUser }).update({ password_hash: hash });
            console.log(`🎉 Password for staff user "${normalizedUser}" updated successfully!`);
        } else {
            await pool('users').insert({ username: normalizedUser, password_hash: hash });
            console.log(`🎉 Staff user "${normalizedUser}" created successfully!`);
        }
        process.exit(0);
    } catch (err) {
        console.error('💥 Error seeding user:', err);
        process.exit(1);
    }
}

seedUser();

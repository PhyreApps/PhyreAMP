import { app } from 'electron';
import { generateHttpdConf } from './virtualHostBuilder';
import path from 'node:path';
import sqlite3 from 'sqlite3';

const dbPath = path.join(app.getPath('userData'), 'virtual_hosts.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS virtual_hosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        document_root TEXT NOT NULL,
        php_version TEXT NOT NULL,
        local_domain TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        redisPort TEXT,
        mysqlPort TEXT,
        httpdPort TEXT,
        allowedPhpVersions TEXT
    )`);
});
export const getVirtualHosts = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM virtual_hosts`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

export const saveSettings = (settings) => {
    return new Promise((resolve, reject) => {
        const { redisPort, mysqlPort, httpdPort, allowedPhpVersions } = settings;
        const allowedPhpVersionsString = JSON.stringify(allowedPhpVersions);
        db.run(
            `INSERT INTO settings (redisPort, mysqlPort, httpdPort, allowedPhpVersions) VALUES (?, ?, ?, ?)`,
            [redisPort, mysqlPort, httpdPort, allowedPhpVersionsString],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ success: true });
                }
            }
        );
    });
};

export const getSettings = () => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM settings ORDER BY id DESC LIMIT 1`, (err, row) => {
            if (err) {
                reject(err);
            } else {
                if (row) {
                    row.allowedPhpVersions = JSON.parse(row.allowedPhpVersions);
                }
                resolve(row);
            }
        });
    });
};

export const removeVirtualHost = (id) => {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM virtual_hosts WHERE id = ?`, [id], function (err) {
            if (err) {
                reject(err);
            } else {
                generateHttpdConf().then(resolve).catch(reject);
            }
        });
    });
};

export const saveVirtualHost = (data) => {
    return new Promise((resolve, reject) => {
        const { name, document_root, php_version, local_domain } = data;
        db.run(
            `INSERT INTO virtual_hosts (name, document_root, php_version, local_domain) VALUES (?, ?, ?, ?)`,
            [name, document_root, php_version, local_domain],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    generateHttpdConf().then(() => resolve(this.lastID)).catch(reject);
                }
            }
        );
    });
};

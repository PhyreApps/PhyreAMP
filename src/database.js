import { app } from 'electron';
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
});

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
                    resolve(this.lastID);
                }
            }
        );
    });
};

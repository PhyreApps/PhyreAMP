import { app } from 'electron';
import { generateHttpdConf } from './virtualHostBuilder';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import {appConfig} from "./config";

const dbPath = path.join(app.getPath('userData'), appConfig.prefix + '.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS virtual_hosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        document_root TEXT,
        php_version TEXT NOT NULL,
        local_domain TEXT NOT NULL,
        project_path TEXT NOT NULL,
        public_folder TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )`);
});
export const getVirtualHosts = (createDefault = false) => {
    return new Promise((resolve, reject) => {
        const rows = db.all(`SELECT * FROM virtual_hosts`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
                if(createDefault){
                    createDefaultHost(rows);
                }
            }
        });
    });
};

export const createDefaultHost = (rows) => {
    const hasDefaultLocalhost = rows.filter(row => row.local_domain === appConfig.defaultApp.host);
    if (hasDefaultLocalhost.length == 0) {
        let folder = app.getPath('userData') + '/htdocs'
        if (appConfig.defaultApp.folder != 'htdocs') {
            folder = appConfig.defaultApp.folder
        }
        db.run(`
                INSERT INTO "virtual_hosts" ("name", "document_root", "php_version", "local_domain", "project_path", "public_folder")
                VALUES ('${appConfig.defaultApp.name}', NULL, '${appConfig.defaultApp.phpVersion}', '${appConfig.defaultApp.host}', '${folder}', '/');
        `);
    }
}

export const saveSettings = (settings) => {
    return new Promise((resolve, reject) => {
        const queries = Object.entries(settings).map(([key, value]) => {
            return new Promise((resolve, reject) => {
                db.run(
                    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
                    [key, typeof value === 'object' ? JSON.stringify(value) : value],
                    function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    }
                );
            });
        });

        Promise.all(queries)
            .then(() => resolve({ success: true }))
            .catch(reject);
    });
};

export const getSettings = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM settings`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const settings = {};
                rows.forEach(({ key, value }) => {
                    try {
                        settings[key] = JSON.parse(value);
                    } catch {
                        settings[key] = value;
                    }
                });
                resolve(settings);
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
        const { name, document_root, php_version, local_domain, project_path, public_folder } = data;
        db.run(
            `INSERT INTO virtual_hosts (name, document_root, php_version, local_domain, project_path, public_folder) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, document_root, php_version, local_domain, project_path, public_folder],
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


export const updateVirtualHost = (id, data) => {
    return new Promise((resolve, reject) => {
        const { name, php_version, local_domain, project_path, public_folder } = data;
        db.run(
            `UPDATE virtual_hosts SET name = ?, php_version = ?, local_domain = ?, project_path = ?, public_folder = ? WHERE id = ?`,
            [name, php_version, local_domain, project_path, public_folder, id],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    generateHttpdConf().then(resolve).catch(reject);
                }
            }
        );
    });
};

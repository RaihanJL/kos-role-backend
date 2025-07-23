import { Sequelize } from "sequelize";

const db = new Sequelize('railway', 'root', 'BkWHpxSDNeluPQXVbQbHTmvQKykarfdR', {
    host: 'switchback.proxy.rlwy.net',
    port: 53790,
    dialect: 'mysql',
});

export default db;

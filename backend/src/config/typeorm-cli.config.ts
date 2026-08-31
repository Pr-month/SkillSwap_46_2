import { DataSource } from 'typeorm';
import { dbConfig } from './db.config';

export default new DataSource(dbConfig());
